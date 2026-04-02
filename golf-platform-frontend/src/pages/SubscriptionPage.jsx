import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Stay flexible with a month-by-month subscription.',
    accent: 'bg-[#d7a84a] text-[#0f2d28]'
  },
  {
    id: 'yearly',
    name: 'Yearly',
    description: 'Commit for the year and stay active across every monthly draw cycle.',
    accent: 'bg-[#0f2d28] text-white'
  }
]

const formatDate = (value) => {
  if (!value) return 'No renewal date'

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const existingScript = document.querySelector('script[data-razorpay="true"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true })
      existingScript.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpay = 'true'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

const SubscriptionPage = () => {
  const { user, logout } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const res = await api.get('/subscriptions/my')
      setSubscription(res.data || null)
    } catch (err) {
      setSubscription(null)
      setError(err.response?.data?.msg || 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscription()
  }, [])

  useEffect(() => {
    if (!error && !success) return

    const timer = setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [error, success])

  const refreshSubscription = async (message) => {
    await loadSubscription()
    if (message) {
      setSuccess(message)
    }
  }

  const startCheckout = async (plan) => {
    setError('')
    setSuccess('')
    setProcessingPlan(plan)

    try {
      const scriptReady = await loadRazorpayScript()

      if (!scriptReady || !window.Razorpay) {
        setError('Razorpay checkout could not be loaded')
        return
      }

      const res = await api.post('/subscriptions/checkout', { plan })
      const checkout = res.data

      const razorpay = new window.Razorpay({
        key: checkout.key_id,
        subscription_id: checkout.subscription_id,
        name: 'Golf Charity Platform',
        description: `${plan === 'yearly' ? 'Yearly' : 'Monthly'} subscription`,
        theme: { color: '#0f2d28' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/subscriptions/verify', {
              ...response,
              plan
            })

            if (verifyRes.data?.subscription) {
              setSubscription(verifyRes.data.subscription)
              setLoading(false)
            } else {
              await loadSubscription()
            }

            setSuccess('Subscription activated successfully')
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.msg || 'Payment verification failed')
          } finally {
            setProcessingPlan('')
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan('')
          }
        },
        notes: {
          user_name: user?.name || '',
          user_email: user?.email || ''
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        }
      })

      razorpay.open()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to start checkout')
      setProcessingPlan('')
    }
  }

  const cancelSubscription = async () => {
    try {
      setError('')
      setSuccess('')
      setCancelling(true)
      await api.post('/subscriptions/cancel')
      await refreshSubscription('Subscription cancelled successfully')
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const isActive = subscription?.status === 'active'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#071411_0%,#102822_32%,#f4efe4_32%,#f4efe4_100%)]">
      {(error || success) && (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,28rem)]">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
              {success}
            </div>
          )}
        </div>
      )}

      <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d7a84a]">
                Subscription
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Choose the plan that keeps you in play.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#d5e3df] sm:text-base sm:leading-8">
                Subscribe to unlock monthly draw participation, keep your latest scores active, and connect each cycle to charitable impact.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/dashboard"
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0f2d28] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d7a84a]">
              Current status
            </p>

            {loading ? (
              <p className="mt-4 text-sm text-[#d0ded9]">Loading subscription...</p>
            ) : subscription ? (
              <>
                <h2 className="mt-4 text-2xl font-semibold">
                  {subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)} plan
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#d0ded9]">
                  Status: {subscription.status}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#d0ded9]">
                  Renewal date: {formatDate(subscription.renews_at)}
                </p>

                {isActive && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/dashboard"
                      className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Go to dashboard
                    </Link>
                    <Link
                      to="/winnings"
                      className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      View winnings
                    </Link>
                    <button
                      type="button"
                      onClick={cancelSubscription}
                      disabled={cancelling}
                      className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-semibold">
                  No active subscription yet
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#d0ded9]">
                  Pick a plan to activate draw participation, subscription status tracking, and the full member experience.
                </p>
              </>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-[1.75rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6"
              >
                <div className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${plan.accent}`}>
                  {plan.name}
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-[#0f2d28]">
                  {plan.name} subscription
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#49645d]">
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-[#49645d]">
                  <li>Latest five scores stay active for draw matching.</li>
                  <li>Subscription status stays visible on your dashboard.</li>
                  <li>Part of your contribution continues to support charity.</li>
                </ul>

                <button
                  type="button"
                  onClick={() => startCheckout(plan.id)}
                  disabled={processingPlan === plan.id || isActive}
                  className="mt-8 w-full rounded-full bg-[#0f2d28] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processingPlan === plan.id
                    ? 'Opening checkout...'
                    : isActive
                      ? 'Already active'
                      : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default SubscriptionPage
