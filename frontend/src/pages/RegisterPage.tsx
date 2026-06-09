import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { apiClient } from '../api/client'

export function RegisterPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const navigate                = useNavigate()
  const setAuth                 = useAuthStore((s) => s.setAuth)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
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
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <p className="text-amber-400 font-serif text-5xl text-center mb-8">नीति</p>
        <form onSubmit={submit} className="bg-stone-900 rounded-2xl p-8 border border-stone-800 space-y-4">
          <h2 className="text-stone-200 text-xl font-semibold mb-2">Create account</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 text-sm focus:outline-none focus:border-amber-600" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 text-sm focus:outline-none focus:border-amber-600" />
          <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 text-sm focus:outline-none focus:border-amber-600" />
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl text-sm font-medium transition-colors">
            Create Account
          </button>
          <p className="text-stone-500 text-sm text-center">
            Already have one? <Link to="/login" className="text-amber-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
