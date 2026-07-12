import { BookOpen } from 'lucide-react'

export interface CitedSutra {
  id: string
  preview: string
  sanskrit?: string
  transliteration?: string
  translation_en?: string
  translation_hi?: string
  chapter?: number
  chapter_title?: string
  themes?: string[]
  virtues?: string[]
  vices?: string[]
  situations?: string[]
  emotions?: string[]
}

interface Props {
  sutras: CitedSutra[]
  onSelectSutra: (sutra: CitedSutra) => void
}

export function SourceCitation({ sutras, onSelectSutra }: Props) {
  if (!sutras?.length) return null

  return (
    <div className="animate-fade-in delay-300 mt-4 mb-2 border-t border-surface-100/60 pt-3">
      <p className="flex items-center gap-1.5 text-xs text-surface-400 uppercase tracking-widest mb-2.5 font-medium font-body">
        <BookOpen className="w-3.5 h-3.5" />
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sutras.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSutra(s)}
            className="badge-primary flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg cursor-pointer
              transition-all duration-200 hover:scale-105 hover:shadow-glow focus:outline-none focus:ring-1 focus:ring-primary-500"
            title={s.preview}
          >
            <BookOpen className="w-3 h-3 shrink-0" />
            {s.id}
          </button>
        ))}
      </div>
    </div>
  )
}
