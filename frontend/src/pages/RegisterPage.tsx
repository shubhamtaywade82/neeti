import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { apiClient } from '../api/client'
import { Mail, Lock, UserPlus, Loader2, ShieldCheck } from 'lucide-react'

export function RegisterPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate                = useNavigate()
  const setAuth                 = useAuthStore((s) => s.setAuth)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      const { data } = await apiClient.post<{ token: string; user: any }>('/auth/register', {
        email, password, password_confirmation: confirm
      })
      setAuth(data.token, data.user)
      navigate('/')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.errors?.[0] ?? 'Registration failed')
      } else {
        setError('Registration failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-surface-0 via-surface-50 to-surface-0">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/10 via-transparent to-primary-800/5 animate-pulse-glow" />

      {/* Subtle radial glow behind card */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-primary-500/[0.06] blur-[120px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <p className="mt-4 font-display text-xl font-bold text-surface-800">
            Knowledge OS
          </p>
          <p className="mt-1 font-body text-sm text-surface-500">
            Your AI workspace for documents, research, and conversations
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={submit}
          className="glass-strong rounded-2xl p-8 space-y-5 shadow-glow animate-fade-in-up delay-200"
        >
          <h2 className="font-display text-2xl text-surface-800 animate-fade-in delay-100">
            Create account
          </h2>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-danger-500/10 border border-danger-500/20 px-4 py-3 animate-fade-in">
              <span className="text-danger-400 text-sm font-body">{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5 animate-fade-in-up delay-200">
            <label htmlFor="register-email" className="block text-xs font-body font-medium text-surface-400 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5 animate-fade-in-up delay-300">
            <label htmlFor="register-password" className="block text-xs font-body font-medium text-surface-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5 animate-fade-in-up delay-400">
            <label htmlFor="register-confirm" className="block text-xs font-body font-medium text-surface-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                id="register-confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 animate-fade-in-up delay-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account…</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>

          {/* Login link */}
          <p className="text-center text-sm font-body text-surface-500 animate-fade-in-up delay-600">
            Already have one?{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 transition-colors hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
