import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { clsx } from 'clsx'

interface Conversation {
  id:    number
  title: string
}

interface Props {
  activeId?:  number
  onSelect:   (id: number) => void
  onNewChat:  () => void
}

export function ConversationSidebar({ activeId, onSelect, onNewChat }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    apiClient.get<Conversation[]>('/conversations')
      .then((r) => setConversations(r.data))
      .catch(() => {})
  }, [])

  return (
    <aside className="w-64 bg-stone-900 border-r border-stone-800 flex flex-col h-full">
      <div className="p-4 border-b border-stone-800">
        <button
          onClick={onNewChat}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white text-sm py-2 rounded-lg transition-colors"
        >
          + New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={clsx(
              'w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors truncate',
              activeId === c.id
                ? 'bg-amber-700/30 text-amber-300'
                : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
            )}
          >
            {c.title || 'Untitled'}
          </button>
        ))}
      </div>
    </aside>
  )
}
