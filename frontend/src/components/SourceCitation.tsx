import { BookOpen } from 'lucide-react'

interface Sutra {
  id:      string
  preview: string
}

export function SourceCitation({ sutras }: { sutras: Sutra[] }) {
  if (!sutras?.length) return null

  return (
    <div className="animate-fade-in delay-300 mt-4 mb-2 border-t border-wisdom-800/60 pt-3">
      <p className="flex items-center gap-1.5 text-xs text-wisdom-500 uppercase tracking-widest mb-2.5 font-medium font-body">
        <BookOpen className="w-3.5 h-3.5" />
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sutras.map((s) => (
          <div
            key={s.id}
            className="badge-saffron flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg cursor-default
              transition-all duration-200 hover:scale-105 hover:shadow-glow"
            title={s.preview}
          >
            <BookOpen className="w-3 h-3 shrink-0" />
            {s.id}
          </div>
        ))}
      </div>
    </div>
  )
}
