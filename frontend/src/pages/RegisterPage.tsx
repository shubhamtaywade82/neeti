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
      const { data } = await apiClient.post<{ token: string; user: { id: number; email: string; plan: string; daily_query_count: number } }>('/auth/register', {
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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-wisdom-950 via-wisdom-900 to-wisdom-950">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-saffron-900/10 via-transparent to-saffron-800/5 animate-pulse-glow" />

      {/* Decorative background character */}
      <span
        className="absolute select-none pointer-events-none font-display text-[20rem] leading-none text-saffron-400/[0.04] translate-x-1/4 -translate-y-1/4 top-1/2 left-1/2"
        aria-hidden="true"
      >
        नी
      </span>

      {/* Subtle radial glow behind card */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-saffron-500/[0.06] blur-[120px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Branding */}
        <div className="text-center mb-8 animate-fade-in">
          <p className="font-display text-6xl text-saffron-400 animate-float drop-shadow-lg">
            नीति
          </p>
          <p className="mt-2 font-body text-sm text-wisdom-400 tracking-wide delay-100 animate-fade-in-up">
            Strategic wisdom for the modern mind
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={submit}
          className="glass-strong rounded-2xl p-8 space-y-5 shadow-glow animate-fade-in-up delay-200"
        >
          <h2 className="font-display text-2xl text-wisdom-100 animate-fade-in delay-100">
            Create account
          </h2>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 animate-fade-in">
              <span className="text-red-400 text-sm font-body">{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5 animate-fade-in-up delay-200">
            <label htmlFor="register-email" className="block text-xs font-body font-medium text-wisdom-400 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-wisdom-500" />
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
            <label htmlFor="register-password" className="block text-xs font-body font-medium text-wisdom-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-wisdom-500" />
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
            <label htmlFor="register-confirm" className="block text-xs font-body font-medium text-wisdom-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-wisdom-500" />
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
          <p className="text-center text-sm font-body text-wisdom-500 animate-fade-in-up delay-600">
            Already have one?{' '}
            <Link
              to="/login"
              className="text-saffron-400 hover:text-saffron-300 transition-colors hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
