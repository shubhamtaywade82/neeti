import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import {
  ArrowLeft,
  MessageSquare,
  MessagesSquare,
  Lightbulb,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Mail,
  Lock,
  Trash2,
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

export function SettingsPage() {
  const { user, token, setAuth, logout } = useAuthStore()
  const navigate = useNavigate()

  const [email, setEmail]                     = useState(user?.email ?? '')
  const [currentPw, setCurrentPw]             = useState('')
  const [newPw, setNewPw]                     = useState('')
  const [confirmPw, setConfirmPw]             = useState('')
  const [deleteConfirmPw, setDeleteConfirmPw] = useState('')
  const [profileMsg, setProfileMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwMsg, setPwMsg]                     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [deleteMsg, setDeleteMsg]             = useState<string | null>(null)
  const [usage, setUsage]                     = useState<UsageStats | null>(null)

  useEffect(() => {
    apiClient.get<UsageStats>('/users/usage').then((r) => setUsage(r.data)).catch(() => {})
  }, [])

  const updateEmail = async () => {
    try {
      const { data } = await apiClient.patch('/users/me', { email, current_password: currentPw })
      if (user && token) setAuth(token, { ...user, ...data })
      setProfileMsg({ type: 'ok', text: 'Email updated.' })
      setCurrentPw('')
    } catch (e: any) {
      setProfileMsg({ type: 'err', text: e.response?.data?.error ?? 'Update failed.' })
    }
  }

  const updatePassword = async () => {
    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: 'Passwords do not match.' }); return }
    try {
      await apiClient.patch('/users/me', { current_password: currentPw, password: newPw, password_confirmation: confirmPw })
      setPwMsg({ type: 'ok', text: 'Password changed.' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (e: any) {
      setPwMsg({ type: 'err', text: e.response?.data?.error ?? 'Change failed.' })
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Permanently delete your account? This cannot be undone.')) return
    try {
      await apiClient.delete('/users/me', { data: { password: deleteConfirmPw } })
      logout()
      navigate('/login')
    } catch (e: any) {
      setDeleteMsg(e.response?.data?.error ?? 'Deletion failed.')
    }
  }

  const isPaid = usage && usage.plan !== 'free'
  const isUnlimited = usage?.plan_limit === 'unlimited'
  const usagePercent =
    usage && !isUnlimited && typeof usage.plan_limit === 'number'
      ? Math.min((usage.daily_query_count / usage.plan_limit) * 100, 100)
      : 100

  return (
    <div className="min-h-screen bg-wisdom-950 text-wisdom-100 font-body">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-wisdom-300 hover:text-saffron-400 transition-colors duration-200 text-sm group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back
          </button>
          <h1 className="font-display text-saffron-400 text-2xl font-semibold">
            Settings
          </h1>
        </div>

        {/* ── Usage Stats ── */}
        {usage && (
          <section className="glass rounded-2xl p-6 space-y-5 animate-fade-in-up delay-100">
            <div className="flex items-center justify-between">
              <h2 className="text-wisdom-100 font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-saffron-500" />
                Usage
              </h2>
              <span
                className={
                  isPaid
                    ? 'badge-saffron capitalize'
                    : 'badge capitalize bg-wisdom-700/50 text-wisdom-300 border border-wisdom-500/30'
                }
              >
                {usage.plan}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-wisdom-300">Queries today</span>
                <span className="text-wisdom-100 font-medium">
                  {isUnlimited
                    ? `${usage.daily_query_count} — Unlimited`
                    : `${usage.daily_query_count} / ${usage.plan_limit}`}
                </span>
              </div>
              <div className="w-full h-2 bg-wisdom-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-saffron-600 to-saffron-400 transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <Stat
                icon={<MessageSquare className="w-4 h-4 text-saffron-500" />}
                label="Conversations"
                value={usage.total_conversations}
              />
              <Stat
                icon={<MessagesSquare className="w-4 h-4 text-saffron-500" />}
                label="Messages"
                value={usage.total_messages}
              />
              <Stat
                icon={<Lightbulb className="w-4 h-4 text-saffron-500" />}
                label="Insights"
                value={usage.insights_extracted}
              />
              <Stat
                icon={<Clock className="w-4 h-4 text-saffron-500" />}
                label="Resets at"
                value={usage.daily_reset_at}
              />
            </div>
          </section>
        )}

        {/* ── Update Email ── */}
        <section className="glass rounded-2xl p-6 space-y-4 animate-fade-in-up delay-200">
          <h2 className="text-wisdom-100 font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-saffron-500" />
            Update Email
          </h2>
          {profileMsg && <Msg type={profileMsg.type} text={profileMsg.text} />}
          <Input label="New email" type="email" value={email} onChange={setEmail} />
          <Input label="Current password" type="password" value={currentPw} onChange={setCurrentPw} />
          <button onClick={updateEmail} className="btn-primary">
            Update Email
          </button>
        </section>

        {/* ── Change Password ── */}
        <section className="glass rounded-2xl p-6 space-y-4 animate-fade-in-up delay-300">
          <h2 className="text-wisdom-100 font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-saffron-500" />
            Change Password
          </h2>
          {pwMsg && <Msg type={pwMsg.type} text={pwMsg.text} />}
          <Input label="Current password" type="password" value={currentPw} onChange={setCurrentPw} />
          <Input label="New password" type="password" value={newPw} onChange={setNewPw} />
          <Input label="Confirm new password" type="password" value={confirmPw} onChange={setConfirmPw} />
          <button onClick={updatePassword} className="btn-primary">
            Change Password
          </button>
        </section>

        {/* ── Danger Zone ── */}
        <section className="glass rounded-2xl p-6 space-y-4 border-red-900/40 animate-fade-in-up delay-400">
          <h2 className="text-red-400 font-medium flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </h2>
          {deleteMsg && <Msg type="err" text={deleteMsg} />}
          <p className="text-wisdom-300 text-sm leading-relaxed">
            Permanently deletes your account, conversations, and insights. This action cannot be undone.
          </p>
          <Input label="Enter password to confirm" type="password" value={deleteConfirmPw} onChange={setDeleteConfirmPw} />
          <button
            onClick={deleteAccount}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-[0_2px_8px_rgba(220,38,38,0.25)] hover:shadow-[0_4px_16px_rgba(220,38,38,0.35)] hover:-translate-y-px active:translate-y-0"
          >
            Delete Account
          </button>
        </section>
      </div>
    </div>
  )
}

/* ── Helper Components ── */

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-wisdom-800/50 border border-wisdom-600/20">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-wisdom-300 text-xs uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-wisdom-50 text-sm font-medium">{value}</p>
    </div>
  )
}

function Input({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-wisdom-300 text-xs font-medium mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  )
}

function Msg({ type, text }: { type: 'ok' | 'err'; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${
        type === 'ok'
          ? 'text-green-400 bg-green-950/30 border border-green-800/30'
          : 'text-red-400 bg-red-950/30 border border-red-800/30'
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
