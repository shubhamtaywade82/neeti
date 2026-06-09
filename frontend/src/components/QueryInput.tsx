import { useState, type KeyboardEvent } from 'react'
import { clsx } from 'clsx'

interface Props {
  onSubmit:    (query: string) => void
  onCancel:    () => void
  isStreaming: boolean
  disabled:    boolean
}

export function QueryInput({ onSubmit, onCancel, isStreaming, disabled }: Props) {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        onSubmit(value.trim())
        setValue('')
      }
    }
  }

  const handleClick = () => {
    if (isStreaming) {
      onCancel()
    } else if (value.trim()) {
      onSubmit(value.trim())
      setValue('')
    }
  }

  return (
    <div className="px-4 py-4 border-t border-stone-800">
      <div className="flex gap-3 max-w-3xl mx-auto">
        <textarea
          className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-600 resize-none"
          placeholder="Seek counsel from Chanakya..."
          value={value}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled && !isStreaming}
        />
        <button
          onClick={handleClick}
          className={clsx(
            'px-5 py-3 rounded-xl text-sm font-medium transition-colors',
            isStreaming
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50'
          )}
          disabled={!isStreaming && !value.trim()}
        >
          {isStreaming ? 'Stop' : 'Ask'}
        </button>
      </div>
    </div>
  )
}
