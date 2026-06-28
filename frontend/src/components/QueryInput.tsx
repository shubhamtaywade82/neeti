import { useState, useRef, type KeyboardEvent } from 'react'
import { clsx } from 'clsx'
import { Send, Square, Infinity } from 'lucide-react'

interface Props {
  onSubmit:    (query: string) => void
  onCancel:    () => void
  isStreaming: boolean
  cagMode:     boolean
  onToggleCag: () => void
}

export function QueryInput({ onSubmit, onCancel, isStreaming, cagMode, onToggleCag }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        onSubmit(value.trim())
        setValue('')
        resetHeight()
      }
    }
  }

  const handleClick = () => {
    if (isStreaming) {
      onCancel()
    } else if (value.trim()) {
      onSubmit(value.trim())
      setValue('')
      resetHeight()
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = 'auto'
    target.style.height = target.scrollHeight + 'px'
  }

  return (
    <div className="bg-wisdom-950/80 border-t border-wisdom-700/40 px-4 py-4 shrink-0 select-none">
      <div className="max-w-3xl mx-auto">
        {/* Input Card Wrapper */}
        <div
          className={clsx(
            'flex items-end gap-2.5 rounded-2xl border bg-wisdom-900 border-wisdom-700/40 px-4.5 py-3 transition-all duration-200 shadow-lg',
            'focus-within:border-saffron-600/60 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-saffron-600/10'
          )}
        >
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-wisdom-100 placeholder-wisdom-500 text-xs sm:text-sm font-body
              focus:outline-none resize-none max-h-32 overflow-y-auto py-1.5 leading-relaxed"
            placeholder="Ask across your active knowledge packs..."
            value={value}
            rows={1}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={isStreaming}
          />

          {/* CAG Toggle */}
          <button
            onClick={onToggleCag}
            title="CAG mode: use full corpus instead of retrieval"
            className={clsx(
              'shrink-0 p-2 rounded-xl transition-all duration-200 border',
              cagMode
                ? 'bg-saffron-500/10 border-saffron-500/30 text-saffron-400'
                : 'bg-wisdom-800 border-wisdom-700/40 text-wisdom-500 hover:text-wisdom-200'
            )}
          >
            <Infinity className="w-4 h-4" />
          </button>

          {/* Send / Stop button */}
          <button
            onClick={handleClick}
            className={clsx(
              'shrink-0 p-2 rounded-xl transition-all duration-200 border flex items-center justify-center',
              isStreaming
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-saffron-500 hover:bg-saffron-400 text-wisdom-950 border-transparent shadow-glow disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            disabled={!isStreaming && !value.trim()}
          >
            {isStreaming ? (
              <Square className="w-4 h-4 fill-red-400" />
            ) : (
              <Send className="w-4 h-4 fill-wisdom-950" />
            )}
          </button>
        </div>

        {/* Keyboard hints */}
        <p className="text-wisdom-500 text-[10px] font-semibold text-center mt-2 tracking-wider">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
