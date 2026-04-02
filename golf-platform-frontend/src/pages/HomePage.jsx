import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const currency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount)
}

const highlights = [
  {
    title: 'Play with purpose',
    text: 'Track golf scores, enter monthly prize draws, and connect every round to a cause worth backing.'
  },
  {
    title: 'Win through consistency',
    text: 'Keep your latest golf scores updated so your participation stays current, clear, and reward-driven.'
  },
  {
    title: 'See your impact clearly',
    text: 'Follow how subscriptions, direct donations, and prize activity translate into visible platform impact.'
  }
]

const steps = [
  {
    number: '01',
    title: 'Create your account',
    text: 'Register, choose your charity, and get your member profile ready for monthly participation.'
  },
  {
    number: '02',
    title: 'Track your golf scores',
    text: 'Maintain your latest five scores so your dashboard and draw participation stay accurate.'
  },
  {
    number: '03',
    title: 'Subscribe, support, and win',
    text: 'Join the active subscription pool, support real causes, and take part in prize draws.'
  }
]

const HomePage = () => {
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true)
        const res = await api.get('/public/stats')
        setStats(res.data || {})
      } catch {
        setStats({})
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [])

  const statCards = [
    {
      value: loadingStats ? 'Loading...' : `INR ${currency(stats?.total_pool)}`,
      label: 'Total prize pool tracked'
    },
    {
      value: loadingStats ? 'Loading...' : `INR ${currency(stats?.total_donations)}`,
      label: 'Direct donations recorded'
    },
    {
      value: loadingStats ? 'Loading...' : `INR ${currency(stats?.total_impact)}`,
      label: 'Total impact tracked'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f3ecdf] text-[#102622]">
      <section className="border-b border-[#d8ccb7] bg-[#f8f2e8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[1.75rem] border border-[#d9ccb7] bg-white px-4 py-4 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#0f2d28] sm:text-xs">
              Charity Golf Platform
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/charities"
              className="rounded-full border border-[#0f2d28]/15 bg-white px-4 py-2 text-center text-sm font-medium text-[#0f2d28] transition hover:bg-[#f6efe2]"
            >
              Charities
            </Link>
            <Link
              to="/donate"
              className="rounded-full border border-[#0f2d28]/15 bg-white px-4 py-2 text-center text-sm font-medium text-[#0f2d28] transition hover:bg-[#f6efe2]"
            >
              Donate
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-[#0f2d28]/15 bg-white px-4 py-2 text-center text-sm font-medium text-[#0f2d28] transition hover:bg-[#f6efe2]"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-[#0f2d28] px-5 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#18443c]"
            >
              Subscribe Now
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <div className="rounded-[2rem] border border-[#d8ccb7] bg-[#fff9ef] p-6 shadow-[0_20px_60px_rgba(15,45,40,0.08)] sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#9e6d16] sm:text-sm">
              Play. Win. Give back.
            </p>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] text-[#0f2d28] sm:text-5xl lg:text-[4rem]">
              A golf platform where every round can support something bigger.
            </h1>

            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#18342f] sm:text-lg sm:leading-9">
              Track your scores, take part in monthly prize draws, and help direct real
              value toward charities. The experience is built to feel premium, modern,
              and connected to real impact.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/register"
                className="rounded-full bg-[#d7a84a] px-6 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#e3b85d]"
              >
                Start Subscription
              </Link>
              <Link
                to="/charities"
                className="rounded-full border border-[#0f2d28]/15 bg-white px-6 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f6efe2]"
              >
                Explore Charities
              </Link>
              <Link
                to="/donate"
                className="rounded-full border border-[#0f2d28]/15 bg-white px-6 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f6efe2]"
              >
                Make a Donation
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {statCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-[#decfb7] bg-white p-5 shadow-[0_16px_40px_rgba(15,45,40,0.06)]"
                >
                  <p className="whitespace-nowrap text-xl font-semibold text-[#0f2d28] sm:text-2xl">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#3d5a53]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#0f2d28] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.22)] sm:p-6 lg:p-8">
            <div className="flex h-full flex-col rounded-[1.6rem] bg-[#153a33] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d7a84a]">
                    Live Platform
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Subscription that feels meaningful
                  </h2>
                </div>

                <div className="w-fit whitespace-nowrap rounded-full bg-[#d7a84a] px-3 py-1 text-xs font-semibold text-[#0f2d28]">
                  {loadingStats ? 'Loading...' : `${stats?.active_subscriptions || 0} active`}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.4rem] border border-white/10 bg-[#1a433b] p-4"
                  >
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#d2e1dc]">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.4rem] bg-[#f6efe2] p-5 text-[#0f2d28]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9e6d16]">
                  Platform Snapshot
                </p>
                <p className="mt-3 text-lg font-semibold">
                  Clean reporting across participation, donations, and impact.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9e6d16]">Users</p>
                    <p className="mt-2 whitespace-nowrap text-2xl font-semibold text-[#0f2d28]">
                      {loadingStats ? '...' : stats?.total_users || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9e6d16]">Published draws</p>
                    <p className="mt-2 whitespace-nowrap text-2xl font-semibold text-[#0f2d28]">
                      {loadingStats ? '...' : stats?.published_draws || 0}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#36524b]">
                  {loadingStats
                    ? 'Loading the latest platform activity and impact totals.'
                    : `${stats?.total_winners || 0} winners recorded, ${stats?.total_charities || 0} charities featured, and INR ${currency(stats?.total_impact)} tracked in total impact.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[1.75rem] border border-white/10 bg-[#0f2d28] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
              >
                <p className="text-sm font-semibold tracking-[0.3em] text-[#d7a84a]">
                  {step.number}
                </p>
                <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#d1dfdb]">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-start gap-6 rounded-[2rem] border border-[#d8ccb7] bg-white p-6 shadow-[0_18px_50px_rgba(15,45,40,0.08)] md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9e6d16]">
                Join the platform
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28] sm:text-3xl">
                Start with a subscription and make every round count.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#45615a]">
                Follow charities, track your performance, and take part in a golf experience
                built around contribution and reward.
              </p>
            </div>

            <Link
              to="/register"
              className="rounded-full bg-[#0f2d28] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
