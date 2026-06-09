interface Sutra {
  id:      string
  preview: string
}

export function SourceCitation({ sutras }: { sutras: Sutra[] }) {
  if (!sutras?.length) return null

  return (
    <div className="mt-4 mb-2 border-t border-stone-800 pt-3">
      <p className="text-xs text-stone-500 uppercase tracking-widest mb-2 font-medium">
        Sutras cited
      </p>
      <div className="flex flex-wrap gap-2">
        {sutras.map((s) => (
          <div
            key={s.id}
            className="text-xs px-2 py-1 bg-stone-800 rounded text-amber-300 border border-stone-700"
            title={s.preview}
          >
            📜 {s.id}
          </div>
        ))}
      </div>
    </div>
  )
}
