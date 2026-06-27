import { useState } from 'react'
import { clsx } from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface Props {
  role:        'user' | 'assistant'
  content:     string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, isStreaming }: Props) {
  const isUser = role === 'user'
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  return (
    <div className={clsx('flex mb-4 animate-fade-in-up group/msg', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-600 to-saffron-800 flex items-center justify-center text-xs font-bold text-white mr-3 mt-1 shrink-0 shadow-glow ring-1 ring-saffron-600/30">
          नी
        </div>
      )}

      <div className="flex flex-col max-w-[75%]">
        {/* Message bubble */}
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed font-body',
            isUser
              ? 'bg-gradient-to-r from-saffron-600 to-saffron-700 text-white rounded-br-md'
              : 'bg-wisdom-800 border border-wisdom-600/50 text-wisdom-100 rounded-bl-md'
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
                    p:          ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong:     ({ children }) => <strong className="font-semibold text-saffron-300">{children}</strong>,
                    em:         ({ children }) => <em className="italic text-wisdom-300">{children}</em>,
                    h1:         ({ children }) => <h1 className="text-lg font-bold text-saffron-400 mt-3 mb-1 font-display">{children}</h1>,
                    h2:         ({ children }) => <h2 className="text-base font-bold text-saffron-400 mt-3 mb-1 font-display">{children}</h2>,
                    h3:         ({ children }) => <h3 className="text-sm font-bold text-saffron-300 mt-2 mb-1 font-display">{children}</h3>,
                    ul:         ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 pl-2">{children}</ul>,
                    ol:         ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2">{children}</ol>,
                    li:         ({ children }) => <li className="text-wisdom-200">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-saffron-600 pl-3 my-2 text-wisdom-400 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-')
                      return isBlock ? (
                        <code className="block bg-wisdom-950 rounded-lg px-3 py-2 my-2 text-xs font-mono text-saffron-200 overflow-x-auto whitespace-pre">
                          {children}
                        </code>
                      ) : (
                        <code className="bg-wisdom-950 rounded px-1 py-0.5 text-xs font-mono text-saffron-200">
                          {children}
                        </code>
                      )
                    },
                    hr: () => <hr className="border-wisdom-700 my-3" />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-saffron-400 ml-0.5 animate-pulse rounded-full" />
              )}
            </>
          ) : isStreaming ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : null}
        </div>

        {/* Feedback buttons — assistant only, non-streaming */}
        {!isUser && !isStreaming && content && (
          <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setFeedback((prev) => (prev === 'up' ? null : 'up'))}
              className={clsx(
                'p-1 rounded-md transition-colors',
                feedback === 'up'
                  ? 'text-saffron-400 bg-saffron-400/10'
                  : 'text-wisdom-600 hover:text-wisdom-400 hover:bg-wisdom-800'
              )}
              title="Helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedback((prev) => (prev === 'down' ? null : 'down'))}
              className={clsx(
                'p-1 rounded-md transition-colors',
                feedback === 'down'
                  ? 'text-red-400 bg-red-400/10'
                  : 'text-wisdom-600 hover:text-wisdom-400 hover:bg-wisdom-800'
              )}
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
