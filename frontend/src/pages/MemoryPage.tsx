import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import {
  Brain,
  Target,
  Heart,
  LineChart,
  AlertTriangle,
  User,
  Shield,
  Trash2
} from 'lucide-react'

interface Insight {
  id: number
  type: string
  icon: string
  label: string
  source: string
  confidence: number
  explicit: boolean
  date: string
}

const TYPE_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  goal: { color: 'text-emerald-400 border-l-emerald-500 bg-emerald-500/10', label: 'Goals', icon: Target },
  preference: { color: 'text-rose-400 border-l-rose-500 bg-rose-500/10', label: 'Preferences', icon: Heart },
  pattern: { color: 'text-sky-400 border-l-sky-500 bg-sky-500/10', label: 'Patterns', icon: LineChart },
  challenge: { color: 'text-saffron-400 border-l-saffron-500 bg-saffron-500/10', label: 'Challenges', icon: AlertTriangle },
  value: { color: 'text-purple-400 border-l-purple-500 bg-purple-500/10', label: 'Values', icon: User }
}

export function MemoryPage() {
  const [insights, setInsights] = useState<Insight[]>([])

  // Privacy controls
  const [autoExtract, setAutoExtract] = useState(
    localStorage.getItem('neeti-privacy-autoextract') !== 'false'
  )
  const [useMemory, setUseMemory] = useState(
    localStorage.getItem('neeti-privacy-usememory') !== 'false'
  )
  const [shareData, setShareData] = useState(
    localStorage.getItem('neeti-privacy-sharedata') === 'true'
  )

  useEffect(() => {
    apiClient.get<Insight[]>('/insights')
      .then((r) => setInsights(r.data || []))
      .catch(() => {})
  }, [])

  const handleToggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val)
    localStorage.setItem(key, String(val))
  }

  const deleteInsight = async (id: number) => {
    try {
      await apiClient.delete(`/insights/${id}`)
      setInsights(insights.filter((x) => x.id !== id))
    } catch (e) {}
  }

  const clearMemory = async () => {
    if (window.confirm('Are you sure you want to delete all stored profile memory? This cannot be undone.')) {
      try {
        // Clear sequentially
        for (const ins of insights) {
          await apiClient.delete(`/insights/${ins.id}`)
        }
        setInsights([])
      } catch (e) {}
    }
  }

  // Count items by type
  const counts = insights.reduce(
    (acc, cur) => {
      acc[cur.type] = (acc[cur.type] || 0) + 1
      return acc
    },
    { goal: 0, preference: 0, pattern: 0, challenge: 0, value: 0 } as Record<string, number>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-saffron-500 uppercase tracking-widest block mb-1">
          Memory Engine
        </span>
        <h2 className="text-3xl font-bold font-display text-wisdom-100 flex items-center gap-2">
          Memory & Insights
        </h2>
        <p className="text-sm text-wisdom-400 mt-1">
          NEETI learns from every conversation. These insights personalize your advice and improve reasoning relevance.
        </p>
      </div>

      {/* Group Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 select-none">
        {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((type) => {
          const config = TYPE_CONFIG[type]
          const Icon = config.icon
          const count = counts[type] || 0
          return (
            <div
              key={type}
              className={`glass-card border-l-[3px] border-y border-r border-wisdom-700/40 p-4 rounded-xl flex flex-col justify-between ${config.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-wisdom-400">
                  {config.label}
                </span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <h4 className="text-2xl font-bold font-display text-wisdom-100 mt-3">{count}</h4>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Left is insights list, Right is knows you summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Insights list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest px-1">
            All Insights ({insights.length})
          </div>

          <div className="space-y-3">
            {insights.map((ins) => {
              const config = TYPE_CONFIG[ins.type] || TYPE_CONFIG.goal
              const typeColor = ins.type === 'goal' ? 'bg-emerald-500/10 text-emerald-400' :
                                ins.type === 'preference' ? 'bg-rose-500/10 text-rose-400' :
                                ins.type === 'pattern' ? 'bg-sky-500/10 text-sky-400' :
                                ins.type === 'challenge' ? 'bg-saffron-500/10 text-saffron-400' :
                                'bg-purple-500/10 text-purple-400'
              return (
                <div
                  key={ins.id}
                  className="glass-card border border-wisdom-700/40 p-4.5 rounded-xl flex gap-4 items-start hover:border-wisdom-700/80 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-wisdom-900 border border-wisdom-700/40 flex items-center justify-center text-lg shrink-0 select-none">
                    {ins.icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-wisdom-100 leading-relaxed font-body">
                        {ins.label}
                      </p>
                      {ins.explicit && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider select-none shrink-0">
                          Explicit
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-wisdom-500 font-medium select-none">
                      {ins.source} · {ins.date}
                    </div>

                    {/* Progress Slider */}
                    <div className="flex items-center gap-3 select-none">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeColor}`}>
                        {ins.type}
                      </span>
                      <div className="flex-1 h-1.5 bg-wisdom-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-saffron-500"
                          style={{ width: `${ins.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-wisdom-400 min-w-10">
                        {Math.round(ins.confidence * 100)}% conf
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteInsight(ins.id)}
                    className="p-1.5 rounded-lg border border-wisdom-700/40 bg-wisdom-900/50 hover:border-red-500/30 text-wisdom-500 hover:text-red-400 shrink-0 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}

            {insights.length === 0 && (
              <div className="glass-card border border-wisdom-700/40 rounded-xl p-12 text-center text-wisdom-500 select-none">
                <Brain className="w-10 h-10 text-wisdom-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-wisdom-300">Memory is empty</h3>
                <p className="text-xs text-wisdom-500 mt-1">No profile insights extracted yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: knows you summary + Privacy */}
        <div className="space-y-6 select-none">
          {/* NEETI knows you as */}
          <div className="glass-card border border-saffron-500/15 bg-gradient-to-br from-saffron-500/5 to-wisdom-900/10 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 border-b border-wisdom-700/20 pb-3">
              <Brain className="w-5 h-5 text-saffron-500" />
              <h3 className="text-sm font-bold text-wisdom-100 font-display">
                NEETI knows you as...
              </h3>
            </div>
            <p className="text-xs text-wisdom-300 leading-relaxed font-body">
              A knowledge-driven leader who values ancient wisdom, prefers principle-based reasoning over tactical shortcuts, and is building a systematic approach to strategic decision-making under uncertainty.
            </p>
          </div>

          {/* Privacy controls */}
          <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-wisdom-700/20 pb-3">
              <Shield className="w-4 h-4 text-saffron-500" />
              <h3 className="text-sm font-semibold text-wisdom-100">
                Privacy Controls
              </h3>
            </div>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-wisdom-300">Auto-extract insights from chat</span>
                <button
                  onClick={() => handleToggle('neeti-privacy-autoextract', !autoExtract, setAutoExtract)}
                  className={`w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 ${
                    autoExtract ? 'bg-saffron-500' : 'bg-wisdom-800'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${
                      autoExtract ? 'left-4.5' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-wisdom-300">Use memory to personalize responses</span>
                <button
                  onClick={() => handleToggle('neeti-privacy-usememory', !useMemory, setUseMemory)}
                  className={`w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 ${
                    useMemory ? 'bg-saffron-500' : 'bg-wisdom-800'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${
                      useMemory ? 'left-4.5' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-wisdom-300">Share anonymous usage data</span>
                <button
                  onClick={() => handleToggle('neeti-privacy-sharedata', !shareData, setShareData)}
                  className={`w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 ${
                    shareData ? 'bg-saffron-500' : 'bg-wisdom-800'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${
                      shareData ? 'left-4.5' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-wisdom-700/20 pt-4 flex gap-2">
                <button
                  onClick={clearMemory}
                  className="flex-1 py-2 px-3 border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
