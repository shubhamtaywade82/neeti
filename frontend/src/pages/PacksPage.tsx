import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { apiClient } from '../api/client'
import {
  Library,
  Search,
  Star,
  Check,
  Plus,
  Trash2
} from 'lucide-react'

interface Pack {
  id: string
  name: string
  emoji: string
  author: string
  version: string
  tier: string
  rating: number
  reviews: number
  nodes: number
  edges: number
  themes: number
  color: string
  borderColor: string
  bgColor: string
  desc: string
  tags: string[]
  official: boolean
  premium: boolean
}

export function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [installedPacks, setInstalledPacks] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'official' | 'premium'>('all')
  const { triggerPackSync } = useOutletContext<{ triggerPackSync?: () => void }>()

  // Load packs from backend API
  useEffect(() => {
    apiClient.get<{ packs: Pack[]; installed: string[] }>('/packs')
      .then((r) => {
        setPacks(r.data.packs || [])
        setInstalledPacks(r.data.installed || [])
        localStorage.setItem('neeti-installed-packs', JSON.stringify(r.data.installed || []))
      })
      .catch(() => {})
  }, [])

  const handleInstallToggle = async (id: string) => {
    const isInstalled = installedPacks.includes(id)
    const endpoint = isInstalled ? '/packs/uninstall' : '/packs/install'
    try {
      const { data } = await apiClient.post<{ success: boolean; installed: string[] }>(endpoint, { pack_id: id })
      if (data.success) {
        setInstalledPacks(data.installed)
        localStorage.setItem('neeti-installed-packs', JSON.stringify(data.installed))
        window.dispatchEvent(new Event('storage'))
        if (triggerPackSync) triggerPackSync()
      }
    } catch (e) {}
  }

  // Filter packs
  const filteredPacks = packs.filter((pack) => {
    const isInstalled = installedPacks.includes(pack.id)
    const matchesSearch =
      pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    if (activeTab === 'installed') return isInstalled
    if (activeTab === 'official') return pack.official
    if (activeTab === 'premium') return pack.premium

    return true
  })

  const renderStars = (rating: number) => {
    const stars = []
    const rounded = Math.round(rating)
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= rounded ? 'text-saffron-400 fill-saffron-400' : 'text-wisdom-600'
          }`}
        />
      )
    }
    return <div className="flex gap-0.5">{stars}</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-saffron-500 uppercase tracking-widest block mb-1">
          Knowledge Base
        </span>
        <h1 className="text-3xl font-bold font-display text-wisdom-100">
          Knowledge Packs
        </h1>
        <p className="text-sm text-wisdom-400 mt-1">
          Install structured knowledge modules to expand your advisor's reasoning capabilities.
        </p>
      </div>

      {/* Toolbar Filter Toggles */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl bg-wisdom-900 border border-wisdom-700/40 px-3.5 py-2 flex-1 max-w-md focus-within:border-saffron-600/60 focus-within:shadow-glow transition-all duration-200">
          <Search className="w-4 h-4 text-wisdom-500" />
          <input
            type="text"
            placeholder="Search packs by name, author, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-wisdom-100 placeholder-wisdom-500 text-xs focus:outline-none focus:ring-0 py-0"
          />
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1.5 p-1 bg-wisdom-900 border border-wisdom-700/40 rounded-xl select-none">
          {(['all', 'installed', 'official', 'premium'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-saffron-500/10 border border-saffron-500/20 text-saffron-400'
                  : 'border border-transparent text-wisdom-400 hover:text-wisdom-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Packs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPacks.map((pack) => {
          const isInstalled = installedPacks.includes(pack.id)
          return (
            <div
              key={pack.id}
              className={`glass-card border flex flex-col justify-between p-6 rounded-2xl transition-all duration-300 relative group hover:border-wisdom-700/80 hover:-translate-y-0.5 ${
                isInstalled ? 'border-l-[3px]' : 'border-wisdom-700/40'
              }`}
              style={{ borderLeftColor: isInstalled ? pack.color : undefined }}
            >
              <div>
                {/* Pack Header details */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                      style={{ background: pack.bgColor, borderColor: pack.borderColor }}
                    >
                      {pack.emoji}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-wisdom-100 group-hover:text-saffron-300 transition-colors">
                        {pack.name}
                      </h3>
                      <p className="text-[10px] text-wisdom-500 font-medium">
                        v{pack.version} · By {pack.author}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInstallToggle(pack.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all duration-200 ${
                      isInstalled
                        ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400'
                        : 'bg-saffron-500 hover:bg-saffron-400 text-wisdom-950 shadow-glow'
                    }`}
                  >
                    {isInstalled ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 group-hover:hidden" />
                        <span className="group-hover:hidden">Active</span>
                        <Trash2 className="w-3.5 h-3.5 hidden group-hover:inline-block" />
                        <span className="hidden group-hover:inline-block">Remove</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        Install
                      </span>
                    )}
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {pack.official && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-saffron-400 uppercase tracking-wider bg-saffron-500/10 border border-saffron-500/25 px-2 py-0.5 rounded-md">
                      Official
                    </span>
                  )}
                  {pack.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-semibold text-wisdom-400 bg-wisdom-800 border border-wisdom-700/40 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-wisdom-400 mt-4 leading-relaxed line-clamp-3">
                  {pack.desc}
                </p>
              </div>

              {/* Pack Stats Footer */}
              <div className="mt-6 pt-4 border-t border-wisdom-700/20">
                <div className="flex items-center justify-between text-[11px] text-wisdom-400">
                  <div className="flex items-center gap-2 font-medium">
                    <span>{pack.nodes.toLocaleString()} nodes</span>
                    <span className="w-1 h-1 rounded-full bg-wisdom-700" />
                    <span>{pack.edges.toLocaleString()} edges</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-wisdom-500">
                    {pack.tier}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3 justify-between">
                  <div className="flex items-center gap-1.5">
                    {renderStars(pack.rating)}
                    <span className="text-[10px] text-wisdom-500 font-bold">
                      ({pack.reviews})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredPacks.length === 0 && (
          <div className="col-span-full glass-card border border-wisdom-700/40 p-12 text-center text-wisdom-500 rounded-2xl select-none">
            <Library className="w-10 h-10 text-wisdom-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-wisdom-300">No packs found</h3>
            <p className="text-sm text-wisdom-500 mt-1 max-w-sm mx-auto">
              No knowledge packs match your query. Try clearing your search query or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
