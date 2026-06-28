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

  // Automatically switch tab back to 'en' when a new sutra is selected
  useEffect(() => {
    setActiveTab('en')
  }, [sutra?.id])

  if (!sutra) return null

  return (
    <>
      {/* Backdrop overlay on mobile */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 md:hidden animate-fade-in"
        onClick={onClose}
      />

      <aside 
        className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-wisdom-900/95 border-l border-wisdom-800/80 
          z-50 shadow-glow-strong flex flex-col animate-slide-in-right glass-strong"
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-wisdom-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-saffron-400" />
            <div>
              <h2 className="text-white font-semibold text-base font-body tracking-tight">Sutra Details</h2>
              <p className="text-xs text-saffron-400 font-medium tracking-wider">
                {sutra.id} {sutra.chapter ? `· Chapter ${sutra.chapter}` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-wisdom-800/50 text-wisdom-400 hover:text-white hover:bg-wisdom-800 
              transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {/* Sanskrit Calligraphy Card */}
          {sutra.sanskrit && (
            <div className="relative overflow-hidden bg-gradient-to-br from-saffron-900/20 via-saffron-900/10 to-wisdom-950/80 
              border border-saffron-500/20 rounded-2xl p-5 shadow-glow"
            >
              <div className="absolute top-0 right-0 text-saffron-500/5 font-display text-8xl pointer-events-none select-none">
                नी
              </div>
              <p className="text-saffron-200 text-center font-display text-lg md:text-xl leading-relaxed tracking-wide font-semibold">
                {sutra.sanskrit}
              </p>
              
              {sutra.transliteration && (
                <p className="text-wisdom-400 text-center text-xs italic mt-4 font-body border-t border-wisdom-800/50 pt-3">
                  {sutra.transliteration}
                </p>
              )}
            </div>
          )}

          {/* Translations Tab Selector */}
          <div className="space-y-3">
            <div className="flex bg-wisdom-950 p-1 rounded-xl border border-wisdom-800/60">
              <button 
                onClick={() => setActiveTab('en')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'en' 
                    ? 'bg-saffron-600 text-white shadow-glow' 
                    : 'text-wisdom-400 hover:text-wisdom-200'
                }`}
              >
                English
              </button>
              <button 
                onClick={() => setActiveTab('hi')}
                disabled={!sutra.translation_hi}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:hover:text-wisdom-400 ${
                  activeTab === 'hi' 
                    ? 'bg-saffron-600 text-white shadow-glow' 
                    : 'text-wisdom-400 hover:text-wisdom-200'
                }`}
              >
                Hindi
              </button>
            </div>

            <div className="bg-wisdom-950/40 border border-wisdom-800/50 rounded-2xl p-4 min-h-[90px]">
              <p className="text-wisdom-100 text-sm leading-relaxed font-body">
                {activeTab === 'en' 
                  ? sutra.translation_en || "Translation unavailable." 
                  : sutra.translation_hi || "Hindi translation unavailable."
                }
              </p>
            </div>
          </div>

          {/* Chapter Metadata */}
          {sutra.chapter_title && (
            <div className="bg-wisdom-950/20 border border-wisdom-800/40 rounded-xl px-4 py-3 flex items-start gap-3">
              <Compass className="w-5 h-5 text-saffron-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-wisdom-400 font-medium uppercase tracking-wider">Chapter Context</p>
                <p className="text-wisdom-200 text-xs mt-0.5">{sutra.chapter_title}</p>
              </div>
            </div>
          )}

          {/* Taxonomy Tags */}
          <div className="space-y-4 pt-2">
            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-wisdom-800/50 pb-2">
              Philosophical Lenses
            </h3>

            {/* Virtues */}
            {sutra.virtues && sutra.virtues.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-body">
                  <Sparkles className="w-3.5 h-3.5" />
                  Virtues
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sutra.virtues.map((v) => (
                    <span key={v} className="text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-2.5 py-1 rounded-lg">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vices */}
            {sutra.vices && sutra.vices.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-body">
                  <Activity className="w-3.5 h-3.5" />
                  Vices
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sutra.vices.map((v) => (
                    <span key={v} className="text-xs bg-rose-500/10 border border-rose-500/25 text-rose-300 px-2.5 py-1 rounded-lg">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Situations */}
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

            {/* Emotions */}
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

            {/* Themes */}
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
