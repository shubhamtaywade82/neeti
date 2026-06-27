import { useState, useEffect, useRef } from 'react'
import { useAdvisor } from '../hooks/useAdvisor'
import { apiClient } from '../api/client'
import { MessageBubble } from './MessageBubble'
import { SourceCitation } from './SourceCitation'
import { QueryInput } from './QueryInput'
import { Sparkles } from 'lucide-react'

interface Message {
  role:        'user' | 'assistant'
  content:     string
  isStreaming?: boolean
}

interface ApiMessage {
  id:      number
  role:    'user' | 'assistant'
  content: string
}

interface Props {
  conversationId?: number
  onConversationCreated?: (id: number) => void
  prefillQuery?: string
  onPrefillConsumed?: () => void
  cagMode?: boolean
  onToggleCag?: () => void
}

const SUGGESTION_CHIPS = [
  'Leadership wisdom',
  'Dealing with adversity',
  'Career strategy',
  'Self-discipline',
]

export function ChatWindow({ conversationId, onConversationCreated, prefillQuery, onPrefillConsumed, cagMode = false, onToggleCag = () => {} }: Props) {
  const [messages, setMessages]       = useState<Message[]>([])
  const { streamedText, isStreaming, result, error, ask, cancel } = useAdvisor()
  const bottomRef                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    apiClient.get<ApiMessage[]>(`/conversations/${conversationId}/messages`)
      .then((r) => setMessages(r.data.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => {})
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamedText])

  useEffect(() => {
    if (result?.conversation_id && onConversationCreated) {
      onConversationCreated(result.conversation_id)
    }
  }, [result, onConversationCreated])

  useEffect(() => {
    if (prefillQuery) {
      handleSubmit(prefillQuery)
      onPrefillConsumed?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillQuery])

  const handleSubmit = async (query: string) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user',      content: query },
      { role: 'assistant', content: '', isStreaming: true }
    ])
    const finalText = await ask(query, conversationId, cagMode ? 'cag' : 'retrieval')
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
    <div className="flex flex-col h-full bg-wisdom-950">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 py-6 md:px-6">
        {messages.length === 0 && !conversationId && (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in select-none">
            {/* Floating watermark */}
            <p className="animate-float animate-pulse-glow font-display text-7xl text-saffron-500/30 mb-6">
              नीति
            </p>

            {/* Tagline */}
            <p className="animate-fade-in-up delay-200 text-wisdom-400 font-body text-sm md:text-base mb-8">
              Ask for strategic counsel. Receive timeless wisdom.
            </p>

            {/* Suggestion chips */}
            <div className="animate-fade-in-up delay-400 flex flex-wrap justify-center gap-3 max-w-md">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSubmit(chip)}
                  className="badge-saffron px-4 py-2 rounded-full cursor-pointer text-sm font-body
                    transition-all duration-200 hover:scale-105 hover:shadow-glow
                    active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {chip}
                </button>
              ))}
            </div>
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
          <div className="animate-fade-in text-red-400 text-sm text-center mt-2 px-4 py-2.5 bg-red-950/30 border border-red-800/40 rounded-xl">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <QueryInput
        onSubmit={handleSubmit}
        onCancel={cancel}
        isStreaming={isStreaming}
        cagMode={cagMode}
        onToggleCag={onToggleCag}
      />
    </div>
  )
}
