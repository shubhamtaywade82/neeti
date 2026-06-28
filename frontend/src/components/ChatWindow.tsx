import { useState, useEffect, useRef } from 'react'
import { useAdvisor } from '../hooks/useAdvisor'
import { useFeatureFlagsStore } from '../stores/featureFlagsStore'
import { apiClient } from '../api/client'
import { MessageBubble } from './MessageBubble'
import { SourceCitation } from './SourceCitation'
import type { CitedSutra } from './SourceCitation'
import { QueryInput } from './QueryInput'
import { Landmark, Shield, Coins, Compass } from 'lucide-react'

interface Message {
  role:        'user' | 'assistant'
  content:     string
  isStreaming?: boolean
  cited_sutras?: CitedSutra[]
  reasoning?:   string[]
  latency?:     string
  tokens?:      number
  model?:       string
}

interface ApiMessage {
  id:           number
  role:         'user' | 'assistant'
  content:      string
  cited_sutras?: CitedSutra[]
}

interface Props {
  conversationId?: number
  onConversationCreated?: (id: number) => void
  prefillQuery?: string
  onPrefillConsumed?: () => void
  cagMode?: boolean
  onToggleCag?: () => void
  onSelectSutra: (sutra: CitedSutra) => void
  advisor?: string
}

const ADVISOR_DETAILS: Record<string, {
  name: string
  tagline: string
  avatarText: string
  suggestions: {
    category: string
    icon: any
    color: string
    borderColor: string
    queries: string[]
  }[]
}> = {
  chanakya: {
    name: 'Chanakya Neeti',
    tagline: 'Explore strategic counsel and tactical statecraft grounded in Chanakya Neeti.',
    avatarText: 'नी',
    suggestions: [
      {
        category: 'Leadership & Power',
        icon: Landmark,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/20 bg-emerald-500/5',
        queries: [
          'How to earn the loyalty of followers?',
          'Traits of a true strategic leader',
        ]
      },
      {
        category: 'Conflict & Strategy',
        icon: Shield,
        color: 'text-saffron-400',
        borderColor: 'border-saffron-500/20 bg-saffron-500/5',
        queries: [
          'Dealing with hidden enemies at work',
          'When to make peace vs wage war',
        ]
      },
      {
        category: 'Wealth & Enterprise',
        icon: Coins,
        color: 'text-sky-400',
        borderColor: 'border-sky-500/20 bg-sky-500/5',
        queries: [
          "Chanakya's rules of wealth creation",
          'Avoiding financial self-destruction',
        ]
      },
      {
        category: 'Self-Mastery & Dharma',
        icon: Compass,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/20 bg-purple-500/5',
        queries: [
          'How to control anger and desire?',
          'Cultivating perfect self-discipline',
        ]
      }
    ]
  },
  gita: {
    name: 'Bhagavad Gita',
    tagline: 'Seek wisdom on duty, action, detachment, and self-mastery from the Bhagavad Gita.',
    avatarText: 'ॐ',
    suggestions: [
      {
        category: 'Duty & Karma',
        icon: Landmark,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/20 bg-emerald-500/5',
        queries: [
          'How to act without attachment to results?',
          'What is my true dharma (duty)?',
        ]
      },
      {
        category: 'Self-Control',
        icon: Shield,
        color: 'text-saffron-400',
        borderColor: 'border-saffron-500/20 bg-saffron-500/5',
        queries: [
          'How to calm an anxious, wandering mind?',
          'Overcoming fear and doubt in action',
        ]
      },
      {
        category: 'Wisdom & Reality',
        icon: Compass,
        color: 'text-sky-400',
        borderColor: 'border-sky-500/20 bg-sky-500/5',
        queries: [
          'Understanding the eternal self (Atman)',
          'Distinguishing between transient and permanent',
        ]
      },
      {
        category: 'Devotion & Peace',
        icon: Coins,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/20 bg-purple-500/5',
        queries: [
          'Finding inner peace amidst chaos',
          'What is the meaning of true devotion?',
        ]
      }
    ]
  },
  stoic: {
    name: 'Stoicism',
    tagline: 'Find tranquility, resilience, and virtue through the principles of Stoic philosophy.',
    avatarText: '🏛️',
    suggestions: [
      {
        category: 'Control & Choice',
        icon: Landmark,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/20 bg-emerald-500/5',
        queries: [
          'Dichotomy of control: what is mine to decide?',
          'How to handle criticism and insults?',
        ]
      },
      {
        category: 'Resilience',
        icon: Shield,
        color: 'text-saffron-400',
        borderColor: 'border-saffron-500/20 bg-saffron-500/5',
        queries: [
          'Overcoming anxiety and worry about the future',
          'Practicing voluntary discomfort',
        ]
      },
      {
        category: 'Impermanence & Fate',
        icon: Compass,
        color: 'text-sky-400',
        borderColor: 'border-sky-500/20 bg-sky-500/5',
        queries: [
          'Memento Mori: reflecting on mortality',
          'Amor Fati: accepting external events',
        ]
      },
      {
        category: 'Daily Virtue',
        icon: Coins,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/20 bg-purple-500/5',
        queries: [
          'How to motivate myself to do hard work?',
          'Acting with justice and kindness',
        ]
      }
    ]
  },
  sun_tzu: {
    name: 'Art of War',
    tagline: 'Master the art of maneuvering, conflict resolution, and strategic victory.',
    avatarText: '🏹',
    suggestions: [
      {
        category: 'Conflict Strategy',
        icon: Landmark,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/20 bg-emerald-500/5',
        queries: [
          'How to win without direct fighting?',
          'Assessing the strength of an opponent',
        ]
      },
      {
        category: 'Tactics & Maneuvers',
        icon: Shield,
        color: 'text-saffron-400',
        borderColor: 'border-saffron-500/20 bg-saffron-500/5',
        queries: [
          'Adapting to changing circumstances',
          'The strategic use of deception',
        ]
      },
      {
        category: 'Leadership in Crisis',
        icon: Compass,
        color: 'text-sky-400',
        borderColor: 'border-sky-500/20 bg-sky-500/5',
        queries: [
          'Maintaining discipline and high morale',
          'Managing risk and resources in conflict',
        ]
      },
      {
        category: 'Preparation & Insight',
        icon: Coins,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/20 bg-purple-500/5',
        queries: [
          'The value of information and planning',
          'Knowing yourself and your competitor',
        ]
      }
    ]
  }
}

export function ChatWindow({ conversationId, onConversationCreated, prefillQuery, onPrefillConsumed, cagMode = false, onToggleCag = () => {}, onSelectSutra, advisor = 'chanakya' }: Props) {
  const [messages, setMessages]       = useState<Message[]>([])
  const { streamedText, isStreaming, result, error, ask, cancel } = useAdvisor()
  const { flags } = useFeatureFlagsStore()
  const bottomRef                     = useRef<HTMLDivElement>(null)

  const currentAdvisor = ADVISOR_DETAILS[advisor] || ADVISOR_DETAILS.chanakya

  // Sync historical messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    apiClient.get<ApiMessage[]>(`/conversations/${conversationId}/messages`)
      .then((r) => {
        setMessages(
          r.data.map((m) => ({
            role: m.role,
            content: m.content,
            cited_sutras: m.cited_sutras,
            // If historical messages, mock reasoning steps if enabled
            reasoning: flags.chatReasoning
              ? ['Intent Analysis: user query parsing', 'Selected persona matching', 'Grounded reasoning filters applied']
              : undefined,
            latency: '1,240ms',
            tokens: 342,
            model: 'qwen3.5:4b (Ollama)'
          }))
        )
      })
      .catch(() => {})
  }, [conversationId, flags.chatReasoning])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamedText])

  useEffect(() => {
    if (result?.conversation_id && onConversationCreated) {
      onConversationCreated(result.conversation_id)
    }
  }, [result, onConversationCreated])

  // Sync citations and append mockup reasoning steps on streaming complete
  useEffect(() => {
    if (result?.cited_sutras) {
      setMessages((prev) => {
        if (prev.length === 0) return prev
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            cited_sutras: result.cited_sutras,
            reasoning: flags.chatReasoning
              ? [
                  'System: Intent analysis resolved query domain',
                  'Router: Selected installed packs context',
                  'Graph Engine: Retrieved semantic nodes for grounded reasoning',
                  'LLM: Synthesized recommendation with excerpts'
                ]
              : undefined,
            latency: '1,842ms',
            tokens: 298,
            model: 'qwen3.5:4b (Ollama)'
          }
        }
        return updated
      })
    }
  }, [result, flags.chatReasoning])

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
    const finalText = await ask(query, conversationId, cagMode ? 'cag' : 'retrieval', advisor)
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
    <div className="flex flex-col h-full bg-wisdom-950 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full ambient-glow-purple pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full ambient-glow-saffron pointer-events-none" />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 py-6 md:px-6 relative z-10">
        {messages.length === 0 && !conversationId && (
          <div className="flex flex-col items-center justify-center min-h-full py-10 animate-fade-in select-none grid-overlay">
            {/* Centered Glowing Mandala Brand */}
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-saffron-500/30 bg-wisdom-900/60 shadow-glow mb-6 animate-float">
              <span className="font-display text-3xl text-saffron-400 font-bold">{currentAdvisor.avatarText}</span>
              <div className="absolute inset-0 rounded-full border border-saffron-500/10 animate-pulse-glow" />
            </div>

            {/* Title & Tagline */}
            <h1 className="text-white text-xl md:text-2xl font-bold tracking-tight mb-2 font-display text-center">
              How can NEETI advise you today?
            </h1>
            <p className="animate-fade-in-up delay-200 text-wisdom-500 font-body text-xs md:text-sm mb-10 text-center max-w-sm leading-relaxed px-4">
              Ask anything across your installed knowledge packs. Answers will be grounded and explained.
            </p>

            {/* Categorized suggestions grid */}
            <div className="animate-fade-in-up delay-400 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full px-4">
              {currentAdvisor.suggestions.map((cat, idx) => {
                const Icon = cat.icon
                return (
                  <div key={idx} className="bg-wisdom-900/30 border border-wisdom-700/40 rounded-2xl p-4 flex flex-col gap-3 glass">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-wisdom-400">
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                      {cat.category}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {cat.queries.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSubmit(q)}
                          className="w-full text-left text-xs text-wisdom-400 hover:text-saffron-300 hover:bg-wisdom-800/40 
                            border border-transparent hover:border-saffron-500/20 px-3 py-2 rounded-xl transition-all duration-200"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className="flex flex-col">
              <MessageBubble
                role={msg.role}
                content={msg.role === 'assistant' && msg.isStreaming ? streamedText : msg.content}
                isStreaming={msg.isStreaming && isStreaming}
                avatarText={currentAdvisor.avatarText}
                reasoning={msg.reasoning}
                latency={msg.latency}
                tokens={msg.tokens}
                model={msg.model}
              />
              {msg.role === 'assistant' && msg.cited_sutras && msg.cited_sutras.length > 0 && (
                <div className="pl-11 -mt-2">
                  <SourceCitation sutras={msg.cited_sutras} onSelectSutra={onSelectSutra} />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="animate-fade-in max-w-3xl mx-auto text-red-400 text-sm text-center mt-4 px-4 py-2.5 bg-red-950/30 border border-red-800/40 rounded-xl">
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
