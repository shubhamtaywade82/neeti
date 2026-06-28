import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { clsx } from 'clsx'
import { Plus, MessageSquare, ScrollText } from 'lucide-react'

interface Conversation {
  id:    number
  title: string
}

interface Props {
  activeId?:       number
  refreshTrigger?: number
  onSelect:        (id: number) => void
  onNewChat:       () => void
  onClose?:        () => void
}

export function ConversationSidebar({ activeId, refreshTrigger, onSelect, onNewChat, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    apiClient.get<Conversation[]>('/conversations')
      .then((r) => setConversations(r.data))
      .catch(() => {})
  }, [refreshTrigger])

  const handleSelect = (id: number) => {
    onSelect(id)
    onClose?.()
  }

  return (
    <aside className="w-full flex flex-col h-full bg-wisdom-900/10 select-none">
      {/* ── New Chat Button ── */}
      <div className="px-4 py-4 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-saffron-500 text-wisdom-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-glow transition-all duration-200 hover:-translate-y-px active:translate-y-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          New Chat
        </button>
      </div>

      {/* ── Separator ── */}
      <div className="mx-4 border-t border-wisdom-700/10 shrink-0" />

      {/* ── Conversation List ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
            <ScrollText className="h-7 w-7 text-wisdom-600 mb-2" />
            <p className="text-wisdom-500 text-xs font-semibold uppercase tracking-wider">
              No history
            </p>
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = activeId === c.id

            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold leading-relaxed transition-all duration-200 truncate border relative',
                  isActive
                    ? 'bg-saffron-500/10 border-saffron-500/20 text-saffron-300 font-bold'
                    : 'border-transparent text-wisdom-400 hover:bg-wisdom-800/40 hover:text-wisdom-200'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-saffron-500 rounded-r-md" />
                )}
                <div className="flex items-center gap-2">
                  <MessageSquare
                    className={clsx(
                      'h-3.5 w-3.5 shrink-0 transition-colors duration-200',
                      isActive ? 'text-saffron-400' : 'text-wisdom-600'
                    )}
                  />
                  <span className="truncate flex-1">
                    {c.title || 'Untitled'}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
