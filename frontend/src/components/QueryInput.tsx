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
    <div className="glass border-t border-wisdom-800/60 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Input row */}
        <div
          className={clsx(
            'flex items-end gap-2 rounded-2xl border bg-wisdom-900/80 px-3 py-2 transition-all duration-200',
            'border-wisdom-700/50',
            'focus-within:border-saffron-600/60 focus-within:shadow-glow focus-within:ring-1 focus-within:ring-saffron-600/20'
          )}
        >
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-wisdom-100 placeholder-wisdom-600 text-sm font-body
              focus:outline-none resize-none max-h-32 overflow-y-auto py-1.5"
            placeholder="Seek counsel from Chanakya..."
            value={value}
            rows={1}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={isStreaming}
          />

          {/* CAG toggle */}
          <button
            onClick={onToggleCag}
            title="CAG mode: use full corpus instead of retrieval"
            className={clsx(
              'shrink-0 p-2 rounded-xl transition-all duration-200',
              cagMode
                ? 'bg-saffron-700/30 text-saffron-300 ring-1 ring-saffron-600/50'
                : 'text-wisdom-600 hover:text-wisdom-400 hover:bg-wisdom-800'
            )}
          >
            <Infinity className="w-4.5 h-4.5" />
          </button>

          {/* Send / Stop button */}
          <button
            onClick={handleClick}
            className={clsx(
              'shrink-0 p-2 rounded-xl transition-all duration-200',
              isStreaming
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'btn-primary disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            disabled={!isStreaming && !value.trim()}
          >
            {isStreaming ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-wisdom-500 text-xs font-body mt-1.5 text-center select-none">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
