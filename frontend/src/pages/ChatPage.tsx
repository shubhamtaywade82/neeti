import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Menu, BookOpen, Library, FileText } from 'lucide-react'
import { ChatWindow } from '../components/ChatWindow'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { SutraDetailDrawer } from '../components/SutraDetailDrawer'
import type { CitedSutra } from '../components/SourceCitation'
import { apiClient } from '../api/client'

const SCOPE_OPTIONS = [
  { value: 'library', label: 'Library', icon: Library, desc: 'Knowledge packs only' },
  { value: 'documents', label: 'Documents', icon: FileText, desc: 'Your uploaded documents only' },
  { value: 'all', label: 'All Sources', icon: Library, desc: 'Library + documents' },
]

export function ChatPage() {
  const [activeConvoId, setActiveConvoId] = useState<number | undefined>()
  const [prefillQuery, setPrefillQuery] = useState<string>('')
  const [cagMode, setCagMode] = useState(false)
  const [convoSidebarOpen, setConvoSidebarOpen] = useState(false)
  const [selectedSutra, setSelectedSutra] = useState<CitedSutra | null>(null)
  const [advisor, setAdvisor] = useState<string>('chanakya')
  const [retrievalScope, setRetrievalScope] = useState('library')
  const [scopePopover, setScopePopover] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('query')
    if (query) {
      setPrefillQuery(query)
      navigate(location.pathname, { replace: true })
    }

    const convoId = params.get('convoId')
    if (convoId) {
      setActiveConvoId(Number(convoId))
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

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
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-surface-0 font-body relative z-20">
      {convoSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setConvoSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-14 left-0 z-40 w-64 border-r border-surface-200/40 bg-surface-50/90
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

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="h-13 bg-surface-50/40 border-b border-surface-200/40 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setConvoSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-surface-500 hover:text-primary-400 hover:bg-surface-100/60 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <h3 className="text-xs font-semibold text-surface-700 truncate">
              {activeConvoId ? 'Active Strategist Session' : 'New Strategic Query'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setScopePopover(!scopePopover)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-50 border border-surface-200/40 text-surface-600 text-[10px] font-bold uppercase tracking-wider hover:border-primary-500/30 transition-colors"
              >
                {retrievalScope === 'library' ? <Library className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {SCOPE_OPTIONS.find(o => o.value === retrievalScope)?.label || 'Library'}
              </button>
              {scopePopover && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setScopePopover(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface-50 border border-surface-200/40 rounded-xl shadow-xl z-50 py-1 animate-scale-in">
                    {SCOPE_OPTIONS.map(opt => {
                      const Icon = opt.icon
                      const active = retrievalScope === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setRetrievalScope(opt.value); setScopePopover(false) }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${active ? 'bg-primary-500/10 text-primary-400' : 'text-surface-600 hover:bg-surface-100/60'}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <div className="text-left">
                            <span className="font-semibold block leading-tight">{opt.label}</span>
                            <span className="text-[9px] text-surface-500">{opt.desc}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {!activeConvoId ? (
              <select
                value={advisor}
                onChange={(e) => setAdvisor(e.target.value)}
                className="bg-surface-50 border border-surface-200/40 text-primary-400 text-[10px] uppercase font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
              >
                <option value="chanakya">Chanakya Neeti</option>
                <option value="gita">Bhagavad Gita</option>
                <option value="stoic">Stoicism</option>
                <option value="sun_tzu">Art of War</option>
              </select>
            ) : (
              <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/25 text-primary-400 uppercase tracking-widest">
                {advisor === 'chanakya' ? 'Chanakya' : advisor === 'gita' ? 'Gita' : advisor === 'stoic' ? 'Stoic' : 'Art of War'}
              </span>
            )}

            <button
              onClick={() => setActiveConvoId(undefined)}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 border border-primary-500/20 hover:border-primary-500/35 text-primary-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
        </div>

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
            retrievalScope={retrievalScope}
          />
        </div>
      </div>

      <SutraDetailDrawer
        sutra={selectedSutra}
        onClose={() => setSelectedSutra(null)}
      />
    </div>
  )
}
