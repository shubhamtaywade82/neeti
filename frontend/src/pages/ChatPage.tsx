import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Menu, BookOpen } from 'lucide-react'
import { ChatWindow } from '../components/ChatWindow'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { SutraDetailDrawer } from '../components/SutraDetailDrawer'
import type { CitedSutra } from '../components/SourceCitation'
import { apiClient } from '../api/client'

export function ChatPage() {
  const [activeConvoId, setActiveConvoId] = useState<number | undefined>()
  const [prefillQuery, setPrefillQuery] = useState<string>('')
  const [cagMode, setCagMode] = useState(false)
  const [convoSidebarOpen, setConvoSidebarOpen] = useState(false)
  const [selectedSutra, setSelectedSutra] = useState<CitedSutra | null>(null)
  const [advisor, setAdvisor] = useState<string>('chanakya')

  const location = useLocation()
  const navigate = useNavigate()

  // Read prefilled query and convoId from location search params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('query')
    if (query) {
      setPrefillQuery(query)
      // Clean up search params after consuming
      navigate(location.pathname, { replace: true })
    }

    const convoId = params.get('convoId')
    if (convoId) {
      setActiveConvoId(Number(convoId))
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  // Fetch conversation advisor persona
  useEffect(() => {
    if (!activeConvoId) {
      setAdvisor('chanakya')
      return
    }
    apiClient.get<{ id: number; advisor?: string }>(`/conversations/${activeConvoId}`)
      .then((r: any) => {
        if (r.data?.advisor) {
          setAdvisor(r.data.advisor)
        }
      })
      .catch(() => {})
  }, [activeConvoId])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-wisdom-950 font-body relative z-20">
      {/* ── Mobile Backdrop for Conversation Sidebar ── */}
      {convoSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setConvoSidebarOpen(false)}
        />
      )}

      {/* ── Left Side: Conversation Sidebar ── */}
      <div
        className={`
          fixed inset-y-14 left-0 z-40 w-64 border-r border-wisdom-700/40 bg-wisdom-900/90
          transform transition-transform duration-300 ease-in-out shrink-0
          md:relative md:inset-auto md:translate-x-0 md:z-auto md:bg-transparent
          ${convoSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <ConversationSidebar
          activeId={activeConvoId}
          refreshTrigger={activeConvoId}
          onSelect={(id) => {
            setActiveConvoId(id)
            setConvoSidebarOpen(false)
          }}
          onNewChat={() => {
            setActiveConvoId(undefined)
            setConvoSidebarOpen(false)
          }}
          onClose={() => setConvoSidebarOpen(false)}
        />
      </div>

      {/* ── Center / Right Side: Chat Window ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Chat header area */}
        <div className="h-13 bg-wisdom-900/40 border-b border-wisdom-700/40 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 select-none">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile convo menu button */}
            <button
              onClick={() => setConvoSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-wisdom-400 hover:text-saffron-400 hover:bg-wisdom-800/60 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <h3 className="text-xs font-semibold text-wisdom-200 truncate">
              {activeConvoId ? 'Active Strategist Session' : 'New Strategic Query'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Advisor badge selector */}
            {!activeConvoId ? (
              <select
                value={advisor}
                onChange={(e) => setAdvisor(e.target.value)}
                className="bg-wisdom-900 border border-wisdom-700/40 text-saffron-400 text-[10px] uppercase font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-saffron-500 cursor-pointer"
              >
                <option value="chanakya">Chanakya Neeti</option>
                <option value="gita">Bhagavad Gita</option>
                <option value="stoic">Stoicism</option>
                <option value="sun_tzu">Art of War</option>
              </select>
            ) : (
              <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded bg-saffron-500/10 border border-saffron-500/25 text-saffron-400 uppercase tracking-widest">
                {advisor === 'chanakya' ? 'Chanakya' : advisor === 'gita' ? 'Gita' : advisor === 'stoic' ? 'Stoic' : 'Art of War'}
              </span>
            )}

            {/* New Chat Button */}
            <button
              onClick={() => setActiveConvoId(undefined)}
              className="flex items-center gap-1.5 px-3 py-1 bg-saffron-500/10 border border-saffron-500/20 hover:border-saffron-500/35 text-saffron-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
        </div>

        {/* Dynamic Chat Window */}
        <div className="flex-1 min-w-0 min-h-0 relative">
          <ChatWindow
            conversationId={activeConvoId}
            onConversationCreated={(id) => setActiveConvoId(id)}
            prefillQuery={prefillQuery}
            onPrefillConsumed={() => setPrefillQuery('')}
            cagMode={cagMode}
            onToggleCag={() => setCagMode((v) => !v)}
            onSelectSutra={setSelectedSutra}
            advisor={advisor}
          />
        </div>
      </div>

      {/* ── Sutra details drawer ── */}
      <SutraDetailDrawer
        sutra={selectedSutra}
        onClose={() => setSelectedSutra(null)}
      />
    </div>
  )
}
