import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { useFeatureFlagsStore, type FeatureFlags } from '../stores/featureFlagsStore'
import {
  ArrowLeft,
  User,
  Cpu,
  ToggleLeft,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Trash2,
  Shield,
  Layers,
  Clock,
  Compass,
  CreditCard,
  Gem
} from 'lucide-react'

interface UsageStats {
  plan: string
  daily_query_count: number
  plan_limit: number | string
  daily_reset_at: string
  total_conversations: number
  total_messages: number
  insights_extracted: number
}

interface LLMModel {
  id: string
  name: string
  provider: 'local' | 'cloud'
  latency: string
  status: 'active' | 'standby' | 'off'
}

export function SettingsPage() {
  const { user, token, setAuth, logout } = useAuthStore()
  const { flags, setFlag } = useFeatureFlagsStore()
  const navigate = useNavigate()

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'models' | 'beta' | 'billing'>('profile')

  // Profile forms
  const [email, setEmail]                     = useState(user?.email ?? '')
  const [currentPw, setCurrentPw]             = useState('')
  const [newPw, setNewPw]                     = useState('')
  const [confirmPw, setConfirmPw]             = useState('')
  const [deleteConfirmPw, setDeleteConfirmPw] = useState('')
  const [profileMsg, setProfileMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwMsg, setPwMsg]                     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [deleteMsg, setDeleteMsg]             = useState<string | null>(null)
  const [usage, setUsage]                     = useState<UsageStats | null>(null)

  // Subscription states
  const [plans, setPlans] = useState<any>({
    free: { name: 'Free', price_inr: 0, queries_per_day: 3, features: ['3 queries/day', 'Basic wisdom'] },
    seeker: { name: 'Seeker', price_inr: 199, queries_per_day: 'unlimited', features: ['Unlimited queries', 'Daily sutra', 'Session history'] },
    strategist: { name: 'Strategist', price_inr: 499, queries_per_day: 'unlimited', features: ['Everything in Seeker', 'Persistent memory', 'Goal tracking'] },
    raja: { name: 'Raja', price_inr: 1999, queries_per_day: 'unlimited', features: ['Everything in Strategist', 'Human expert review', 'Priority support'] }
  })
  const [billingMsg, setBillingMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // LLM routers state
  const [models, setModels] = useState<LLMModel[]>([
    { id: 'm1', name: 'ollama / qwen3.5:4b', provider: 'local', latency: '142ms', status: 'active' },
    { id: 'm2', name: 'OpenAI / gpt-4o', provider: 'cloud', latency: '310ms', status: 'standby' },
    { id: 'm3', name: 'Anthropic / claude-3', provider: 'cloud', latency: '890ms', status: 'standby' },
    { id: 'm4', name: 'Gemini / pro-1.5', provider: 'cloud', latency: '420ms', status: 'off' },
  ])
  const [selectedModelId, setSelectedModelId] = useState('m1')

  useEffect(() => {
    apiClient.get<UsageStats>('/users/usage')
      .then((r) => setUsage(r.data))
      .catch(() => {})

    apiClient.get('/subscriptions/plans')
      .then((r) => {
        if (r.data?.plans) setPlans(r.data.plans)
      })
      .catch(() => {})
  }, [])

  const handleUpdateSubscription = async (targetPlan: string) => {
    setBillingMsg(null)
    try {
      const { data } = await apiClient.post<{ mode: string; activated: boolean; plan: string; short_url?: string }>('/subscriptions', { plan: targetPlan })
      if (data.activated) {
        setBillingMsg({ type: 'ok', text: `Successfully updated to the ${data.plan} plan!` })
        apiClient.get<UsageStats>('/users/usage')
          .then((r) => setUsage(r.data))
          .catch(() => {})
        if (user && token) {
          setAuth(token, { ...user, plan: data.plan })
        }
      } else if (data.short_url) {
        setBillingMsg({ type: 'ok', text: 'Opening Razorpay checkout...' })
        window.open(data.short_url, '_blank')
      }
    } catch (e: any) {
      setBillingMsg({ type: 'err', text: e.response?.data?.error ?? 'Failed to update subscription.' })
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription and downgrade to the Free tier?')) return
    setBillingMsg(null)
    try {
      await apiClient.delete('/subscriptions')
      setBillingMsg({ type: 'ok', text: 'Your subscription has been cancelled and downgraded to Free.' })
      apiClient.get<UsageStats>('/users/usage')
        .then((r) => setUsage(r.data))
        .catch(() => {})
      if (user && token) {
        setAuth(token, { ...user, plan: 'free' })
      }
    } catch (e: any) {
      setBillingMsg({ type: 'err', text: e.response?.data?.error ?? 'Failed to cancel subscription.' })
    }
  }

  const updateEmail = async () => {
    try {
      const { data } = await apiClient.patch('/users/me', { email, current_password: currentPw })
      if (user && token) setAuth(token, { ...user, ...data })
      setProfileMsg({ type: 'ok', text: 'Email updated successfully.' })
      setCurrentPw('')
    } catch (e: any) {
      setProfileMsg({ type: 'err', text: e.response?.data?.error ?? 'Update failed.' })
    }
  }

  const updatePassword = async () => {
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'err', text: 'Passwords do not match.' })
      return
    }
    try {
      await apiClient.patch('/users/me', { current_password: currentPw, password: newPw, password_confirmation: confirmPw })
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (e: any) {
      setPwMsg({ type: 'err', text: e.response?.data?.error ?? 'Change failed.' })
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Permanently delete your account? This action cannot be undone.')) return
    try {
      await apiClient.delete('/users/me', { data: { password: deleteConfirmPw } })
      logout()
      navigate('/login')
    } catch (e: any) {
      setDeleteMsg(e.response?.data?.error ?? 'Deletion failed.')
    }
  }

  const toggleModelStatus = (id: string) => {
    setModels((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus = m.status === 'off' ? 'standby' : 'off'
          return { ...m, status: nextStatus }
        }
        return m
      })
    )
  }

  // Feature Flag configs
  const flagConfigs: { key: keyof FeatureFlags; label: string; desc: string }[] = [
    { key: 'dashboardView', label: 'Dashboard Page', desc: 'Enable the workspace dashboard page view with statistics, activity feed, and recent chats.' },
    { key: 'packsView', label: 'Knowledge Packs Manager', desc: 'Enable the knowledge packs view to search, install, and uninstall modules.' },
    { key: 'graphExplorerView', label: 'Graph Explorer', desc: 'Enable the knowledge graph visualizer and relationships inspector.' },
    { key: 'sutraBrowserView', label: 'Sutra Browser', desc: 'Enable the scrollable list browser containing raw devanagari scripts and sutra translations.' },
    { key: 'memoryInsightsView', label: 'Memory & Insights view', desc: 'Enable the personalization insights engine dashboard.' },
    { key: 'chatReasoning', label: 'Chat Reasoning Stepper', desc: 'Show the step-by-step thinking stepper path inside AI advisor responses.' },
    { key: 'chatCitationsToggle', label: 'Citation Excerpts Toggle', desc: 'Show the expandable grounded citations excerpts card panel beneath responses.' },
  ]

  const isFree = usage?.plan === 'free'
  const isUnlimited = usage?.plan_limit === 'unlimited'
  const usagePercent =
    usage && !isUnlimited && typeof usage.plan_limit === 'number'
      ? Math.min((usage.daily_query_count / usage.plan_limit) * 100, 100)
      : 100

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-wisdom-950 font-body relative z-20">
      {/* ── Left Sidebar (Vertical Navigation Tabs) ── */}
      <div className="w-64 shrink-0 border-r border-wisdom-700/40 bg-wisdom-900/40 flex flex-col h-full z-10 select-none">
        <div className="p-4 border-b border-wisdom-700/30 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 text-wisdom-400 hover:text-saffron-400 hover:bg-wisdom-800/40 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold text-wisdom-100 font-display">
            Settings Page
          </h2>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'profile', label: 'Profile & Security', icon: User },
            { id: 'models', label: 'AI Models', icon: Cpu },
            { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
            ...(user?.role === 'admin' ? [{ id: 'beta', label: 'Beta Toggles', icon: ToggleLeft }] : []),
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border relative ${
                  isActive
                    ? 'bg-saffron-500/10 border-saffron-500/20 text-saffron-400 font-bold'
                    : 'border-transparent text-wisdom-400 hover:bg-wisdom-800/40 hover:text-wisdom-200'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-saffron-500 rounded-r-md" />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Right Content Panel ── */}
      <div className="flex-1 overflow-y-auto bg-wisdom-950 p-6 sm:p-8">
        <div className="max-w-3xl space-y-6 animate-fade-in-up">
          {/* PROFILE & SECURITY TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold font-display text-wisdom-100 border-b border-wisdom-700/20 pb-3">
                Profile & Security
              </h3>

              {/* Usage stats block */}
              {usage && (
                <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-xs font-bold text-wisdom-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-saffron-500" />
                      Usage & Plan
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saffron-500/10 border border-saffron-500/20 text-saffron-400 uppercase tracking-wider">
                      {usage.plan}
                    </span>
                  </div>
                  <div className="space-y-1.5 select-none">
                    <div className="flex justify-between text-xs text-wisdom-400">
                      <span>Daily API Query Count</span>
                      <span className="font-semibold text-wisdom-200">
                        {isUnlimited ? `${usage.daily_query_count} / Unlimited` : `${usage.daily_query_count} / ${usage.plan_limit}`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-wisdom-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-saffron-600 to-saffron-400"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 select-none">
                    <div className="p-3 bg-wisdom-900 border border-wisdom-700/40 rounded-xl">
                      <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-wider">Total Convos</div>
                      <div className="text-sm font-semibold text-wisdom-200 mt-1">{usage.total_conversations}</div>
                    </div>
                    <div className="p-3 bg-wisdom-900 border border-wisdom-700/40 rounded-xl">
                      <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-wider">Total Messages</div>
                      <div className="text-sm font-semibold text-wisdom-200 mt-1">{usage.total_messages}</div>
                    </div>
                    <div className="p-3 bg-wisdom-900 border border-wisdom-700/40 rounded-xl">
                      <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-wider">Insights</div>
                      <div className="text-sm font-semibold text-wisdom-200 mt-1">{usage.insights_extracted}</div>
                    </div>
                    <div className="p-3 bg-wisdom-900 border border-wisdom-700/40 rounded-xl">
                      <div className="text-[9px] font-bold text-wisdom-500 uppercase tracking-wider">Resets at</div>
                      <div className="text-xs font-semibold text-wisdom-200 mt-1.5 truncate">{usage.daily_reset_at}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email update card */}
              <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-wisdom-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-saffron-500" />
                  Update Email Address
                </h4>
                {profileMsg && <Msg type={profileMsg.type} text={profileMsg.text} />}
                <div className="space-y-3.5">
                  <Input label="New Email Address" type="email" value={email} onChange={setEmail} />
                  <Input label="Current Password" type="password" value={currentPw} onChange={setCurrentPw} />
                  <button onClick={updateEmail} className="btn-primary !text-xs !py-2.5">
                    Update Email
                  </button>
                </div>
              </div>

              {/* Password change card */}
              <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-wisdom-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-saffron-500" />
                  Change Password
                </h4>
                {pwMsg && <Msg type={pwMsg.type} text={pwMsg.text} />}
                <div className="space-y-3.5">
                  <Input label="Current Password" type="password" value={currentPw} onChange={setCurrentPw} />
                  <Input label="New Password" type="password" value={newPw} onChange={setNewPw} />
                  <Input label="Confirm New Password" type="password" value={confirmPw} onChange={setConfirmPw} />
                  <button onClick={updatePassword} className="btn-primary !text-xs !py-2.5">
                    Change Password
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="glass-card border border-red-900/30 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  Danger Zone
                </h4>
                {deleteMsg && <Msg type="err" text={deleteMsg} />}
                <p className="text-xs text-wisdom-400 leading-relaxed">
                  Permanently delete your profile account, conversation logs, and memory models. This cannot be undone.
                </p>
                <div className="space-y-3.5">
                  <Input label="Confirm Password to Delete Account" type="password" value={deleteConfirmPw} onChange={setDeleteConfirmPw} />
                  <button
                    onClick={deleteAccount}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-lg hover:-translate-y-px active:translate-y-0"
                  >
                    Delete Account Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI MODELS ROUTER TAB */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold font-display text-wisdom-100 border-b border-wisdom-700/20 pb-3">
                AI Model Configuration
              </h3>

              <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-wisdom-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-saffron-500" />
                  Primary Reasoning Model
                </h4>

                <div className="space-y-2.5">
                  {models.map((m) => {
                    const isSelected = selectedModelId === m.id
                    return (
                      <label
                        key={m.id}
                        onClick={() => setSelectedModelId(m.id)}
                        className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-saffron-500/5 border-saffron-500/30'
                            : 'bg-wisdom-900 border-wisdom-700/40 hover:border-wisdom-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="model-select"
                            checked={isSelected}
                            onChange={() => setSelectedModelId(m.id)}
                            className="w-4 h-4 accent-saffron-500 bg-transparent border-wisdom-700"
                          />
                          <div>
                            <h5 className="text-xs font-bold text-wisdom-100">{m.name}</h5>
                            <span
                              className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1.5 ${
                                m.provider === 'local'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/15'
                              }`}
                            >
                              {m.provider}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-wisdom-500 font-bold">{m.latency}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleModelStatus(m.id)
                            }}
                            className={`w-8 h-4.5 rounded-full relative transition-colors duration-200 ${
                              m.status !== 'off' ? 'bg-emerald-500' : 'bg-wisdom-800'
                            }`}
                          >
                            <span
                              className={`w-3 h-3 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${
                                m.status !== 'off' ? 'left-4.5' : 'left-0.75'
                              }`}
                            />
                          </button>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Automatic Fallback routing */}
              <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4 select-none">
                <h4 className="text-xs font-bold text-wisdom-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-saffron-500" />
                  Fallback Routing Chain
                </h4>
                <p className="text-xs text-wisdom-400 leading-relaxed">
                  Enable automatic model handoffs in case the primary Ollama endpoint is down or times out.
                </p>
                <div className="p-3 bg-wisdom-900 border border-wisdom-700/40 rounded-xl text-[11px] text-wisdom-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-saffron-400 shrink-0" />
                  <span>Chain sequence: Ollama (Local) → OpenAI (Standby) → Anthropic (Standby). Latencies tracked per query.</span>
                </div>
              </div>
            </div>
          )}

          {/* BETA TOGGLES TAB */}
          {activeTab === 'beta' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold font-display text-wisdom-100 border-b border-wisdom-700/20 pb-3">
                Beta Feature Flags
              </h3>

              <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-wisdom-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ToggleLeft className="w-4 h-4 text-saffron-500" />
                  Admin Feature Flags
                </h4>
                <p className="text-xs text-wisdom-400 leading-relaxed">
                  Enable or disable incomplete/beta workspace views. Disabling hides their navigational items in the Sidebar.
                </p>

                <div className="space-y-3.5 pt-2">
                  {flagConfigs.map((cfg) => {
                    const isChecked = flags[cfg.key]
                    return (
                      <div
                        key={cfg.key}
                        className="flex items-center justify-between gap-6 p-3 bg-wisdom-900 border border-wisdom-700/40 rounded-xl"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-wisdom-200">{cfg.label}</span>
                          <p className="text-[10px] text-wisdom-500 mt-0.5 leading-relaxed">{cfg.desc}</p>
                        </div>
                        <button
                          onClick={() => setFlag(cfg.key, !isChecked)}
                          className={`w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 ${
                            isChecked ? 'bg-saffron-500' : 'bg-wisdom-800'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${
                              isChecked ? 'left-4.5' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* BILLING & SUBSCRIPTIONS TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold font-display text-wisdom-100 border-b border-wisdom-700/20 pb-3">
                Billing & Subscription Plans
              </h3>

              {billingMsg && <Msg type={billingMsg.type} text={billingMsg.text} />}

              {/* Current Plan Overview */}
              {usage && (
                <div className="glass-card border border-wisdom-700/40 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-xs font-bold text-wisdom-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-saffron-500" />
                      Active Plan
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-saffron-500/10 border border-saffron-500/20 text-saffron-400 uppercase tracking-widest">
                      {usage.plan}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="text-wisdom-300 font-semibold">Daily queries quota:</p>
                      <span className="text-wisdom-500">
                        {isUnlimited ? 'Unlimited reasoning capacity' : 'Resets daily at midnight'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-wisdom-200 uppercase">
                      {isUnlimited ? 'Unlimited' : `${usage.daily_query_count} / ${usage.plan_limit}`}
                    </span>
                  </div>

                  {usage.plan !== 'free' && (
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      Cancel Plan Subscription
                    </button>
                  )}
                </div>
              )}

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
                {Object.keys(plans).filter(k => k !== 'free').map((key) => {
                  const plan = plans[key]
                  const isCurrent = usage?.plan === key
                  return (
                    <div
                      key={key}
                      className={`glass-card border p-5 rounded-2xl flex flex-col justify-between h-80 hover:border-wisdom-700/80 transition-all duration-200 ${
                        isCurrent ? 'border-saffron-500/40 bg-saffron-500/[0.02]' : 'border-wisdom-700/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-wisdom-100 capitalize">{key} Plan</h4>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mt-3.5">
                          <span className="text-2xl font-bold font-display text-wisdom-100">
                            ₹{plan.price_inr}
                          </span>
                          <span className="text-[10px] text-wisdom-500 font-semibold block mt-0.5">
                            per month
                          </span>
                        </div>

                        {/* Features */}
                        <ul className="mt-5 space-y-2 text-[11px] text-wisdom-400 font-medium">
                          {plan.features?.map((feat: string, idx: number) => (
                            <li key={idx} className="flex gap-1.5 items-start">
                              <span className="text-saffron-400">✓</span>
                              <span className="line-clamp-1">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleUpdateSubscription(key)}
                        disabled={isCurrent}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 mt-6 ${
                          isCurrent
                            ? 'bg-wisdom-800 text-wisdom-500 border border-wisdom-700/30 cursor-not-allowed'
                            : 'bg-saffron-500 hover:bg-saffron-400 text-wisdom-950 shadow-glow'
                        }`}
                      >
                        {isCurrent ? 'Active Plan' : 'Select Plan'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function Input({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-wisdom-400 text-xs font-semibold select-none">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field !text-xs !py-2.5"
      />
    </div>
  )
}

function Msg({ type, text }: { type: 'ok' | 'err'; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border ${
        type === 'ok'
          ? 'text-green-400 bg-green-950/20 border-green-800/30'
          : 'text-red-400 bg-red-950/20 border-red-800/30'
      }`}
    >
      {type === 'ok' ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  )
}
