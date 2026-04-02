import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth()
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    name: '',
    charity_id: '',
    charity_pct: 10
  })

  useEffect(() => {
    setForm({
      name: user?.name || '',
      charity_id: user?.charity_id || '',
      charity_pct: user?.charity_pct ?? 10
    })
  }, [user])

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true)
        const res = await api.get('/charities')
        setCharities(res.data || [])
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load charities')
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [])

  useEffect(() => {
    if (!error && !success) return

    const timer = setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [error, success])

  const selectedCharity = useMemo(
    () => charities.find((item) => item.id === form.charity_id) || null,
    [charities, form.charity_id]
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'charity_pct' ? value : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanName = String(form.name || '').trim()
    const cleanPct = Number(form.charity_pct)

    if (!cleanName) {
      setError('Name is required')
      return
    }

    if (!form.charity_id) {
      setError('Please select a charity')
      return
    }

    if (Number.isNaN(cleanPct) || cleanPct < 10 || cleanPct > 100) {
      setError('Charity contribution must be between 10% and 100%')
      return
    }

    try {
      setSaving(true)
      await api.patch('/auth/me', {
        name: cleanName,
        charity_id: form.charity_id,
        charity_pct: cleanPct
      })
      await refreshUser()
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

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
                Profile Settings
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Choose the cause behind your subscription.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#d5e3df] sm:text-base sm:leading-8">
                Keep your account details current, select the charity you want to support, and control how much of your subscription contribution is directed there.
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
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
              Your settings
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28]">
              Update your profile and charity preferences
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#ece5d7] px-4 py-3 text-sm text-[#4b655e]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                  Charity
                </label>
                <select
                  name="charity_id"
                  value={form.charity_id}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full appearance-auto rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] disabled:opacity-60"
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
                <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                  Charity contribution %
                </label>
                <input
                  type="number"
                  name="charity_pct"
                  min="10"
                  max="100"
                  value={form.charity_pct}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                />
                <p className="mt-2 text-xs text-[#4b655e]">
                  Minimum contribution is 10% of your subscription.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0f2d28] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0f2d28] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d7a84a]">
                Selected charity
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                {selectedCharity?.name || 'No charity selected yet'}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#d0ded9]">
                {selectedCharity?.description ||
                  'Choose a charity to connect your subscription with a specific cause.'}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                Contribution summary
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28]">
                {Number(form.charity_pct || 0)}% directed to charity
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#49645d]">
                This percentage is used to represent how much of your subscription contribution supports your selected cause across the platform experience.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/charities"
                  className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                >
                  Explore charities
                </Link>
                <Link
                  to="/subscribe"
                  className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                >
                  Manage subscription
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
