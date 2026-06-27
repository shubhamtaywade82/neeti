import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'

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

  const planColors: Record<string, string> = {
    free: 'text-stone-400',
    seeker: 'text-amber-400',
    strategist: 'text-amber-300',
    raja: 'text-yellow-300',
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-stone-500 hover:text-stone-300 text-sm">← Back</button>
          <h1 className="text-amber-400 font-serif text-2xl">Settings</h1>
        </div>

        {/* Usage Stats */}
        {usage && (
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-stone-300 font-medium mb-4">Usage</h2>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Plan" value={<span className={planColors[usage.plan] ?? 'text-amber-400'}>{usage.plan}</span>} />
              <Stat label="Queries today" value={`${usage.daily_query_count} / ${usage.plan_limit}`} />
              <Stat label="Conversations" value={usage.total_conversations} />
              <Stat label="Messages" value={usage.total_messages} />
              <Stat label="Insights extracted" value={usage.insights_extracted} />
              <Stat label="Resets at" value={usage.daily_reset_at} />
            </div>
          </section>
        )}

        {/* Update Email */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-stone-300 font-medium">Update Email</h2>
          {profileMsg && <Msg type={profileMsg.type} text={profileMsg.text} />}
          <Input label="New email" type="email" value={email} onChange={setEmail} />
          <Input label="Current password" type="password" value={currentPw} onChange={setCurrentPw} />
          <button onClick={updateEmail} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-medium">
            Update Email
          </button>
        </section>

        {/* Change Password */}
        <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-stone-300 font-medium">Change Password</h2>
          {pwMsg && <Msg type={pwMsg.type} text={pwMsg.text} />}
          <Input label="Current password" type="password" value={currentPw} onChange={setCurrentPw} />
          <Input label="New password" type="password" value={newPw} onChange={setNewPw} />
          <Input label="Confirm new password" type="password" value={confirmPw} onChange={setConfirmPw} />
          <button onClick={updatePassword} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-medium">
            Change Password
          </button>
        </section>

        {/* Danger Zone */}
        <section className="bg-stone-900 border border-red-900/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-red-400 font-medium">Danger Zone</h2>
          {deleteMsg && <Msg type="err" text={deleteMsg} />}
          <p className="text-stone-500 text-sm">Permanently deletes your account, conversations, and insights.</p>
          <Input label="Enter password to confirm" type="password" value={deleteConfirmPw} onChange={setDeleteConfirmPw} />
          <button onClick={deleteAccount} className="bg-red-700 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium">
            Delete Account
          </button>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-stone-500 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-stone-200 text-sm font-medium">{value}</p>
    </div>
  )
}

function Input({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-stone-400 text-xs mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-200 text-sm focus:outline-none focus:border-amber-600"
      />
    </div>
  )
}

function Msg({ type, text }: { type: 'ok' | 'err'; text: string }) {
  return (
    <p className={`text-sm px-3 py-2 rounded-lg ${type === 'ok' ? 'text-green-400 bg-green-950/30' : 'text-red-400 bg-red-950/30'}`}>
      {text}
    </p>
  )
}
