import { clsx } from 'clsx'

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
            {content}
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
