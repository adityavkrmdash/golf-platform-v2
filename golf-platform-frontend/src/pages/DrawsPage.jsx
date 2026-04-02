import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const prizeTiers = [
  { match: '5 number match', share: '40%', rule: 'Jackpot can roll over if unclaimed' },
  { match: '4 number match', share: '35%', rule: 'Split equally among winners' },
  { match: '3 number match', share: '25%', rule: 'Split equally among winners' }
]

const formatNumbers = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 'Pending draw numbers'
  }

  return numbers.join(', ')
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

const formatLabel = (value) => {
  if (!value) return 'Draw'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const DrawsPage = () => {
  const { user } = useAuth()
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const joinNextDrawPath = user
    ? user.role === 'admin'
      ? '/admin'
      : '/dashboard#add-score'
    : '/register'

  useEffect(() => {
    const loadDraws = async () => {
      try {
        const res = await api.get('/draws')
        setDraws(res.data || [])
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load draws')
      } finally {
        setLoading(false)
      }
    }

    loadDraws()
  }, [])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe3_0%,#f5efe3_36%,#0b1d19_36%,#081310_100%)]">
      <section className="px-4 pb-14 pt-8 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9e6d16] sm:tracking-[0.35em]">
                Monthly Draws
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#0f2d28] sm:text-4xl lg:text-5xl">
                Follow published draw cycles and winning numbers in one place.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#38534c] sm:text-base sm:leading-8">
                Review draw history, see winning numbers, and understand how the prize pool
                is shared across each monthly cycle.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link
                  to={joinNextDrawPath}
                  className="rounded-full bg-[#0f2d28] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#18443c]"
                >
                  Join the next draw
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-[#0f2d28]/15 px-6 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-white/40"
                >
                  View account
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_20px_60px_rgba(15,45,40,0.08)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9e6d16]">
                Prize breakdown
              </p>
              <div className="mt-5 space-y-4">
                {prizeTiers.map((tier) => (
                  <div
                    key={tier.match}
                    className="rounded-2xl border border-[#0f2d28]/10 bg-[#f5efe3] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-[#0f2d28]">{tier.match}</h2>
                      <span className="w-fit rounded-full bg-[#d7a84a] px-3 py-1 text-xs font-semibold text-[#0f2d28]">
                        {tier.share}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#39544d]">{tier.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
          {loading && (
            <div className="rounded-[1.75rem] border border-white/10 bg-[#102822] p-5 text-white sm:p-6">
              Loading draws...
            </div>
          )}

          {error && (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 text-red-600 sm:p-6">
              {error}
            </div>
          )}

          {!loading && !error && draws.length === 0 && (
            <div className="rounded-[1.75rem] border border-white/10 bg-[#102822] p-5 text-white sm:p-6">
              No draw records are available yet.
            </div>
          )}

          {!loading && !error && draws.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {draws.map((draw) => (
                <div
                  key={draw.id}
                  className="rounded-[1.75rem] border border-white/10 bg-[#102822] p-5 text-white sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d7a84a]">
                        {formatLabel(draw.draw_type)}
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold">
                        {formatMonth(draw.month)} {draw.year}
                      </h2>
                    </div>

                    <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#dbe8e4]">
                      {formatLabel(draw.status)}
                    </span>
                  </div>

                  <div className="mt-6 rounded-2xl bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d7a84a]">
                      Winning numbers
                    </p>
                    <p className="mt-2 break-words text-xl font-semibold">
                      {formatNumbers(draw.numbers)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#c9d7d3]">
                    <span>Jackpot carry: {draw.rolled_over ? 'Yes' : 'No'}</span>
                    <span>Type: {formatLabel(draw.draw_type || 'random')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-[1.75rem] border border-[#d7a84a]/20 bg-[#d7a84a]/10 p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d7a84a]">
              Stay involved
            </p>
            <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
              Each draw is part of a bigger charity-led journey.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#d5e3df]">
              Keep your scores current, stay active on the platform, and follow each new draw cycle as it is published.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DrawsPage
