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
    <aside className="w-72 bg-wisdom-900 border-r border-wisdom-700/50 flex flex-col h-full">
      {/* ── Branding ── */}
      <div className="px-5 pt-6 pb-2 animate-fade-in">
        <h1 className="font-display text-saffron-400 text-2xl leading-none tracking-wide">
          नीति
        </h1>
        <span className="font-body text-wisdom-400 text-xs tracking-widest uppercase mt-1 block">
          Neeti
        </span>
      </div>

      {/* ── New Chat Button ── */}
      <div className="px-4 pt-3 pb-4 animate-fade-in delay-100">
        <button
          onClick={onNewChat}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* ── Separator ── */}
      <div className="mx-4 border-t border-wisdom-700/40" />

      {/* ── Conversation List ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-wisdom-700 scrollbar-track-transparent">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in delay-200 select-none">
            <ScrollText className="h-8 w-8 text-wisdom-600 mb-3" />
            <p className="text-wisdom-500 text-sm font-body">
              No conversations yet
            </p>
            <p className="text-wisdom-600 text-xs font-body mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          conversations.map((c, i) => {
            const isActive = activeId === c.id
            const delayClass =
              i < 6
                ? (`delay-${(i + 1) * 100}` as string)
                : 'delay-600'

            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all duration-200 truncate',
                  'flex items-center gap-2.5 group animate-fade-in',
                  delayClass,
                  isActive
                    ? 'bg-saffron-700/20 text-saffron-300 border-l-2 border-saffron-500'
                    : 'text-wisdom-400 hover:bg-wisdom-800/60 hover:text-wisdom-200 border-l-2 border-transparent'
                )}
              >
                <MessageSquare
                  className={clsx(
                    'h-4 w-4 shrink-0 transition-colors duration-200',
                    isActive
                      ? 'text-saffron-400'
                      : 'text-wisdom-600 group-hover:text-wisdom-400'
                  )}
                />
                <span className="truncate">
                  {c.title || 'Untitled'}
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* ── Bottom pinned section ── */}
      <div className="mt-auto">
        <div className="mx-4 border-t border-wisdom-700/30" />
        <div className="px-5 py-3">
          <p className="text-wisdom-600 text-[10px] font-body tracking-wider uppercase text-center select-none">
            Chanakya Neeti Advisor
          </p>
        </div>
      </div>
    </aside>
  )
}
