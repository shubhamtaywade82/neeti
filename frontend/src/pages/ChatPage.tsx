import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Settings, LogOut, Sparkles } from 'lucide-react'
import { ChatWindow } from '../components/ChatWindow'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { DailySutraWidget } from '../components/DailySutraWidget'
import { SubscriptionModal } from '../components/SubscriptionModal'
import { useAuthStore } from '../stores/authStore'

export function ChatPage() {
  const [activeConvoId, setActiveConvoId] = useState<number | undefined>()
  const [showUpgrade, setShowUpgrade]     = useState(false)
  const [prefillQuery, setPrefillQuery]   = useState<string>('')
  const [cagMode, setCagMode]             = useState(false)
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  const logout  = useAuthStore((s) => s.logout)
  const user    = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const avatarLetter = user?.email?.charAt(0).toUpperCase() ?? '?'
  const isFree = user?.plan === 'free'
  const planLabel = user?.plan
    ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1)
    : 'Free'

  return (
    <div className="flex h-screen bg-wisdom-950 font-body">
      {/* ── Mobile backdrop overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <ConversationSidebar
          activeId={activeConvoId}
          refreshTrigger={activeConvoId}
          onSelect={(id) => {
            setActiveConvoId(id)
            setSidebarOpen(false)
          }}
          onNewChat={() => {
            setActiveConvoId(undefined)
            setSidebarOpen(false)
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Main content area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top bar ───────────────────────────────────────────── */}
        <header className="glass border-b border-wisdom-800/60 px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-3 animate-fade-in">
          {/* Left: hamburger + avatar + email */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-wisdom-400 hover:text-saffron-400 hover:bg-wisdom-800/60 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Avatar circle */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-saffron-600 flex items-center justify-center shadow-glow">
              <span className="text-sm font-semibold text-wisdom-950 font-display leading-none">
                {avatarLetter}
              </span>
            </div>

            {/* Email */}
            <span className="text-wisdom-400 text-xs sm:text-sm truncate max-w-[160px] sm:max-w-xs">
              {user?.email}
            </span>
          </div>

          {/* Right: plan badge, settings, upgrade, logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Plan badge */}
            <span
              className={`hidden sm:inline-flex text-[11px] font-medium px-2.5 py-0.5 rounded-full tracking-wide ${
                isFree
                  ? 'bg-wisdom-800 text-wisdom-400 border border-wisdom-700'
                  : 'badge-saffron'
              }`}
            >
              {planLabel}
            </span>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="p-1.5 rounded-lg text-wisdom-500 hover:text-saffron-400 hover:bg-wisdom-800/60 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Upgrade (free users only) */}
            {isFree && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="btn-primary !py-1.5 !px-3 !text-xs !rounded-lg inline-flex items-center gap-1.5 group"
              >
                <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse-glow transition-transform" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn-ghost !py-1.5 !px-2.5 !text-xs !rounded-lg inline-flex items-center gap-1.5 text-wisdom-500 hover:text-red-400"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ── Daily Sutra ───────────────────────────────────────── */}
        <DailySutraWidget onAsk={(q) => setPrefillQuery(q)} />

        {/* ── Chat Window ───────────────────────────────────────── */}
        <ChatWindow
          conversationId={activeConvoId}
          onConversationCreated={(id) => setActiveConvoId(id)}
          prefillQuery={prefillQuery}
          onPrefillConsumed={() => setPrefillQuery('')}
          cagMode={cagMode}
          onToggleCag={() => setCagMode((v) => !v)}
        />
      </div>

      {/* ── Subscription modal ──────────────────────────────────── */}
      <SubscriptionModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  )
}
