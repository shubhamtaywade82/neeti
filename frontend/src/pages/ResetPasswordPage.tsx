import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    try {
      await apiClient.post('/auth/reset_password', { token, password })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
        <div className="glass-strong rounded-2xl p-8 border border-surface-200/40 text-center max-w-md w-full">
          <h2 className="text-lg font-bold text-surface-800">Invalid reset link</h2>
          <p className="text-sm text-surface-500 mt-2">This link is missing a reset token.</p>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 mt-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display text-primary-400">KOS</h1>
          <p className="text-surface-500 text-sm mt-1">Knowledge OS</p>
        </div>

        <div className="glass-strong rounded-2xl p-8 border border-surface-200/40">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-accent-500 mx-auto" />
              <h2 className="text-lg font-bold text-surface-800">Password reset!</h2>
              <p className="text-sm text-surface-500">Your password has been updated successfully.</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary !py-2 !px-6 !text-sm mt-2"
              >
                Sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-surface-800">Set new password</h2>
                <p className="text-sm text-surface-500 mt-1">Must be at least 8 characters.</p>
              </div>

              {error && (
                <div className="text-xs text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-500">New password</label>
                <div className="flex items-center gap-2 rounded-xl bg-surface-50 border border-surface-200/40 px-3.5 py-2.5 focus-within:border-primary-600/60 focus-within:shadow-glow transition-all duration-200">
                  <Lock className="w-4 h-4 text-surface-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-transparent border-none text-surface-800 placeholder-surface-400 text-sm focus:outline-none focus:ring-0 py-0"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-500">Confirm password</label>
                <div className="flex items-center gap-2 rounded-xl bg-surface-50 border border-surface-200/40 px-3.5 py-2.5 focus-within:border-primary-600/60 focus-within:shadow-glow transition-all duration-200">
                  <Lock className="w-4 h-4 text-surface-400" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-transparent border-none text-surface-800 placeholder-surface-400 text-sm focus:outline-none focus:ring-0 py-0"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="btn-primary w-full !py-2.5 !text-sm"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
