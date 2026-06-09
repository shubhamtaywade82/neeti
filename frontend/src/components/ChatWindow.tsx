import { useState, useEffect, useRef } from 'react'
import { useAdvisor } from '../hooks/useAdvisor'
import { MessageBubble } from './MessageBubble'
import { SourceCitation } from './SourceCitation'
import { QueryInput } from './QueryInput'

interface Message {
  role:        'user' | 'assistant'
  content:     string
  isStreaming?: boolean
}

interface Props {
  conversationId?: number
  onConversationCreated?: (id: number) => void
}

export function ChatWindow({ conversationId, onConversationCreated }: Props) {
  const [messages, setMessages]       = useState<Message[]>([])
  const { streamedText, isStreaming, result, error, ask, cancel } = useAdvisor()
  const bottomRef                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamedText])

  useEffect(() => {
    if (result?.conversation_id && onConversationCreated) {
      onConversationCreated(result.conversation_id)
    }
  }, [result, onConversationCreated])

  const handleSubmit = async (query: string) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user',      content: query },
      { role: 'assistant', content: '', isStreaming: true }
    ])
    const finalText = await ask(query, conversationId)
    setMessages((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = {
        role:        'assistant',
        content:     finalText,
        isStreaming: false
      }
      return updated
    })
  }

  return (
    <div className="flex flex-col h-full bg-stone-950">
      <header className="px-6 py-4 border-b border-stone-800">
        <h1 className="text-amber-400 font-serif text-xl font-semibold tracking-wide">
          नीति — Neeti
        </h1>
        <p className="text-stone-500 text-xs mt-0.5">
          Wisdom of Chanakya, grounded in sutras
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="text-center text-stone-600 mt-20">
            <p className="text-5xl mb-4 font-serif">नीति</p>
            <p className="text-sm">Ask for strategic counsel. Receive timeless wisdom.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.role === 'assistant' && msg.isStreaming ? streamedText : msg.content}
            isStreaming={msg.isStreaming && isStreaming}
          />
        ))}

        {result && <SourceCitation sutras={result.cited_sutras} />}

        {error && (
          <div className="text-red-400 text-sm text-center mt-2 px-4 py-2 bg-red-950/30 rounded">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <QueryInput
        onSubmit={handleSubmit}
        onCancel={cancel}
        isStreaming={isStreaming}
        disabled={isStreaming}
      />
    </div>
  )
}
