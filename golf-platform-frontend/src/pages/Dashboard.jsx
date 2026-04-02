import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const formatDate = (value) => {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const currency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount)
}

const formatSubscriptionPlan = (subscription) => {
  if (!subscription?.plan) return 'No plan'
  return subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
}

const formatSubscriptionStatus = (subscription) => {
  if (!subscription?.status) return 'No subscription'
  return subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
}

const formatMonth = (value) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  return months[Number(value) - 1] || value || 'Unknown month'
}

const sortScores = (items) => {
  if (!Array.isArray(items)) return []

  return [...items]
    .sort((first, second) => {
      const firstPlayed = new Date(first.played_on || 0).getTime()
      const secondPlayed = new Date(second.played_on || 0).getTime()

      if (secondPlayed !== firstPlayed) {
        return secondPlayed - firstPlayed
      }

      const firstCreated = new Date(first.created_at || 0).getTime()
      const secondCreated = new Date(second.created_at || 0).getTime()

      return secondCreated - firstCreated
    })
    .slice(0, 5)
}

const Dashboard = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const [scores, setScores] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [publicStats, setPublicStats] = useState(null)
  const [selectedCharity, setSelectedCharity] = useState(null)
  const [winnings, setWinnings] = useState([])
  const [draws, setDraws] = useState([])
  const [loadingScores, setLoadingScores] = useState(true)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    val: '',
    played_on: ''
  })

  const loadScores = async () => {
    try {
      setLoadingScores(true)
      const res = await api.get('/scores')
      setScores(sortScores(res.data || []))
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load scores')
    } finally {
      setLoadingScores(false)
    }
  }

  const loadSubscription = async () => {
    try {
      setLoadingSubscription(true)
      const res = await api.get('/subscriptions/my')
      setSubscription(res.data || null)
    } catch {
      setSubscription(null)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const loadPublicStats = async () => {
    try {
      setLoadingStats(true)
      const res = await api.get('/public/stats')
      setPublicStats(res.data || null)
    } catch {
      setPublicStats(null)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadSelectedCharity = async () => {
    try {
      if (!user?.charity_id) {
        setSelectedCharity(null)
        return
      }

      const res = await api.get(`/charities/${user.charity_id}`)
      setSelectedCharity(res.data || null)
    } catch {
      setSelectedCharity(null)
    }
  }

  const loadWinnings = async () => {
    try {
      const res = await api.get('/winners/my')
      setWinnings(res.data || [])
    } catch {
      setWinnings([])
    }
  }

  const loadDraws = async () => {
    try {
      const res = await api.get('/draws')
      setDraws(res.data || [])
    } catch {
      setDraws([])
    }
  }

  useEffect(() => {
    loadScores()
    loadSubscription()
    loadPublicStats()
    loadSelectedCharity()
    loadWinnings()
    loadDraws()
  }, [])

  useEffect(() => {
    loadSelectedCharity()
  }, [user?.charity_id])

  useEffect(() => {
    if (!error && !success) return

    const timer = setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [error, success])

  useEffect(() => {
    if (location.hash !== '#add-score') return

    const target = document.getElementById('add-score')

    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [location.hash, loadingScores, loadingSubscription, loadingStats])

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.val || !form.played_on) {
      setError('Score and played date are required')
      return
    }

    setSubmitting(true)

    try {
      const res = await api.post('/scores', {
        val: Number(form.val),
        played_on: form.played_on
      })

      const mergedScores = sortScores([
        ...scores,
        ...(res.data?.added ? [res.data.added] : [])
      ])

      if (Array.isArray(res.data?.scores) && res.data.scores.length >= mergedScores.length) {
        setScores(sortScores(res.data.scores))
      } else {
        setScores(mergedScores)
      }

      setForm({
        val: '',
        played_on: ''
      })
      setSuccess(
        scores.length >= 5
          ? 'Score added successfully. Your oldest saved score was replaced.'
          : 'Score added successfully'
      )
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add score')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    setError('')
    setSuccess('')

    try {
      await api.delete(`/scores/${id}`)
      setScores((prev) => sortScores(prev.filter((score) => score.id !== id)))
      setSuccess('Score deleted successfully')
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete score')
    }
  }

  const stats = [
    {
      label: 'Subscription status',
      value: loadingSubscription ? 'Loading...' : formatSubscriptionStatus(subscription)
    },
    {
      label: 'Subscription plan',
      value: loadingSubscription ? 'Loading...' : formatSubscriptionPlan(subscription)
    },
    {
      label: 'Charity share',
      value: `${user?.charity_pct || 0}%`
    },
    {
      label: 'Selected charity',
      value: selectedCharity?.name || 'Choose one'
    },
    {
      label: 'Recent scores',
      value: scores.length
    }
  ]

  const platformStats = [
    {
      label: 'Active subscriptions',
      value: loadingStats ? 'Loading...' : publicStats?.active_subscriptions || 0
    },
    {
      label: 'Published draws',
      value: loadingStats ? 'Loading...' : publicStats?.published_draws || 0
    },
    {
      label: 'Charity contribution',
      value: loadingStats ? 'Loading...' : `INR ${currency(publicStats?.total_charity || 0)}`
    },
    {
      label: 'Direct donations',
      value: loadingStats ? 'Loading...' : `INR ${currency(publicStats?.total_donations || 0)}`
    },
    {
      label: 'Total impact',
      value: loadingStats ? 'Loading...' : `INR ${currency(publicStats?.total_impact || 0)}`
    }
  ]

  const totalWon = winnings.reduce((sum, item) => sum + Number(item.prize || 0), 0)
  const approvedWinnings = winnings.filter((item) => item.verified === 'approved').length
  const upcomingDraw = draws.find((item) => item.status !== 'published')
  const publishedEntries = draws.filter((item) => item.status === 'published').length

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#071411_0%,#0c201c_32%,#f4efe4_32%,#f4efe4_100%)]">
      <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d7a84a]">
                Subscriber Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Welcome back, {user?.name || 'player'}.
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/draws"
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View draws
              </Link>
              <Link
                to="/charities"
                className="rounded-full bg-[#d7a84a] px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#e5ba63]"
              >
                Explore charities
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

          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#d5e3df] sm:text-base sm:leading-8">
            Keep up to five recent scores updated, track your live subscription, and stay ready for the next draw.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                      {item.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-[#0f2d28] sm:text-3xl">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {platformStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-[#0f2d28]/10 bg-[#f8f4ea] p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                      {item.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-[#0f2d28] sm:text-3xl">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                id="add-score"
                className="rounded-[1.75rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                    Add score
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-[#0f2d28] sm:text-2xl">
                    Submit your latest round
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[#49645d]">
                    Your latest 5 scores are always kept. Current saved scores: {scores.length}/5. Adding a new score after that will replace the oldest one automatically.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                      Score
                    </label>
                    <input
                      type="number"
                      name="val"
                      min="1"
                      max="45"
                      value={form.val}
                      onChange={handleChange}
                      placeholder="Enter score"
                      className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                      Played on
                    </label>
                    <input
                      type="date"
                      name="played_on"
                      value={form.played_on}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-[#0f2d28] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:cursor-not-allowed disabled:opacity-60 md:self-end"
                  >
                    {submitting ? 'Saving...' : 'Add score'}
                  </button>
                </form>

                {error && (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </p>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                    Score history
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-[#0f2d28] sm:text-2xl">
                    Your saved scores
                  </h2>
                </div>

                <div className="mt-6 space-y-3">
                  {loadingScores && <p className="text-sm text-[#4a655e]">Loading scores...</p>}

                  {!loadingScores && scores.length === 0 && (
                    <div className="rounded-2xl border border-[#0f2d28]/10 bg-[#f4efe4] px-4 py-4">
                      <p className="text-sm text-[#4a655e]">
                        No scores added yet. Add your first score above.
                      </p>
                    </div>
                  )}

                  {!loadingScores &&
                    scores.map((score) => (
                      <div
                        key={score.id}
                        className="flex flex-col gap-3 rounded-2xl border border-[#0f2d28]/10 bg-[#f4efe4] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-lg font-semibold text-[#0f2d28]">
                            Score {score.val}
                          </p>
                          <p className="mt-1 text-sm text-[#4a655e]">
                            {formatDate(score.played_on)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="w-fit rounded-full bg-[#d7a84a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f2d28]">
                            Counted
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(score.id)}
                            className="rounded-full border border-[#0f2d28]/10 px-4 py-2 text-xs font-semibold text-[#0f2d28] transition hover:bg-white"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-white/10 bg-[#0f2d28] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d7a84a]">
                  Participation summary
                </p>
                <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
                  Keep your next step obvious.
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#d0ded9]">
                  Add scores regularly, track your live subscription, and keep your contribution choices aligned with the causes you want to support.
                </p>

                <div className="mt-6 rounded-2xl bg-white/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7a84a]">
                    Current subscription
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {loadingSubscription
                      ? 'Loading subscription...'
                      : subscription
                        ? `${formatSubscriptionPlan(subscription)} plan`
                        : 'No active subscription record'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#d0ded9]">
                    {loadingSubscription
                      ? 'Checking your latest subscription details.'
                      : subscription
                        ? `Status: ${formatSubscriptionStatus(subscription)}${
                            subscription.renews_at
                              ? ` | Renews on ${formatDate(subscription.renews_at)}`
                              : ''
                          }`
                        : 'Your account does not currently have a subscription record in the system.'}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7a84a]">
                    Your charity
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {selectedCharity?.name || 'No charity selected yet'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#d0ded9]">
                    {selectedCharity?.description ||
                      'Pick a charity in your profile so your contribution settings stay connected to a specific cause.'}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7a84a]">
                    Participation summary
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {upcomingDraw
                      ? `${formatMonth(upcomingDraw.month)} ${upcomingDraw.year} is the next scheduled draw`
                      : 'No upcoming draw scheduled yet'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#d0ded9]">
                    {publishedEntries} published draw cycles are already recorded on the platform.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7a84a]">
                    Winnings summary
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    INR {currency(totalWon)} total winnings
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#d0ded9]">
                    {approvedWinnings} approved winning records are currently in your history.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)]">
                <h3 className="text-lg font-semibold text-[#0f2d28] sm:text-xl">
                  Quick links
                </h3>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    to="/profile"
                    className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                  >
                    Edit profile
                  </Link>
                  <Link
                    to="/subscribe"
                    className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                  >
                    Manage subscription
                  </Link>
                  <Link
                    to="/winnings"
                    className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                  >
                    View winnings
                  </Link>
                  <Link
                    to="/draws"
                    className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                  >
                    Go to draws
                  </Link>
                  <Link
                    to="/charities"
                    className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                  >
                    Go to charities
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
