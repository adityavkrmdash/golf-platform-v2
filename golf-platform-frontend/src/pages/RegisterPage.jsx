import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [charities, setCharities] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    charity_id: '',
    charity_pct: 10
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCharities, setLoadingCharities] = useState(true)

  useEffect(() => {
    const loadCharities = async () => {
      try {
        const res = await api.get('/charities')
        setCharities(res.data || [])
      } catch {
        setCharities([])
      } finally {
        setLoadingCharities(false)
      }
    }

    loadCharities()
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')

    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters')
      return
    }

    if (!form.charity_id) {
      setErr('Please choose a charity during signup')
      return
    }

    const charityPct = Number(form.charity_pct)

    if (Number.isNaN(charityPct) || charityPct < 10 || charityPct > 100) {
      setErr('Charity contribution must be between 10% and 100%')
      return
    }

    setLoading(true)

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        charity_id: form.charity_id,
        charity_pct: charityPct
      })
      navigate('/subscribe')
    } catch (error) {
      setErr(error.response?.data?.msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#f0e4ca_0%,#f4efe4_24%,#f4efe4_52%,#102822_52%,#071411_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.98fr_1.02fr] lg:px-8 lg:py-10">
        <section className="flex items-center lg:order-2">
          <div className="w-full rounded-[2rem] border border-[#0f2d28]/12 bg-white p-6 shadow-[0_24px_80px_rgba(15,45,40,0.14)] sm:p-8 lg:p-10">
            <div className="border-b border-[#0f2d28]/8 pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9e6d16]">
                Create Account
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#0f2d28]">
                Join and choose your charity from day one
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#49645d]">
                Registration sets up your member profile, your chosen charity, and your contribution percentage before you move into subscription checkout.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0f2d28]">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-2xl border border-[#0f2d28]/14 bg-[#fbf8f1] px-4 py-3.5 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] focus:bg-white"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0f2d28]">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border border-[#0f2d28]/14 bg-[#fbf8f1] px-4 py-3.5 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0f2d28]">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full rounded-2xl border border-[#0f2d28]/14 bg-[#fbf8f1] px-4 py-3.5 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0f2d28]">
                    Charity
                  </label>
                  <select
                    name="charity_id"
                    value={form.charity_id}
                    onChange={handleChange}
                    disabled={loadingCharities}
                    className="w-full appearance-auto rounded-2xl border border-[#0f2d28]/14 bg-[#fbf8f1] px-4 py-3.5 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] focus:bg-white disabled:opacity-60"
                  >
                    <option value="">Select a charity</option>
                    {charities.map((charity) => (
                      <option key={charity.id} value={charity.id}>
                        {charity.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0f2d28]">
                    Charity %
                  </label>
                  <input
                    type="number"
                    name="charity_pct"
                    min="10"
                    max="100"
                    value={form.charity_pct}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-[#0f2d28]/14 bg-[#fbf8f1] px-4 py-3.5 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] focus:bg-white"
                  />
                </div>
              </div>

              {err && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {err}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#0f2d28] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-8 rounded-[1.5rem] bg-[#f6f1e5] px-5 py-4 text-sm text-[#49645d]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#0f2d28] transition hover:text-[#18443c]"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="flex items-center lg:order-1">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/6 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d7a84a]">
              Join With Purpose
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] sm:text-5xl">
              Start with a cause, then move into play and subscription.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-[#d2dfdb] sm:text-base">
              Your first step should feel clear. Pick the charity you want to support,
              set your contribution percentage, and continue into the member experience
              with everything aligned from the beginning.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
                <p className="text-sm font-semibold text-white">Choose your cause</p>
                <p className="mt-3 text-sm leading-7 text-[#c7d7d2]">
                  Registration captures the charity choice that connects your subscription to real impact.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
                <p className="text-sm font-semibold text-white">Unlock member features</p>
                <p className="mt-3 text-sm leading-7 text-[#c7d7d2]">
                  Move straight into plan selection, score tracking, draws, and the subscriber dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default RegisterPage
