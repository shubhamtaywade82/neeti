import React, { useState } from 'react'
import { clsx } from 'clsx'
import { Shield, Target, BookOpen, Lightbulb, Scale, ChevronDown, ChevronUp } from 'lucide-react'

interface CitedSutra {
  type: 'sutra' | 'document'
  id: string
  preview: string
  sanskrit?: string
  transliteration?: string
  translation_en: string
  translation_hi?: string
  chapter: number
  chapter_title: string
  pack?: string
  advisory_status?: string
  contextual_wrapper?: {
    is_contextual: boolean
    category: string
    heading: string
    framing_text: string
  } | null
}

interface ContextualWrapper {
  sutra_id: string
  category: string
  heading: string
  framing_text: string
}

interface StrategicBriefProps {
  situationReadback: string
  frame: string
  citedSutras: CitedSutra[]
  appliedCounsel: string
  counterweight: string
  contextualWrappers?: ContextualWrapper[]
  onChallenge?: () => void
  onWhatAmIMissing?: () => void
  onCompareOptions?: () => void
}

export function StrategicBrief({
  situationReadback,
  frame,
  citedSutras,
  appliedCounsel,
  counterweight,
  contextualWrappers = [],
  onChallenge,
  onWhatAmIMissing,
  onCompareOptions
}: StrategicBriefProps) {
  const [expandedSutras, setExpandedSutras] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['readback', 'frame', 'counsel', 'counterweight'])
  )

  const toggleSutra = (id: string) => {
    const newExpanded = new Set(expandedSutras)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSutras(newExpanded)
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getWrapperForSutra = (sutraId: string) => {
    return contextualWrappers.find(w => w.sutra_id === sutraId)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
      {/* 1. Situation Readback */}
      <section className="bg-surface-50 rounded-xl p-5 border border-surface-200/40">
        <button
          onClick={() => toggleSection('readback')}
          className="w-full flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wide">
              Situation Readback
            </h3>
          </div>
          {expandedSections.has('readback') ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </button>
        
        {expandedSections.has('readback') && (
          <div className="text-surface-700 text-sm leading-relaxed pl-7.5">
            {situationReadback}
          </div>
        )}
      </section>

      {/* 2. The Frame */}
      <section className="bg-gradient-to-br from-primary-50/50 to-surface-50 rounded-xl p-5 border border-primary-200/30">
        <button
          onClick={() => toggleSection('frame')}
          className="w-full flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wide">
              The Frame
            </h3>
          </div>
          {expandedSections.has('frame') ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </button>
        
        {expandedSections.has('frame') && (
          <div className="text-surface-700 text-sm leading-relaxed pl-7.5">
            {frame}
          </div>
        )}
      </section>

      {/* 3. Cited Sutras */}
      {citedSutras.length > 0 && (
        <section className="bg-amber-50/30 rounded-xl p-5 border border-amber-200/30">
          <button
            onClick={() => toggleSection('sutras')}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-amber-700" />
              <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wide">
                Cited Sutras ({citedSutras.length})
              </h3>
            </div>
            {expandedSections.has('sutras') ? (
              <ChevronUp className="w-4 h-4 text-surface-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-surface-400" />
            )}
          </button>
          
          {expandedSections.has('sutras') && (
            <div className="space-y-3 pl-7.5">
              {citedSutras.map((sutra, idx) => {
                const wrapper = getWrapperForSutra(sutra.id)
                const isExpanded = expandedSutras.has(sutra.id)
                
                return (
                  <div
                    key={sutra.id}
                    className={clsx(
                      'rounded-lg border transition-all duration-200',
                      wrapper?.is_contextual
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-surface-200/40 bg-surface-0'
                    )}
                  >
                    {/* Sutra header - always visible */}
                    <button
                      onClick={() => toggleSutra(sutra.id)}
                      className="w-full p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                            {sutra.chapter}.{idx + 1}
                          </span>
                          {wrapper?.is_contextual && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Contextual
                            </span>
                          )}
                        </div>
                        <p className="text-surface-700 text-xs leading-relaxed line-clamp-2">
                          {sutra.translation_en}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                    
                    {/* Expanded sutra details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-inherit">
                        {/* Contextual wrapper if applicable */}
                        {wrapper?.is_contextual && (
                          <div className="mb-3 mt-2 p-3 bg-amber-100/50 rounded border-l-4 border-amber-400">
                            <h4 className="font-semibold text-amber-800 text-xs mb-1">
                              {wrapper.heading}
                            </h4>
                            <p className="text-amber-700 text-xs leading-relaxed">
                              {wrapper.framing_text}
                            </p>
                          </div>
                        )}
                        
                        {sutra.sanskrit && (
                          <div className="mb-2">
                            <p className="text-surface-800 text-sm font-medium leading-loose dir-rtl" lang="sa">
                              {sutra.sanskrit}
                            </p>
                          </div>
                        )}
                        
                        {sutra.transliteration && (
                          <p className="text-surface-600 text-xs italic mb-2">
                            {sutra.transliteration}
                          </p>
                        )}
                        
                        <p className="text-surface-700 text-sm leading-relaxed mb-2">
                          {sutra.translation_en}
                        </p>
                        
                        {sutra.translation_hi && (
                          <p className="text-surface-500 text-xs leading-relaxed">
                            {sutra.translation_hi}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. Applied Counsel */}
      <section className="bg-surface-0 rounded-xl p-5 border border-surface-200/40 shadow-sm">
        <button
          onClick={() => toggleSection('counsel')}
          className="w-full flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wide">
              Applied Counsel
            </h3>
          </div>
          {expandedSections.has('counsel') ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </button>
        
        {expandedSections.has('counsel') && (
          <div className="text-surface-700 text-sm leading-relaxed pl-7.5 whitespace-pre-wrap">
            {appliedCounsel}
          </div>
        )}
      </section>

      {/* 5. The Counterweight (Mandatory) */}
      <section className="bg-gradient-to-br from-slate-50 to-surface-50 rounded-xl p-5 border border-slate-300/40">
        <button
          onClick={() => toggleSection('counterweight')}
          className="w-full flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wide">
              The Counterweight
            </h3>
          </div>
          {expandedSections.has('counterweight') ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </button>
        
        {expandedSections.has('counterweight') && (
          <div className="text-surface-700 text-sm leading-relaxed pl-7.5">
            {counterweight}
          </div>
        )}
      </section>

      {/* Deliberation Interface - Structured Follow-ups */}
      {(onChallenge || onWhatAmIMissing || onCompareOptions) && (
        <div className="pt-4 border-t border-surface-200/40">
          <p className="text-surface-500 text-xs font-semibold uppercase tracking-wide mb-3 text-center">
            Next Steps
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {onChallenge && (
              <button
                onClick={onChallenge}
                className="px-4 py-2 bg-surface-0 hover:bg-surface-50 border border-surface-300 rounded-lg text-surface-700 text-xs font-medium transition-colors duration-200"
              >
                Challenge my thinking
              </button>
            )}
            {onWhatAmIMissing && (
              <button
                onClick={onWhatAmIMissing}
                className="px-4 py-2 bg-surface-0 hover:bg-surface-50 border border-surface-300 rounded-lg text-surface-700 text-xs font-medium transition-colors duration-200"
              >
                What am I missing?
              </button>
            )}
            {onCompareOptions && (
              <button
                onClick={onCompareOptions}
                className="px-4 py-2 bg-surface-0 hover:bg-surface-50 border border-surface-300 rounded-lg text-surface-700 text-xs font-medium transition-colors duration-200"
              >
                Compare my options
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
