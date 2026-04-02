import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)

    try {
      const user = await login(form.email, form.password)

      const redirectPath =
        location.state?.from ||
        (user.role === 'admin' ? '/admin' : '/dashboard')

      navigate(redirectPath, { replace: true })
    } catch (error) {
      setErr(error.response?.data?.msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#20473f_0%,#0d231f_30%,#081310_58%,#f4efe4_58%,#f4efe4_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-10">
        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/6 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d7a84a]">
              Member Access
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] sm:text-5xl">
              Sign in to continue your rounds, draws, and charity journey.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-[#d4e1dd] sm:text-base">
              Step back into your subscriber dashboard, keep your latest scores current,
              and stay connected to the cause you selected.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
                <p className="text-sm font-semibold text-white">Draw participation</p>
                <p className="mt-3 text-sm leading-7 text-[#c7d7d2]">
                  Follow active draw cycles, score history, and participation status from one place.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
                <p className="text-sm font-semibold text-white">Visible impact</p>
                <p className="mt-3 text-sm leading-7 text-[#c7d7d2]">
                  Keep your subscription, charity settings, and winnings connected to a single member flow.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-[#0f2d28]/12 bg-white p-6 shadow-[0_24px_80px_rgba(15,45,40,0.14)] sm:p-8 lg:p-10">
            <div className="border-b border-[#0f2d28]/8 pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9e6d16]">
                Sign In
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#0f2d28]">
                Access your account
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#49645d]">
                Use your registered email and password to enter the subscriber area.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-2xl border border-[#0f2d28]/14 bg-[#fbf8f1] px-4 py-3.5 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] focus:bg-white"
                />
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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-8 rounded-[1.5rem] bg-[#f6f1e5] px-5 py-4 text-sm text-[#49645d]">
              No account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#0f2d28] transition hover:text-[#18443c]"
              >
                Create one
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
