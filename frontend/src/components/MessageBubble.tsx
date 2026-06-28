import { useState } from 'react'
import { clsx } from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Cpu, Clock, Layers, HelpCircle, Activity } from 'lucide-react'
import { useFeatureFlagsStore } from '../stores/featureFlagsStore'

interface Props {
  role:        'user' | 'assistant'
  content:     string
  isStreaming?: boolean
  avatarText?:  string
  reasoning?:   string[]
  latency?:     string
  tokens?:      number
  model?:       string
}

export function MessageBubble({ role, content, isStreaming, avatarText = 'नी', reasoning, latency, tokens, model }: Props) {
  const isUser = role === 'user'
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const { flags } = useFeatureFlagsStore()

  return (
    <div className={clsx('flex mb-6 animate-fade-in-up group/msg', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 flex items-center justify-center text-xs font-bold text-wisdom-950 mr-3 mt-1 shrink-0 shadow-glow select-none">
          {avatarText}
        </div>
      )}

      <div className="flex flex-col max-w-[80%] min-w-0">
        {/* Message bubble */}
        <div
          className={clsx(
            'rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed font-body',
            isUser
              ? 'bg-wisdom-700/40 text-wisdom-100 rounded-br-sm border border-wisdom-700/20'
              : 'bg-wisdom-900/60 border border-wisdom-700/40 text-wisdom-300 rounded-bl-sm glass'
          )}
        >
          {content ? (
            <>
              {isUser ? (
                <span>{content}</span>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p:          ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    strong:     ({ children }) => <strong className="font-semibold text-saffron-300">{children}</strong>,
                    em:         ({ children }) => <em className="italic text-wisdom-200">{children}</em>,
                    h1:         ({ children }) => <h1 className="text-base font-bold text-saffron-400 mt-4 mb-2 font-display">{children}</h1>,
                    h2:         ({ children }) => <h2 className="text-sm font-bold text-saffron-400 mt-4 mb-2 font-display">{children}</h2>,
                    h3:         ({ children }) => <h3 className="text-xs font-bold text-saffron-300 mt-3 mb-1.5 font-display">{children}</h3>,
                    ul:         ({ children }) => <ul className="list-disc list-inside space-y-1.5 my-2.5 pl-2">{children}</ul>,
                    ol:         ({ children }) => <ol className="list-decimal list-inside space-y-1.5 my-2.5 pl-2">{children}</ol>,
                    li:         ({ children }) => <li className="text-wisdom-300">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-saffron-500 pl-3 my-2.5 text-wisdom-400 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-')
                      return isBlock ? (
                        <code className="block bg-wisdom-950/80 border border-wisdom-700/30 rounded-xl px-4 py-3 my-3 text-xs font-mono text-saffron-200 overflow-x-auto whitespace-pre">
                          {children}
                        </code>
                      ) : (
                        <code className="bg-wisdom-950 border border-wisdom-700/40 rounded-md px-1.5 py-0.5 text-xs font-mono text-saffron-300">
                          {children}
                        </code>
                      )
                    },
                    hr: () => <hr className="border-wisdom-700/40 my-4" />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-saffron-500 ml-0.5 animate-pulse rounded-full align-middle" />
              )}
            </>
          ) : isStreaming ? (
            <div className="space-y-4">
              {/* Stepper thinking steps when flags.chatReasoning is enabled */}
              {flags.chatReasoning && (
                <div className="flex flex-col gap-2.5 p-3.5 bg-wisdom-950/70 rounded-xl border border-wisdom-700/35 w-full max-w-sm animate-fade-in-up font-body">
                  <div className="flex items-center gap-2 mb-1 border-b border-wisdom-800/40 pb-1.5 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron-500"></span>
                    </span>
                    <span className="text-[9px] font-bold text-wisdom-300 uppercase tracking-widest">Advisor is thinking</span>
                  </div>
                  <div className="flex flex-col gap-2.5 py-0.5">
                    {[
                      { label: 'Consulting Chanakya Neeti database', desc: 'Searching structured sutras' },
                      { label: 'Traversing thematic graph nodes', desc: 'Resolving relationships' },
                      { label: 'Invoking strategic advisor reasoning', desc: 'Applying LLM intent classification' }
                    ].map((s, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 transition-all duration-300">
                        <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold bg-saffron-500/25 text-saffron-400 border border-saffron-500/30 animate-pulse">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-saffron-300 font-semibold">{s.label}</span>
                          <span className="text-[10px] text-wisdom-400 truncate mt-0.5">{s.desc}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="typing-indicator pl-1 flex gap-1 select-none">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : null}

          {/* Toggleable Reasoning Path inside message box */}
          {!isUser && !isStreaming && reasoning && reasoning.length > 0 && flags.chatReasoning && (
            <div className="border-t border-wisdom-700/20 mt-4.5 pt-3.5 select-none">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center justify-between w-full text-left p-2.5 bg-wisdom-900 border border-wisdom-700/40 rounded-xl text-xs font-semibold text-wisdom-400 hover:text-wisdom-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-saffron-500" />
                  <span>Reasoning Path</span>
                  <span className="text-[10px] text-wisdom-500 font-semibold">• {reasoning.length} steps</span>
                </span>
                {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showReasoning && (
                <div className="mt-2.5 bg-wisdom-950/60 border border-wisdom-700/30 rounded-xl p-3.5 space-y-3 animate-fade-in-up">
                  {reasoning.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-[11px] leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-saffron-500/10 border border-saffron-500/25 text-saffron-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-wisdom-500 uppercase tracking-wide block">
                          Step {idx + 1}
                        </span>
                        <p className="text-wisdom-300 mt-0.5">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback + Metadata section */}
        {!isUser && !isStreaming && content && (
          <div className="flex items-center justify-between mt-2.5 px-1 select-none">
            {/* Metadata (latency, model, etc) */}
            <div className="flex items-center gap-3 text-[10px] text-wisdom-500 font-semibold">
              {model && (
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-wisdom-600" />
                  {model}
                </span>
              )}
              {latency && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-wisdom-600" />
                  {latency}
                </span>
              )}
              {tokens && (
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-wisdom-600" />
                  {tokens} tokens
                </span>
              )}
            </div>

            {/* Thumbs up/down feedback */}
            <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => setFeedback((prev) => (prev === 'up' ? null : 'up'))}
                className={clsx(
                  'p-1 rounded-md transition-colors border border-transparent',
                  feedback === 'up'
                    ? 'text-saffron-400 bg-saffron-400/10 border-saffron-500/20'
                    : 'text-wisdom-600 hover:text-wisdom-400 hover:bg-wisdom-800'
                )}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFeedback((prev) => (prev === 'down' ? null : 'down'))}
                className={clsx(
                  'p-1 rounded-md transition-colors border border-transparent',
                  feedback === 'down'
                    ? 'text-red-400 bg-red-400/10 border-red-500/20'
                    : 'text-wisdom-600 hover:text-wisdom-400 hover:bg-wisdom-800'
                )}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
