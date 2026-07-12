import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { apiClient } from '../api/client'
import {
  Search,
  BookOpen,
  Filter,
  ChevronRight,
  BookMarked,
  Tag,
  BookOpenCheck,
  X
} from 'lucide-react'

interface Sutra {
  id: number
  pack: string
  chapter: number
  sutra: number
  devanagari: string
  translation: string
  themes: string[]
  concepts: string[]
}

const PACKS_DETAILS: Record<string, { emoji: string; name: string; color: string; bgColor: string; borderColor: string }> = {
  chanakya: { emoji: '🪔', name: 'Chanakya Neeti', color: '#E8A020', bgColor: 'rgba(232,160,32,0.08)', borderColor: 'rgba(232,160,32,0.35)' },
  gita: { emoji: '🌺', name: 'Bhagavad Gita', color: '#5C8A6A', bgColor: 'rgba(92,138,106,0.08)', borderColor: 'rgba(92,138,106,0.35)' },
  arthashastra: { emoji: '⚖️', name: 'Arthashastra', color: '#9B8AE0', bgColor: 'rgba(155,138,224,0.08)', borderColor: 'rgba(155,138,224,0.35)' },
  stoic: { emoji: '🏛️', name: 'Stoic Meditations', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.35)' },
  sunzi: { emoji: '🎴', name: 'The Art of War', color: '#F87171', bgColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.35)' },
  atomic: { emoji: '⚡', name: 'Atomic Habits', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.35)' },
}

export function SutrasPage() {
  const [sutras, setSutras] = useState<Sutra[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const [filterPack, setFilterPack] = useState<string>('all')
  const [filterTheme, setFilterTheme] = useState<string>('all')
  const [installedPacks, setInstalledPacks] = useState<string[]>(['chanakya', 'gita'])

  const location = useLocation()

  // Load active packs
  useEffect(() => {
    const stored = localStorage.getItem('neeti-installed-packs')
    if (stored) {
      try {
        setInstalledPacks(JSON.parse(stored))
      } catch (e) {}
    }
  }, [])

  // Fetch sutras from backend API when search/filters change
  useEffect(() => {
    const params: Record<string, string> = {}
    if (searchVal.trim()) params.search = searchVal.trim()
    if (filterTheme !== 'all') params.theme = filterTheme

    apiClient.get<Sutra[]>('/sutras', { params })
      .then((r) => {
        setSutras(r.data || [])
      })
      .catch(() => {})
  }, [searchVal, filterTheme])

  // Get all unique themes
  const allThemes = Array.from(new Set(sutras.flatMap((s) => s.themes)))

  // Client-side pack filter
  const filteredSutras = sutras.filter((sutra) => {
    // 1. Must be from installed pack
    if (!installedPacks.includes(sutra.pack)) return false
    // 2. Tab pack filter
    if (filterPack !== 'all' && sutra.pack !== filterPack) return false
    return true
  })

  const selectedSutra = sutras.find((s) => s.id === selectedId)
  const selectedPack = selectedSutra ? PACKS_DETAILS[selectedSutra.pack] : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in relative z-20">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest block mb-1">
          Knowledge Browser
        </span>
        <h1 className="text-3xl font-bold font-display text-surface-800">
          Sutra Browser
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          Explore grounded ancient verses and sutras indexed in your active knowledge packs.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between select-none">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 border border-surface-200/40 px-3.5 py-2 flex-1 max-w-md focus-within:border-primary-600/60 focus-within:shadow-glow transition-all duration-200">
          <Search className="w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by text, devanagari, or concept..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-transparent border-none text-surface-800 placeholder-surface-400 text-xs focus:outline-none focus:ring-0 py-0"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-2.5">
          {/* Pack Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-50 border border-surface-200/40 rounded-xl">
            <BookMarked className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={filterPack}
              onChange={(e) => setFilterPack(e.target.value)}
              className="bg-transparent border-none text-surface-600 text-xs font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-5 py-0"
            >
              <option value="all">All Packs</option>
              {installedPacks.map((packId) => {
                const details = PACKS_DETAILS[packId]
                return details ? (
                  <option key={packId} value={packId}>
                    {details.emoji} {details.name}
                  </option>
                ) : null
              })}
            </select>
          </div>

          {/* Theme Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-50 border border-surface-200/40 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-surface-400" />
            <select
              value={filterTheme}
              onChange={(e) => setFilterTheme(e.target.value)}
              className="bg-transparent border-none text-surface-600 text-xs font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-5 py-0"
            >
              <option value="all">All Themes</option>
              {allThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Left Feed, Right Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-[9px] font-bold text-surface-400 uppercase tracking-widest px-1">
            Sutras ({filteredSutras.length})
          </div>
          {filteredSutras.map((sutra) => {
            const packDetails = PACKS_DETAILS[sutra.pack] || PACKS_DETAILS.chanakya
            const isSelected = selectedId === sutra.id
            return (
              <div
                key={sutra.id}
                onClick={() => setSelectedId(isSelected ? null : sutra.id)}
                className={`glass-card border p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col gap-3 group relative ${
                  isSelected ? 'border-primary-500/40' : 'border-surface-200/40 hover:border-surface-200/80'
                }`}
              >
                {/* Sutra header */}
                <div className="flex items-start justify-between gap-4 select-none">
                  <div className="font-display font-medium text-primary-300/90 text-base leading-relaxed italic">
                    {sutra.devanagari}
                  </div>
                  {packDetails && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase shrink-0"
                      style={{
                        background: packDetails.bgColor,
                        borderColor: packDetails.borderColor,
                        color: packDetails.color
                      }}
                    >
                      {packDetails.emoji} Ch.{sutra.chapter} · S.{sutra.sutra}
                    </span>
                  )}
                </div>

                {/* Translation */}
                <p className="text-xs text-surface-600 leading-relaxed font-body">
                  "{sutra.translation}"
                </p>

                {/* Themes / Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2 select-none">
                  {sutra.themes.map((theme) => (
                    <span
                      key={theme}
                      className="px-2 py-0.5 rounded bg-surface-100 border border-surface-200/40 text-surface-500 text-[9px] font-semibold"
                    >
                      {theme}
                    </span>
                  ))}
                  {sutra.concepts.map((concept) => (
                    <span
                      key={concept}
                      className="px-2 py-0.5 rounded bg-primary-500/5 border border-primary-500/10 text-primary-400/80 text-[9px] font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredSutras.length === 0 && (
            <div className="glass-card border border-surface-200/40 rounded-xl p-12 text-center text-surface-400 select-none">
              <BookOpenCheck className="w-10 h-10 text-surface-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-surface-600">No sutras matched filters</h3>
              <p className="text-xs text-surface-400 mt-1">Try clearing your filters or text search query.</p>
            </div>
          )}
        </div>

        {/* Right Sticky Detail Panel */}
        {selectedSutra && selectedPack && (
          <div className="lg:sticky lg:top-20 space-y-4 animate-scale-in select-none">
            <div
              className="glass-card border rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${selectedPack.bgColor}, rgba(30, 41, 59, 0.4))`,
                borderColor: selectedPack.borderColor
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100/40"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
                  style={{ background: selectedPack.bgColor, borderColor: selectedPack.borderColor }}
                >
                  {selectedPack.emoji}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-surface-800">{selectedPack.name}</h4>
                  <p className="text-[10px] text-surface-400">
                    Chapter {selectedSutra.chapter} · Sutra {selectedSutra.sutra}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest block">
                    Original Devanagari
                  </span>
                  <p className="text-lg text-primary-300 font-display font-medium leading-relaxed italic">
                    {selectedSutra.devanagari}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest block">
                    English Translation
                  </span>
                  <p className="text-xs text-surface-600 leading-relaxed font-body">
                    "{selectedSutra.translation}"
                  </p>
                </div>

                <div className="space-y-2 border-t border-surface-200/20 pt-4">
                  <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest block">
                    Mapped Themes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSutra.themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-2 py-0.5 rounded bg-surface-100 border border-surface-200/40 text-surface-600 text-[9px] font-semibold"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest block">
                    Associated Concepts
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSutra.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="px-2 py-0.5 rounded bg-primary-500/5 border border-primary-500/20 text-primary-400 text-[9px] font-semibold"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
