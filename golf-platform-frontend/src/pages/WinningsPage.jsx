import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

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

const currency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount)
}

const WinningsPage = () => {
  const { logout } = useAuth()
  const [winnings, setWinnings] = useState([])
  const [proofs, setProofs] = useState({})
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadWinnings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/winners/my')
      const rows = res.data || []
      setWinnings(rows)
      setProofs(
        rows.reduce((acc, row) => {
          acc[row.id] = row.proof_url || ''
          return acc
        }, {})
      )
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load winnings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWinnings()
  }, [])

  useEffect(() => {
    if (!error && !success) return
    const timer = setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [error, success])

  const summary = useMemo(() => {
    const totalWon = winnings.reduce((sum, item) => sum + Number(item.prize || 0), 0)
    const pendingProof = winnings.filter((item) => !item.proof_url).length
    const approved = winnings.filter((item) => item.verified === 'approved').length
    const paid = winnings.filter((item) => item.paid).length

    return { totalWon, pendingProof, approved, paid }
  }, [winnings])

  const submitProof = async (winnerId) => {
    const proofUrl = String(proofs[winnerId] || '').trim()

    if (!proofUrl) {
      setError('Proof URL is required')
      return
    }

    try {
      setSubmittingId(winnerId)
      await api.patch(`/winners/${winnerId}/proof`, { proof_url: proofUrl })
      setSuccess('Proof submitted successfully')
      await loadWinnings()
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit proof')
    } finally {
      setSubmittingId('')
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#071411_0%,#102822_32%,#f4efe4_32%,#f4efe4_100%)]">
      {(error || success) && (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,28rem)]">
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}
        </div>
      )}

      <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d7a84a]">Participation & Winnings</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Track your winnings and winner proof status.
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/dashboard" className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                Back to dashboard
              </Link>
              <button type="button" onClick={logout} className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                Logout
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] bg-white p-5"><p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Total won</p><p className="mt-3 text-3xl font-semibold text-[#0f2d28]">INR {currency(summary.totalWon)}</p></div>
            <div className="rounded-[1.5rem] bg-white p-5"><p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Pending proof</p><p className="mt-3 text-3xl font-semibold text-[#0f2d28]">{summary.pendingProof}</p></div>
            <div className="rounded-[1.5rem] bg-white p-5"><p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Approved wins</p><p className="mt-3 text-3xl font-semibold text-[#0f2d28]">{summary.approved}</p></div>
            <div className="rounded-[1.5rem] bg-white p-5"><p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Paid out</p><p className="mt-3 text-3xl font-semibold text-[#0f2d28]">{summary.paid}</p></div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          {loading && <div className="rounded-[1.75rem] bg-white p-6 text-sm text-[#39544d]">Loading winnings...</div>}

          {!loading && winnings.length === 0 && (
            <div className="rounded-[1.75rem] bg-white p-6 text-sm text-[#39544d]">
              No winnings recorded yet. Once you win a draw, the proof and payment status will appear here.
            </div>
          )}

          {!loading &&
            winnings.map((item) => (
              <div key={item.id} className="rounded-[1.75rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                      {formatMonth(item.draws?.month)} {item.draws?.year}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28]">
                      {item.match_type} number match
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[#49645d]">
                      Prize: INR {currency(item.prize)} | Verification: {item.verified} | Paid: {item.paid ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28]">
                    Winning numbers: {Array.isArray(item.draws?.numbers) ? item.draws.numbers.join(', ') : 'Pending'}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    type="url"
                    value={proofs[item.id] || ''}
                    onChange={(e) => setProofs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Paste proof URL"
                    className="w-full rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] px-4 py-3 text-sm text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                  />
                  <button
                    type="button"
                    onClick={() => submitProof(item.id)}
                    disabled={submittingId === item.id || item.verified === 'approved'}
                    className="rounded-full bg-[#0f2d28] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:opacity-60"
                  >
                    {submittingId === item.id ? 'Submitting...' : item.proof_url ? 'Update proof' : 'Submit proof'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}

export default WinningsPage
