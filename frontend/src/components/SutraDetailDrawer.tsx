import { X, BookOpen, Activity, Sparkles, Smile, Compass, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export interface SutraDetail {
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
  sutra: SutraDetail | null
  onClose: () => void
}

export function SutraDetailDrawer({ sutra, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'en' | 'hi'>('en')

  useEffect(() => {
    setActiveTab('en')
  }, [sutra?.id])

  if (!sutra) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 md:hidden animate-fade-in"
        onClick={onClose}
      />

      <aside
        className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-surface-50/95 border-l border-surface-100/80
          z-50 shadow-glow-strong flex flex-col animate-slide-in-right glass-strong"
      >
        <header className="px-6 py-5 border-b border-surface-100/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-400" />
            <div>
              <h2 className="text-surface-800 font-semibold text-base font-body tracking-tight">Sutra Details</h2>
              <p className="text-xs text-primary-400 font-medium tracking-wider">
                {sutra.id} {sutra.chapter ? `· Chapter ${sutra.chapter}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-100/50 text-surface-500 hover:text-surface-800 hover:bg-surface-100
              transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {sutra.sanskrit && (
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-900/20 via-primary-900/10 to-surface-0/80
              border border-primary-500/20 rounded-2xl p-5 shadow-glow"
            >
              <div className="absolute top-0 right-0 text-primary-500/5 font-display text-8xl pointer-events-none select-none">
                नी
              </div>
              <p className="text-primary-200 text-center font-display text-lg md:text-xl leading-relaxed tracking-wide font-semibold">
                {sutra.sanskrit}
              </p>

              {sutra.transliteration && (
                <p className="text-surface-500 text-center text-xs italic mt-4 font-body border-t border-surface-100/50 pt-3">
                  {sutra.transliteration}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex bg-surface-0 p-1 rounded-xl border border-surface-100/60">
              <button
                onClick={() => setActiveTab('en')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'en'
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-surface-500 hover:text-surface-600'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setActiveTab('hi')}
                disabled={!sutra.translation_hi}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:hover:text-surface-500 ${
                  activeTab === 'hi'
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-surface-500 hover:text-surface-600'
                }`}
              >
                Hindi
              </button>
            </div>

            <div className="bg-surface-0/40 border border-surface-100/50 rounded-2xl p-4 min-h-[90px]">
              <p className="text-surface-800 text-sm leading-relaxed font-body">
                {activeTab === 'en'
                  ? sutra.translation_en || "Translation unavailable."
                  : sutra.translation_hi || "Hindi translation unavailable."
                }
              </p>
            </div>
          </div>

          {sutra.chapter_title && (
            <div className="bg-surface-0/20 border border-surface-100/40 rounded-xl px-4 py-3 flex items-start gap-3">
              <Compass className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Chapter Context</p>
                <p className="text-surface-700 text-xs mt-0.5">{sutra.chapter_title}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <h3 className="text-surface-800 text-xs font-bold uppercase tracking-widest border-b border-surface-100/50 pb-2">
              Philosophical Lenses
            </h3>

            {sutra.virtues && sutra.virtues.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-accent-400 font-semibold font-body">
                  <Sparkles className="w-3.5 h-3.5" />
                  Virtues
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sutra.virtues.map((v) => (
                    <span key={v} className="text-xs bg-accent-500/10 border border-accent-500/25 text-accent-300 px-2.5 py-1 rounded-lg">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sutra.vices && sutra.vices.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-danger-400 font-semibold font-body">
                  <Activity className="w-3.5 h-3.5" />
                  Vices
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sutra.vices.map((v) => (
                    <span key={v} className="text-xs bg-danger-500/10 border border-danger-500/25 text-danger-300 px-2.5 py-1 rounded-lg">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sutra.situations && sutra.situations.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold font-body">
                  <Compass className="w-3.5 h-3.5" />
                  Situations
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sutra.situations.map((s) => (
                    <span key={s} className="text-xs bg-amber-500/10 border border-amber-500/25 text-amber-300 px-2.5 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sutra.emotions && sutra.emotions.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold font-body">
                  <Smile className="w-3.5 h-3.5" />
                  Emotions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sutra.emotions.map((e) => (
                    <span key={e} className="text-xs bg-violet-500/10 border border-violet-500/25 text-violet-300 px-2.5 py-1 rounded-lg">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sutra.themes && sutra.themes.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold font-body">
                  <HelpCircle className="w-3.5 h-3.5" />
                  General Themes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sutra.themes.map((t) => (
                    <span key={t} className="text-xs bg-sky-500/10 border border-sky-500/25 text-sky-300 px-2.5 py-1 rounded-lg">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
