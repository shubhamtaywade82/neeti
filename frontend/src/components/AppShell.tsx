import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { useFeatureFlagsStore } from '../stores/featureFlagsStore'
import {
  LayoutDashboard,
  MessageSquare,
  Network,
  Library,
  BookOpen,
  Brain,
  Settings,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  Compass,
  X,
  Search,
  Check,
  Shield,
  FolderOpen,
  FileText
} from 'lucide-react'

// Mock description for the active packs orb
const ACTIVE_PACKS_METADATA: Record<string, { emoji: string; name: string; bgColor: string; borderColor: string; color: string }> = {
  chanakya: { emoji: '🪔', name: 'Chanakya Neeti', bgColor: 'rgba(232,160,32,0.08)', borderColor: 'rgba(232,160,32,0.35)', color: '#E8A020' },
  gita: { emoji: '🌺', name: 'Bhagavad Gita', bgColor: 'rgba(92,138,106,0.08)', borderColor: 'rgba(92,138,106,0.35)', color: '#5C8A6A' },
  arthashastra: { emoji: '⚖️', name: 'Arthashastra', bgColor: 'rgba(155,138,224,0.08)', borderColor: 'rgba(155,138,224,0.35)', color: '#9B8AE0' },
  atomic: { emoji: '⚡', name: 'Atomic Habits', bgColor: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.35)', color: '#60A5FA' },
  stoic: { emoji: '🏛️', name: 'Stoic Meditations', bgColor: 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.35)', color: '#94A3B8' },
  sunzi: { emoji: '🎴', name: 'The Art of War', bgColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.35)', color: '#F87171' },
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [installedPacks, setInstalledPacks] = useState<string[]>(['chanakya', 'gita'])

  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { flags } = useFeatureFlagsStore()

  // Load installed packs from backend API
  useEffect(() => {
    apiClient.get<{ packs: any[]; installed: string[] }>('/packs')
      .then((r) => {
        setInstalledPacks(r.data.installed || [])
        localStorage.setItem('neeti-installed-packs', JSON.stringify(r.data.installed || []))
      })
      .catch(() => {
        const stored = localStorage.getItem('neeti-installed-packs')
        if (stored) {
          try {
            setInstalledPacks(JSON.parse(stored))
          } catch (e) {}
        }
      })
  }, [location])

  // Sync state if packs view is updated
  const triggerPackSync = () => {
    const stored = localStorage.getItem('neeti-installed-packs')
    if (stored) {
      try {
        setInstalledPacks(JSON.parse(stored))
      } catch (e) {}
    }
  }

  // Monitor storage changes from other views
  useEffect(() => {
    window.addEventListener('storage', triggerPackSync)
    return () => window.removeEventListener('storage', triggerPackSync)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard, enabled: flags.dashboardView },
    { id: 'chat', path: '/chat', label: 'AI Chat', icon: MessageSquare, enabled: true },
    { id: 'library', path: '/packs', label: 'Library', icon: Library, enabled: flags.packsView },
    { id: 'graph', path: '/graph', label: 'Knowledge Graph', icon: Network, enabled: flags.graphExplorerView },
    { id: 'browse', path: '/sutras', label: 'Browse', icon: BookOpen, enabled: flags.sutraBrowserView },
    { id: 'documents', path: '/documents', label: 'Documents', icon: FileText, enabled: flags.documentsView },
    { id: 'collections', path: '/collections', label: 'Collections', icon: FolderOpen, enabled: flags.collectionsView },
    { id: 'memory', path: '/memory', label: 'Memory', icon: Brain, enabled: flags.memoryInsightsView },
  ]

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', path: '/admin', label: 'System Console', icon: Shield, enabled: true })
  }

  const visibleNavs = navItems.filter((item) => item.enabled)
  const avatarLetter = user?.email?.charAt(0).toUpperCase() ?? '?'

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-100 border-r border-surface-700/40 relative z-30 select-none">
      {/* Sidebar Header Logo */}
      <div className="sidebar-header px-5 py-4 border-b border-surface-700/40 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>
        <div className="logo-text">
          <h1 className="text-lg font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 leading-none">
            KOS
          </h1>
          <span className="text-[10px] text-surface-500 font-body uppercase tracking-[0.2em] font-semibold mt-0.5 block">
            Knowledge OS
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="text-[9px] font-bold text-surface-500 uppercase tracking-widest px-3 mb-2">
            Workspace
          </div>
        {visibleNavs.map((item) => {
          const isActive = location.pathname === item.path
          const IconComponent = item.icon
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border relative ${
                isActive
                  ? 'bg-primary-500/10 border-primary-500/20 text-primary-400 font-semibold'
                  : 'border-transparent text-surface-400 hover:bg-surface-800/40 hover:text-surface-100'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-md" />
              )}
              <IconComponent className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Active Packs Summary */}
      <div className="px-4 py-4 border-t border-surface-700/40 bg-surface-0/20">
        <div className="text-[9px] font-bold text-surface-500 uppercase tracking-widest px-1 mb-3">
          Active Packs ({installedPacks.length})
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {installedPacks.map((packId) => {
            const pack = ACTIVE_PACKS_METADATA[packId]
            if (!pack) return null
            return (
              <div
                key={packId}
                onClick={() => {
                  setMobileOpen(false)
                  navigate('/packs')
                }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-800/40 cursor-pointer transition-colors duration-150"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: pack.bgColor, border: `1px solid ${pack.borderColor}` }}
                >
                  {pack.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-surface-200 truncate">
                    {pack.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-surface-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            )
          })}
          {installedPacks.length === 0 && (
            <div className="text-xs text-surface-500 px-1 py-1.5 italic">
              No active knowledge packs
            </div>
          )}
        </div>
      </div>

      {/* User Plan Badge / Upgrade banner */}
      <div className="p-3 border-t border-surface-700/40">
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-500/2 bg-opacity-10 border border-primary-500/20 hover:border-primary-500/35 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-primary-400 font-bold text-sm">✦</span>
            <div>
              <div className="text-[9px] font-semibold text-surface-500 uppercase tracking-wide">Plan</div>
              <div className="text-xs font-bold text-primary-300 capitalize">{user?.plan ?? 'free'} Plan</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-500" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative flex h-screen bg-surface-0 font-body overflow-hidden">
      {/* Background grid overlay */}
      <div className="fixed inset-0 grid-overlay opacity-40 pointer-events-none z-0" />

      {/* ── MOBILE DRAWER SIDEBAR ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full z-50 animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-44px] p-2 bg-surface-100 border border-surface-700/40 text-surface-400 hover:text-surface-200 rounded-lg shadow-lg z-50"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── PERSISTENT DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex md:w-70 shrink-0 h-full flex-col z-20">
        {sidebarContent}
      </aside>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* GLOBAL HEADER TOPBAR */}
        <header className="h-14 glass border-b border-surface-700/30 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30 select-none">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-surface-800/60 transition-all duration-150"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-sm sm:max-w-md mx-4">
            <div
              className={`flex items-center gap-2 rounded-xl bg-surface-100/50 border px-3 py-1.5 transition-all duration-200 ${
                searchFocused
                  ? 'border-primary-600/40 shadow-glow ring-1 ring-primary-600/10'
                  : 'border-surface-700/40 hover:border-surface-700/80'
              }`}
            >
              <Search className="w-4 h-4 text-surface-500" />
              <input
                type="text"
                placeholder="Search knowledge..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchVal.trim()) {
                    navigate(`/sutras?search=${encodeURIComponent(searchVal.trim())}`)
                    setSearchVal('')
                  }
                }}
                className="w-full bg-transparent border-none text-surface-800 placeholder-surface-500 text-xs focus:outline-none focus:ring-0 py-0"
              />
              <span className="hidden sm:inline-flex items-center text-[9px] font-bold text-surface-500 bg-surface-200 border border-surface-700/40 rounded px-1.5 py-0.5">
                ⌘K
              </span>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Notification bell */}
            <button className="relative w-8 h-8 rounded-lg border border-surface-700/40 bg-surface-100/50 hover:border-surface-700/80 text-surface-400 hover:text-primary-400 flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
            </button>

            {/* Settings Link */}
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-lg border border-surface-700/40 bg-surface-100/50 hover:border-surface-700/80 text-surface-400 hover:text-primary-400 flex items-center justify-center transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Separator */}
            <div className="w-px h-5 bg-surface-700/40 mx-0.5" />

            {/* Profile trigger */}
            <div className="flex items-center gap-2">
              <div
                onClick={() => navigate('/settings')}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 border border-primary-500/20 hover:border-primary-500/50 flex items-center justify-center shadow-glow cursor-pointer transition-all duration-200"
              >
                <span className="text-xs font-bold text-white font-body leading-none">
                  {avatarLetter}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-surface-500 hover:text-danger-400 px-2.5 py-1.5 rounded-lg hover:bg-surface-800/30 transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* VIEW AREA */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto relative z-20">
          <Outlet context={{ triggerPackSync }} />
        </main>
      </div>
    </div>
  )
}
