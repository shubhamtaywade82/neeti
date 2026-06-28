import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import {
  MessageSquare,
  Library,
  Brain,
  Network,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react'

interface Conversation {
  id: number
  title: string
  created_at: string
  advisor?: string
}

// Mock desc for descriptions and colors
const ACTIVE_PACKS_METADATA: Record<string, { emoji: string; name: string; desc: string; nodeCount: number; edgeCount: number; color: string }> = {
  chanakya: { emoji: '🪔', name: 'Chanakya Neeti', desc: 'Ancient Indian treatise on statecraft, economics, and political strategy. Leadership and governance wisdom.', nodeCount: 432, edgeCount: 1280, color: 'border-saffron-500' },
  gita: { emoji: '🌺', name: 'Bhagavad Gita', desc: 'Dialogue between Prince Arjuna and Lord Krishna on duty, self-mastery, detachment, and righteousness.', nodeCount: 700, edgeCount: 2100, color: 'border-emerald-500' },
  arthashastra: { emoji: '⚖️', name: 'Arthashastra', desc: 'Comprehensive treatise on statecraft, economic policy, and military strategy by Kautilya.', nodeCount: 3421, edgeCount: 7802, color: 'border-indigo-500' },
  stoic: { emoji: '🏛️', name: 'Stoic Meditations', desc: 'Private reflections of Marcus Aurelius on virtue, reason, resilience, and clarity.', nodeCount: 310, edgeCount: 890, color: 'border-slate-400' },
  sunzi: { emoji: '🎴', name: 'The Art of War', desc: 'Classic treatise on military strategy, conflict management, and tactical positioning.', nodeCount: 260, edgeCount: 720, color: 'border-red-500' },
  atomic: { emoji: '⚡', name: 'Atomic Habits', desc: 'Frameworks for building good habits and breaking bad ones through tiny changes.', nodeCount: 180, edgeCount: 540, color: 'border-sky-500' },
}

export function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [installedPacks, setInstalledPacks] = useState<string[]>(['chanakya', 'gita'])
  const navigate = useNavigate()

  useEffect(() => {
    apiClient.get<Conversation[]>('/conversations')
      .then((r) => setConversations(r.data))
      .catch(() => {})

    const stored = localStorage.getItem('neeti-installed-packs')
    if (stored) {
      try {
        setInstalledPacks(JSON.parse(stored))
      } catch (e) {}
    }
  }, [])

  const startChatPrompt = (query: string) => {
    navigate(`/chat?query=${encodeURIComponent(query)}`)
  }

  const loadConversation = (id: number) => {
    navigate(`/chat?convoId=${id}`)
  }

  // Get active packs details
  const activePacks = installedPacks.map((id) => ({ id, ...ACTIVE_PACKS_METADATA[id] })).filter(Boolean)

  const quickPrompts = [
    'How do I handle a difficult team member?',
    'What does Chanakya say about patience?',
    'Compare Gita and Chanakya on detachment',
    'Help me build a morning discipline routine',
  ]

  const recentActivity = [
    { dot: '#e05e11', text: 'Asked Advisor: How should I handle a disloyal counselor?', detail: 'Chanakya Neeti + Gita · 2 citations', time: '5 minutes ago' },
    { dot: '#10b981', text: 'Explored Theme → Leadership → Counsel cluster', detail: '12 related nodes discovered', time: '2 hours ago' },
    { dot: '#6366f1', text: 'Saved collection: On Strategic Patience', detail: '7 sutras from Ch. 3, 7, 11', time: 'Yesterday, 11:40 AM' },
    { dot: '#94a3b8', text: 'Started conversation: Principles of effective delegation', detail: 'Chanakya Neeti · 6 exchanges', time: '2 days ago' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <span className="text-[10px] font-bold text-saffron-500 uppercase tracking-widest block mb-1">
            Dashboard
          </span>
          <h1 className="text-3xl font-bold font-display text-wisdom-100">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-300 to-saffron-500">Strategist</span>
          </h1>
          <p className="text-sm text-wisdom-400 mt-1">
            Your knowledge graph has <strong className="text-wisdom-200">3,849</strong> nodes across <strong className="text-wisdom-200">{installedPacks.length}</strong> active packs.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => navigate('/packs')}
            className="flex items-center gap-2 px-4 py-2.5 bg-wisdom-800 hover:bg-wisdom-700/80 border border-wisdom-700/50 rounded-xl text-xs font-semibold text-wisdom-200 transition-colors"
          >
            <Library className="w-4 h-4" />
            Manage Packs
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="btn-primary flex items-center gap-2 !py-2.5 !px-4 !text-xs"
          >
            <MessageSquare className="w-4 h-4" />
            New Conversation
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversations', value: conversations.length, sub: 'All threads', icon: MessageSquare, color: 'text-saffron-400 bg-saffron-500/10 border-saffron-500/10' },
          { label: 'Knowledge Packs', value: `${installedPacks.length}/6`, sub: 'Installed ratio', icon: Library, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' },
          { label: 'Insights Learned', value: '19', sub: 'Extracted about you', icon: Brain, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10' },
          { label: 'Graph Connections', value: '3.9K', sub: 'Cross-references', icon: Network, color: 'text-sky-400 bg-sky-500/10 border-sky-500/10' },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="glass-card border border-wisdom-700/40 p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-wisdom-700/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-wisdom-400 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-semibold text-wisdom-100 font-display">
                  {stat.value}
                </h3>
                <p className="text-[11px] text-wisdom-500 mt-1">
                  {stat.sub}
                </p>
              </div>
              <div className="absolute right-[-10px] bottom-[-20px] font-display text-8xl text-wisdom-800/10 group-hover:text-wisdom-800/20 select-none pointer-events-none transition-colors duration-300">
                नी
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Recent chats + Quick Start */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Chats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-wisdom-100 font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-saffron-500" />
              Recent Conversations
            </h2>
            <button
              onClick={() => navigate('/chat')}
              className="text-xs text-saffron-400 hover:text-saffron-300 flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {conversations.slice(0, 3).map((convo) => (
              <div
                key={convo.id}
                onClick={() => loadConversation(convo.id)}
                className="glass-card border border-wisdom-700/40 p-4 rounded-xl hover:border-saffron-500/30 cursor-pointer transition-all duration-200 flex gap-4 items-start group"
              >
                <div className="w-9 h-9 rounded-lg bg-wisdom-800 border border-wisdom-700 flex items-center justify-center text-wisdom-400 group-hover:text-saffron-400 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-sm font-semibold text-wisdom-200 group-hover:text-wisdom-100 truncate transition-colors">
                      {convo.title || 'Untitled Conversation'}
                    </h4>
                    <span className="text-[10px] text-wisdom-500 shrink-0">
                      {new Date(convo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-wisdom-400 mt-1 line-clamp-1">
                    Strategy advisor session grounding questions under active personas.
                  </p>
                  {convo.advisor && (
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-saffron-500/10 border border-saffron-500/20 text-saffron-400 uppercase tracking-wider">
                        {convo.advisor}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="glass-card border border-wisdom-700/40 rounded-xl p-8 text-center text-wisdom-500">
                <MessageSquare className="w-8 h-8 text-wisdom-600 mx-auto mb-2" />
                <p className="text-sm">No conversations yet</p>
                <button
                  onClick={() => navigate('/chat')}
                  className="text-xs text-saffron-400 hover:underline mt-1"
                >
                  Start your first conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Start + Latest Insight */}
        <div className="space-y-6">
          {/* Quick Start Card */}
          <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-semibold text-wisdom-100 font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-saffron-500" />
              Quick Start Prompts
            </h2>
            <div className="flex flex-col gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => startChatPrompt(prompt)}
                  className="w-full text-left text-xs text-wisdom-400 hover:text-saffron-300 hover:bg-wisdom-800/40 border border-wisdom-700/30 hover:border-saffron-500/20 px-3 py-2.5 rounded-xl transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Latest Insight Card */}
          <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-3">
            <h2 className="text-sm font-semibold text-wisdom-100 font-display flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-500" />
              Latest Inferred Insight
            </h2>
            <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                🎯 Goal
              </span>
              <p className="text-xs text-wisdom-300 leading-relaxed">
                Building a sustainable trading system with strict risk management parameters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Installed Knowledge Packs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-wisdom-100 font-display flex items-center gap-2">
            <Library className="w-4 h-4 text-saffron-500" />
            Your Knowledge Packs
          </h2>
          <button
            onClick={() => navigate('/packs')}
            className="text-xs text-saffron-400 hover:text-saffron-300 flex items-center gap-0.5"
          >
            Browse all packs
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePacks.map((pack) => {
            if (!pack) return null
            return (
              <div
                key={pack.id}
                className={`glass-card border-l-[3px] border-y border-r border-wisdom-700/40 p-5 rounded-2xl flex flex-col justify-between hover:border-wisdom-700/80 transition-all duration-200 ${pack.color}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pack.emoji}</span>
                      <h4 className="text-sm font-bold text-wisdom-100">
                        {pack.name}
                      </h4>
                    </div>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-wisdom-400 mt-3.5 leading-relaxed line-clamp-2">
                    {pack.desc}
                  </p>
                </div>
                <div className="text-[10px] text-wisdom-500 mt-4 font-semibold border-t border-wisdom-700/20 pt-3 flex justify-between">
                  <span>{pack.nodeCount} nodes</span>
                  <span>{pack.edgeCount} relations</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-wisdom-100 font-display flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-saffron-500" />
          Recent Activity Log
        </h2>
        <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
          {recentActivity.map((activity, idx) => (
            <div
              key={idx}
              className="flex gap-3 text-xs leading-relaxed border-b border-wisdom-700/10 last:border-0 pb-3 last:pb-0"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: activity.dot }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-wisdom-200 font-medium truncate">{activity.text}</p>
                <span className="text-[10px] text-wisdom-500 block mt-0.5">{activity.detail}</span>
              </div>
              <span className="text-[10px] text-wisdom-500 shrink-0 self-center">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
