import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'

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
  const [data, setData]         = useState<DailySutra | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    apiClient.get<DailySutra>('/daily_sutra')
      .then((r) => setData(r.data))
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <div className="mx-4 mt-4 mb-2 bg-amber-950/20 border border-amber-800/30 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-600 font-medium uppercase tracking-widest mb-1">
            Today's Sutra · {data.sutra.canonical_id}
          </p>
          <p className={`text-stone-300 text-sm leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
            "{data.sutra.translation_en}"
          </p>
          {data.sutra.translation_en.length > 120 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-amber-600 hover:text-amber-400 mt-1"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
          {data.sutra.themes?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.sutra.themes.slice(0, 4).map((t) => (
                <span key={t} className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onAsk(`Explain this Chanakya sutra and how I can apply it today: "${data.sutra.translation_en}"`)}
          className="shrink-0 text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Ask →
        </button>
      </div>
    </div>
  )
}
