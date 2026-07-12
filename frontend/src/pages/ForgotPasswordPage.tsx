import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await apiClient.post('/auth/forgot_password', { email })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display text-primary-400">KOS</h1>
          <p className="text-surface-500 text-sm mt-1">Knowledge OS</p>
        </div>

        <div className="glass-strong rounded-2xl p-8 border border-surface-200/40">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-accent-500 mx-auto" />
              <h2 className="text-lg font-bold text-surface-800">Check your email</h2>
              <p className="text-sm text-surface-500">
                If an account exists for <strong className="text-surface-700">{email}</strong>,
                we've sent a password reset link.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 mt-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-surface-800">Forgot password?</h2>
                <p className="text-sm text-surface-500 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="text-xs text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-500">Email</label>
                <div className="flex items-center gap-2 rounded-xl bg-surface-50 border border-surface-200/40 px-3.5 py-2.5 focus-within:border-primary-600/60 focus-within:shadow-glow transition-all duration-200">
                  <Mail className="w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent border-none text-surface-800 placeholder-surface-400 text-sm focus:outline-none focus:ring-0 py-0"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full !py-2.5 !text-sm"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <p className="text-center text-xs text-surface-500">
                Remember your password?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
