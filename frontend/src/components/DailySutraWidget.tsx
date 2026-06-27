import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { ArrowRight, X } from 'lucide-react'

interface DailySutra {
  date:  string
  sutra: {
    canonical_id:   string
    chapter:        number
    chapter_title:  string
    translation_en: string
    themes:         string[]
  }
}

interface Props {
  onAsk: (query: string) => void
}

export function DailySutraWidget({ onAsk }: Props) {
  const [data, setData]           = useState<DailySutra | null>(null)
  const [expanded, setExpanded]   = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    apiClient.get<DailySutra>('/daily_sutra')
      .then((r) => setData(r.data))
      .catch(() => {})
  }, [])

  if (!data || dismissed) return null

  return (
    <div className="animate-slide-up mx-4 mt-4 mb-2 relative overflow-hidden rounded-xl
      bg-gradient-to-r from-saffron-900/30 via-saffron-800/20 to-wisdom-900
      border border-saffron-700/20 px-4 py-3">

      {/* Decorative watermark */}
      <span
        className="absolute -right-2 -top-2 font-display text-8xl text-saffron-500/5 pointer-events-none select-none leading-none"
        aria-hidden="true"
      >
        ॐ
      </span>

      <div className="flex items-start justify-between gap-2 relative">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-saffron-500 font-medium uppercase tracking-widest mb-1.5 font-body">
            Today's Sutra · {data.sutra.canonical_id}
          </p>
          <p className={`text-wisdom-200 text-sm leading-relaxed font-body ${!expanded ? 'line-clamp-2' : ''}`}>
            "{data.sutra.translation_en}"
          </p>
          {data.sutra.translation_en.length > 120 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-saffron-500 hover:text-saffron-400 mt-1 font-body transition-colors"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
          {data.sutra.themes?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.sutra.themes.slice(0, 4).map((t) => (
                <span key={t} className="badge-saffron text-xs px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-wisdom-600 hover:text-wisdom-300 hover:bg-wisdom-800/60 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Ask button */}
          <button
            onClick={() => onAsk(`Explain this Chanakya sutra and how I can apply it today: "${data.sutra.translation_en}"`)}
            className="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            Ask
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
