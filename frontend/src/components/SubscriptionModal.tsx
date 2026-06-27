import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { X, Check, Loader2, Sparkles, Crown, Gem } from 'lucide-react'

const PLANS = [
  {
    key:      'seeker',
    name:     'Seeker',
    price:    '₹199',
    period:   '/mo',
    icon:     Sparkles,
    features: ['Unlimited queries', 'Daily sutra', 'Session history']
  },
  {
    key:      'strategist',
    name:     'Strategist',
    price:    '₹499',
    period:   '/mo',
    icon:     Crown,
    popular:  true,
    features: ['Everything in Seeker', 'Persistent memory', 'Goal tracking']
  },
  {
    key:      'raja',
    name:     'Raja',
    price:    '₹1,999',
    period:   '/mo',
    icon:     Gem,
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

  const subscribe = async (plan: string) => {
    setLoading(plan)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiClient.post<{
        mode:             'dev' | 'razorpay'
        activated:        boolean
        plan:             string
        short_url:        string | null
        subscription_id?: string
      }>('/subscriptions', { plan })

      if (res.data.short_url) {
        window.location.href = res.data.short_url
      } else if (res.data.activated && user && token) {
        setAuth(token, { ...user, plan: res.data.plan })
        setSuccess(`Upgraded to ${res.data.plan}!`)
        setLoading(null)
      }
    } catch {
      setLoading(null)
      setError('Could not start subscription. Please try again.')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in z-50" />

        {/* Content */}
        <Dialog.Content className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl max-w-3xl w-full p-8 animate-scale-in shadow-glow-strong relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <Dialog.Title className="font-display text-saffron-400 text-2xl font-semibold">
                Unlock the Full Wisdom of Chanakya
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="text-wisdom-400 hover:text-wisdom-100 transition-colors duration-200 p-1 rounded-lg hover:bg-wisdom-700/50"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-2 text-green-400 text-sm mb-6 px-4 py-3 rounded-xl bg-green-950/30 border border-green-800/30 animate-fade-in">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{success}</span>
                <button onClick={onClose} className="ml-auto underline text-green-300 hover:text-green-200 transition-colors">
                  Close
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="text-red-400 text-sm mb-6 px-4 py-3 rounded-xl bg-red-950/30 border border-red-800/30 animate-fade-in">
                {error}
              </div>
            )}

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan, i) => {
                const Icon = plan.icon
                const isPopular = plan.popular
                const delayClass = i === 0 ? 'delay-100' : i === 1 ? 'delay-200' : 'delay-300'

                return (
                  <div
                    key={plan.key}
                    className={`
                      relative rounded-2xl p-5 border transition-all duration-300
                      bg-wisdom-800/40 hover:bg-wisdom-800/60
                      animate-fade-in-up ${delayClass}
                      ${
                        isPopular
                          ? 'border-saffron-600/50 animate-border-glow shadow-glow'
                          : 'border-wisdom-500/30 hover:border-saffron-600/40'
                      }
                    `}
                  >
                    {/* Popular badge */}
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="badge-saffron text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Plan icon & name */}
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-saffron-500" />
                      <h3 className="text-wisdom-50 font-semibold text-lg">{plan.name}</h3>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="font-display text-3xl font-bold text-gradient-saffron">
                        {plan.price}
                      </span>
                      <span className="text-wisdom-400 text-sm">{plan.period}</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-wisdom-200 text-xs">
                          <Check className="w-3.5 h-3.5 text-saffron-500 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Subscribe button */}
                    <button
                      onClick={() => subscribe(plan.key)}
                      disabled={loading === plan.key}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {loading === plan.key ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Redirecting…
                        </>
                      ) : (
                        `Choose ${plan.name}`
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
