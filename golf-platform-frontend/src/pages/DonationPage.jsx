import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const DonationPage = () => {
  const [charities, setCharities] = useState([])
  const [loadingCharities, setLoadingCharities] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    charity_id: '',
    amount: '',
    message: ''
  })

  useEffect(() => {
    const loadCharities = async () => {
      try {
        const res = await api.get('/charities')
        setCharities(res.data || [])
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load charities')
      } finally {
        setLoadingCharities(false)
      }
    }

    loadCharities()
  }, [])

  useEffect(() => {
    if (!error && !success) return
    const timer = setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [error, success])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      setSaving(true)
      await api.post('/donations', {
        ...form,
        amount: Number(form.amount)
      })
      setSuccess('Donation recorded successfully')
      setForm({
        name: '',
        email: '',
        charity_id: '',
        amount: '',
        message: ''
      })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to record donation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4efe4_0%,#f4efe4_44%,#0f2d28_44%,#081a17_100%)]">
      {(error || success) && (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,28rem)]">
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}
        </div>
      )}

      <section className="px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9e6d16]">Independent Giving</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#0f2d28] sm:text-4xl lg:text-5xl">
                Support a charity without joining a draw.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#49645d] sm:text-base sm:leading-8">
                Choose a charity, set an amount, and record a direct donation independently from the subscription and gameplay flow.
              </p>
            </div>
            <Link to="/charities" className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-white/50">
              Explore charities
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[2rem] border border-[#0f2d28]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,45,40,0.08)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f2d28]">Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f2d28]">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f2d28]">Charity</label>
                  <select name="charity_id" value={form.charity_id} onChange={handleChange} disabled={loadingCharities} className="w-full appearance-auto rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28] disabled:opacity-60">
                    <option value="">Select a charity</option>
                    {charities.map((charity) => (
                      <option key={charity.id} value={charity.id}>{charity.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f2d28]">Amount (INR)</label>
                  <input type="number" min="1" name="amount" value={form.amount} onChange={handleChange} className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f2d28]">Message</label>
                  <textarea name="message" rows="4" value={form.message} onChange={handleChange} className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]" />
                </div>
                <button type="submit" disabled={saving} className="rounded-full bg-[#0f2d28] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:opacity-60">
                  {saving ? 'Recording...' : 'Submit donation'}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0f2d28] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d7a84a]">Direct support</p>
              <h2 className="mt-3 text-2xl font-semibold">Give without waiting for a draw cycle.</h2>
              <p className="mt-4 text-sm leading-7 text-[#d0ded9]">
                This path is for visitors and members who want to support a charity independently from the subscription, scoring, and draw experience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DonationPage
