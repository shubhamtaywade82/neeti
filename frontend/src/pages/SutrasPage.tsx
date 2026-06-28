import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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

const ALL_SUTRAS: Sutra[] = [
  { id: 1, pack: 'chanakya', chapter: 1, sutra: 1, devanagari: 'सुखस्य मूलं धर्मः। धर्मस्य मूलमर्थः।', translation: 'The root of happiness is righteousness (dharma). The root of righteousness is wealth/resourcefulness.', themes: ['Leadership', 'Foundation', 'Strategy'], concepts: ['Happiness', 'Dharma', 'Wealth'] },
  { id: 2, pack: 'chanakya', chapter: 3, sutra: 7, devanagari: 'दुर्जनः परिहर्तव्यः विद्यालंकृतोऽपि सन्।', translation: 'A wicked person should be avoided even if adorned with learning and virtue. A serpent with a jewel is still venomous.', themes: ['Ethics', 'Wisdom'], concepts: ['Discernment', 'Character'] },
  { id: 3, pack: 'chanakya', chapter: 7, sutra: 4, devanagari: 'मन्त्रिणां परिषत्कार्यम्…', translation: 'The work of the council of ministers must be conducted in utmost secrecy. Cabinet secrecy is the key to state safety.', themes: ['Leadership', 'Strategy'], concepts: ['Counsel', 'Secrecy'] },
  { id: 4, pack: 'chanakya', chapter: 11, sutra: 2, devanagari: 'यस्य मूलं दृढं तस्य शाखा विस्तृता भवति।', translation: 'He whose foundation is firm — his branches spread wide in all directions.', themes: ['Leadership', 'Foundation'], concepts: ['Stability', 'Growth'] },
  { id: 5, pack: 'chanakya', chapter: 5, sutra: 11, devanagari: 'सत्यं ब्रूयात् प्रियं ब्रूयात्…', translation: 'Speak truth; speak pleasantly. Do not speak unpleasant truths, nor pleasant falsehoods.', themes: ['Ethics', 'Communication'], concepts: ['Truth', 'Diplomacy'] },
  { id: 6, pack: 'chanakya', chapter: 2, sutra: 18, devanagari: 'अनालोच्य व्ययं कर्ता…', translation: 'One who spends without deliberation and clear objectives invites sudden ruin upon himself.', themes: ['Strategy', 'Foundation'], concepts: ['Resource Management', 'Discipline'] },
  { id: 7, pack: 'chanakya', chapter: 8, sutra: 3, devanagari: 'विद्या मित्रं प्रवासेषु।', translation: 'Knowledge is a friend in foreign lands; a wife is a companion at home.', themes: ['Wisdom', 'Learning'], concepts: ['Knowledge', 'Self-reliance'] },
  { id: 8, pack: 'gita', chapter: 2, sutra: 47, devanagari: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।', translation: 'You have a right to perform your duty, but never to the fruits thereof. Do not let the reward be your motive.', themes: ['Dharma', 'Action'], concepts: ['Detachment', 'Karma'] },
  { id: 9, pack: 'gita', chapter: 3, sutra: 19, devanagari: 'तस्मादसक्तः सततं कार्यं कर्म समाचर।', translation: 'Therefore, without attachment, always perform your prescribed duties.', themes: ['Dharma', 'Duty'], concepts: ['Action', 'Detachment'] },
  { id: 10, pack: 'gita', chapter: 6, sutra: 5, devanagari: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।', translation: 'A person must elevate themselves by their own mind, not degrade themselves. The mind is both a friend and an enemy.', themes: ['Self-mastery', 'Leadership'], concepts: ['Self-reliance', 'Upliftment'] }
]

const PACKS_DETAILS: Record<string, { emoji: string; name: string; color: string; bgColor: string; borderColor: string }> = {
  chanakya: { emoji: '🪔', name: 'Chanakya Neeti', color: '#E8A020', bgColor: 'rgba(232,160,32,0.08)', borderColor: 'rgba(232,160,32,0.35)' },
  gita: { emoji: '🌺', name: 'Bhagavad Gita', color: '#5C8A6A', bgColor: 'rgba(92,138,106,0.08)', borderColor: 'rgba(92,138,106,0.35)' }
}

export function SutrasPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const [filterPack, setFilterPack] = useState<string>('all')
  const [filterTheme, setFilterTheme] = useState<string>('all')
  const [installedPacks, setInstalledPacks] = useState<string[]>(['chanakya', 'gita'])

  const location = useLocation()

  // Load search query from URL state if navigated from top bar or dashboard
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('search')
    if (q) setSearchVal(q)

    const stored = localStorage.getItem('neeti-installed-packs')
    if (stored) {
      try {
        setInstalledPacks(JSON.parse(stored))
      } catch (e) {}
    }
  }, [location])

  // Get active themes from installed packs
  const activeSutras = ALL_SUTRAS.filter((s) => installedPacks.includes(s.pack))
  const allThemes = Array.from(new Set(activeSutras.flatMap((s) => s.themes)))

  // Filtering logic
  const filteredSutras = activeSutras.filter((sutra) => {
    if (filterPack !== 'all' && sutra.pack !== filterPack) return false
    if (filterTheme !== 'all' && !sutra.themes.includes(filterTheme)) return false

    const query = searchVal.toLowerCase()
    const matchesSearch =
      !query ||
      sutra.translation.toLowerCase().includes(query) ||
      sutra.devanagari.toLowerCase().includes(query) ||
      sutra.concepts.some((c) => c.toLowerCase().includes(query))

    return matchesSearch
  })

  const selectedSutra = ALL_SUTRAS.find((s) => s.id === selectedId)
  const selectedPack = selectedSutra ? PACKS_DETAILS[selectedSutra.pack] : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in relative z-20">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-saffron-500 uppercase tracking-widest block mb-1">
          Knowledge Browser
        </span>
        <h1 className="text-3xl font-bold font-display text-wisdom-100">
          Sutra Browser
        </h1>
        <p className="text-sm text-wisdom-400 mt-1">
          Explore grounded ancient verses and sutras indexed in your active knowledge packs.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between select-none">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl bg-wisdom-900 border border-wisdom-700/40 px-3.5 py-2 flex-1 max-w-md focus-within:border-saffron-600/60 focus-within:shadow-glow transition-all duration-200">
          <Search className="w-4 h-4 text-wisdom-500" />
          <input
            type="text"
            placeholder="Search by text, devanagari, or concept..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-transparent border-none text-wisdom-100 placeholder-wisdom-500 text-xs focus:outline-none focus:ring-0 py-0"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-2.5">
          {/* Pack Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-wisdom-900 border border-wisdom-700/40 rounded-xl">
            <BookMarked className="w-3.5 h-3.5 text-wisdom-500" />
            <select
              value={filterPack}
              onChange={(e) => setFilterPack(e.target.value)}
              className="bg-transparent border-none text-wisdom-300 text-xs font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-5 py-0"
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
          <div className="flex items-center gap-1.5 px-3 py-2 bg-wisdom-900 border border-wisdom-700/40 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-wisdom-500" />
            <select
              value={filterTheme}
              onChange={(e) => setFilterTheme(e.target.value)}
              className="bg-transparent border-none text-wisdom-300 text-xs font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-5 py-0"
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
          <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest px-1">
            Sutras ({filteredSutras.length})
          </div>
          {filteredSutras.map((sutra) => {
            const packDetails = PACKS_DETAILS[sutra.pack]
            const isSelected = selectedId === sutra.id
            return (
              <div
                key={sutra.id}
                onClick={() => setSelectedId(isSelected ? null : sutra.id)}
                className={`glass-card border p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col gap-3 group relative ${
                  isSelected ? 'border-saffron-500/40' : 'border-wisdom-700/40 hover:border-wisdom-700/80'
                }`}
              >
                {/* Sutra header */}
                <div className="flex items-start justify-between gap-4 select-none">
                  <div className="font-display font-medium text-saffron-300/90 text-base leading-relaxed italic">
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
                <p className="text-xs text-wisdom-300 leading-relaxed font-body">
                  "{sutra.translation}"
                </p>

                {/* Themes / Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2 select-none">
                  {sutra.themes.map((theme) => (
                    <span
                      key={theme}
                      className="px-2 py-0.5 rounded bg-wisdom-800 border border-wisdom-700/40 text-wisdom-400 text-[9px] font-semibold"
                    >
                      {theme}
                    </span>
                  ))}
                  {sutra.concepts.map((concept) => (
                    <span
                      key={concept}
                      className="px-2 py-0.5 rounded bg-saffron-500/5 border border-saffron-500/10 text-saffron-400/80 text-[9px] font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            ))}

          {filteredSutras.length === 0 && (
            <div className="glass-card border border-wisdom-700/40 rounded-xl p-12 text-center text-wisdom-500 select-none">
              <BookOpenCheck className="w-10 h-10 text-wisdom-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-wisdom-300">No sutras matched filters</h3>
              <p className="text-xs text-wisdom-500 mt-1">Try clearing your filters or text search query.</p>
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
                className="absolute top-4 right-4 p-1.5 rounded-lg text-wisdom-400 hover:text-wisdom-200 hover:bg-wisdom-800/40"
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
                  <h4 className="text-xs font-bold text-wisdom-100">{selectedPack.name}</h4>
                  <p className="text-[10px] text-wisdom-500">
                    Chapter {selectedSutra.chapter} · Sutra {selectedSutra.sutra}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest block">
                    Original Devanagari
                  </span>
                  <p className="text-lg text-saffron-300 font-display font-medium leading-relaxed italic">
                    {selectedSutra.devanagari}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest block">
                    English Translation
                  </span>
                  <p className="text-xs text-wisdom-300 leading-relaxed font-body">
                    "{selectedSutra.translation}"
                  </p>
                </div>

                <div className="space-y-2 border-t border-wisdom-700/20 pt-4">
                  <span className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest block">
                    Mapped Themes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSutra.themes.map((theme) => (
                      <span
                        key={theme}
                        className="px-2 py-0.5 rounded bg-wisdom-800 border border-wisdom-700/40 text-wisdom-300 text-[9px] font-semibold"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-wisdom-500 uppercase tracking-widest block">
                    Associated Concepts
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSutra.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="px-2 py-0.5 rounded bg-saffron-500/5 border border-saffron-500/20 text-saffron-400 text-[9px] font-semibold"
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
