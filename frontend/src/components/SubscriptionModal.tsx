import { useState } from 'react'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'

const PLANS = [
  {
    key:      'seeker',
    name:     'Seeker',
    price:    '₹199/mo',
    features: ['Unlimited queries', 'Daily sutra', 'Session history']
  },
  {
    key:      'strategist',
    name:     'Strategist',
    price:    '₹499/mo',
    features: ['Everything in Seeker', 'Persistent memory', 'Goal tracking']
  },
  {
    key:      'raja',
    name:     'Raja',
    price:    '₹1,999/mo',
    features: ['Everything in Strategist', 'Human expert review', 'Priority support']
  }
]

interface Props {
  open:    boolean
  onClose: () => void
}

export function SubscriptionModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const setAuth               = useAuthStore((s) => s.setAuth)
  const token                 = useAuthStore((s) => s.token)
  const user                  = useAuthStore((s) => s.user)

  if (!open) return null

  const subscribe = async (plan: string) => {
    setLoading(plan)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiClient.post<{ short_url?: string; activated?: boolean; plan?: string }>('/subscriptions', { plan })
      if (res.data.short_url) {
        window.location.href = res.data.short_url
      } else if (res.data.activated && user && token) {
        // dev bypass — plan upgraded directly
        setAuth(token, { ...user, plan: res.data.plan ?? plan })
        setSuccess(`Upgraded to ${plan}!`)
        setLoading(null)
      }
    } catch {
      setLoading(null)
      setError('Could not start subscription. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-950 border border-stone-800 rounded-2xl max-w-3xl w-full p-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-amber-400 font-serif text-2xl font-semibold">
            Unlock the Full Wisdom of Chanakya
          </h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-xl">
            ✕
          </button>
        </div>

        {success && (
          <p className="text-green-400 text-sm mb-4 font-medium">{success} <button onClick={onClose} className="underline ml-1">Close</button></p>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.key} className="border border-stone-700 rounded-xl p-5 hover:border-amber-600 transition-colors">
              <h3 className="text-white font-semibold text-lg">{plan.name}</h3>
              <p className="text-amber-400 text-2xl font-bold my-2">{plan.price}</p>
              <ul className="text-stone-400 text-xs space-y-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(plan.key)}
                disabled={loading === plan.key}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
              >
                {loading === plan.key ? 'Redirecting...' : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
