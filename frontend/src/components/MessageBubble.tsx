import { clsx } from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  role:        'user' | 'assistant'
  content:     string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, isStreaming }: Props) {
  const isUser = role === 'user'

  return (
    <div className={clsx('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-xs font-bold text-white mr-3 mt-1 shrink-0">
          नी
        </div>
      )}
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-amber-700 text-white'
            : 'bg-stone-900 text-stone-200 border border-stone-800'
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
                  strong:     ({ children }) => <strong className="font-semibold text-amber-300">{children}</strong>,
                  em:         ({ children }) => <em className="italic text-stone-300">{children}</em>,
                  h1:         ({ children }) => <h1 className="text-lg font-bold text-amber-400 mt-3 mb-1">{children}</h1>,
                  h2:         ({ children }) => <h2 className="text-base font-bold text-amber-400 mt-3 mb-1">{children}</h2>,
                  h3:         ({ children }) => <h3 className="text-sm font-bold text-amber-300 mt-2 mb-1">{children}</h3>,
                  ul:         ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 pl-2">{children}</ul>,
                  ol:         ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2">{children}</ol>,
                  li:         ({ children }) => <li className="text-stone-200">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-amber-600 pl-3 my-2 text-stone-400 italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-')
                    return isBlock ? (
                      <code className="block bg-stone-950 rounded-lg px-3 py-2 my-2 text-xs font-mono text-amber-200 overflow-x-auto whitespace-pre">
                        {children}
                      </code>
                    ) : (
                      <code className="bg-stone-950 rounded px-1 py-0.5 text-xs font-mono text-amber-200">
                        {children}
                      </code>
                    )
                  },
                  hr: () => <hr className="border-stone-700 my-3" />,
                }}
              >
                {content}
              </ReactMarkdown>
            )}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-amber-400 ml-0.5 animate-pulse" />
            )}
          </>
        ) : isStreaming ? (
          <span className="animate-pulse text-stone-500">●●●</span>
        ) : null}
      </div>
    </div>
  )
}
