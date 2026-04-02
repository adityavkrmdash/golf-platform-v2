import { useEffect, useState } from 'react'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const emptyCharityForm = {
  id: null,
  name: '',
  description: '',
  image_url: '',
  featured: false,
  events: ''
}

const emptyDrawForm = {
  month: '',
  year: '',
  draw_type: 'random'
}

const currency = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumbers = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 'Pending draw numbers'
  }

  return numbers.join(', ')
}

const formatDateInput = (value) => {
  if (!value) return ''
  return new Date(value).toISOString().split('T')[0]
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

const getLatestSubscription = (subscriptions) => {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return null
  }

  return [...subscriptions].sort((a, b) => {
    const first = new Date(a.created_at || a.renews_at || 0).getTime()
    const second = new Date(b.created_at || b.renews_at || 0).getTime()
    return second - first
  })[0]
}

const isRoleProtectedAdmin = (item, currentUser) => {
  if (!item || item.formRole !== 'admin') return false
  return item.id === currentUser?.id || item.role === 'admin'
}

const AdminPage = () => {
  const { user, logout } = useAuth()

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [charities, setCharities] = useState([])
  const [winners, setWinners] = useState([])
  const [draws, setDraws] = useState([])
  const [selectedUserScores, setSelectedUserScores] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drawSaving, setDrawSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [charityForm, setCharityForm] = useState(emptyCharityForm)
  const [drawForm, setDrawForm] = useState(emptyDrawForm)

  const loadPage = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true)
      }
      setError('')

      const [statsRes, usersRes, charitiesRes, winnersRes, drawsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/charities'),
        api.get('/winners'),
        api.get('/draws')
      ])

      if (statsRes.status !== 'fulfilled') {
        throw statsRes.reason
      }

      if (usersRes.status !== 'fulfilled') {
        throw usersRes.reason
      }

      const normalizedUsers = (usersRes.value.data || [])
        .filter((item) => item.role !== 'admin')
        .map((item) => {
        const latestSubscription = getLatestSubscription(item.subscriptions)

        return {
          ...item,
          formRole: item.role || 'user',
          formCharityPct: item.charity_pct ?? 10,
          formSubscriptionStatus: latestSubscription?.status || 'none'
        }
      })

      setStats(statsRes.value.data)
      setUsers(normalizedUsers)
      setCharities(charitiesRes.status === 'fulfilled' ? charitiesRes.value.data || [] : [])
      setWinners(winnersRes.status === 'fulfilled' ? winnersRes.value.data || [] : [])
      setDraws(drawsRes.status === 'fulfilled' ? drawsRes.value.data || [] : [])

      if (
        charitiesRes.status !== 'fulfilled' ||
        winnersRes.status !== 'fulfilled' ||
        drawsRes.status !== 'fulfilled'
      ) {
        setError('Some admin sections could not be loaded right now.')
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load admin data')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
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

  const loadUserScores = async (userId) => {
    try {
      setError('')
      setSuccess('')
      const res = await api.get(`/admin/users/${userId}/scores`)
      const scores = (res.data || []).map((score) => ({
        ...score,
        editVal: score.val,
        editDate: formatDateInput(score.played_on)
      }))
      setSelectedUserScores(scores)
      setSelectedUserId(userId)
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load user scores')
    }
  }

  const handleUserFieldChange = (userId, field, value) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === userId ? { ...item, [field]: value } : item
      )
    )
  }

  const handleScoreFieldChange = (scoreId, field, value) => {
    setSelectedUserScores((prev) =>
      prev.map((score) =>
        score.id === scoreId ? { ...score, [field]: value } : score
      )
    )
  }

  const handleCharityChange = (e) => {
    const { name, value, type, checked } = e.target
    setCharityForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDrawChange = (e) => {
    const { name, value } = e.target
    setDrawForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const resetCharityForm = () => {
    setCharityForm(emptyCharityForm)
  }

  const resetDrawForm = () => {
    setDrawForm(emptyDrawForm)
  }

  const startEditCharity = (charity) => {
    setCharityForm({
      id: charity.id,
      name: charity.name || '',
      description: charity.description || '',
      image_url: charity.image_url || '',
      featured: Boolean(charity.featured),
      events: Array.isArray(charity.events) ? charity.events.join('\n') : ''
    })
    setSuccess('')
    setError('')
  }

  const submitCharity = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const payload = {
        name: charityForm.name,
        description: charityForm.description,
        image_url: charityForm.image_url,
        featured: charityForm.featured,
        events: charityForm.events
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      }

      if (charityForm.id) {
        await api.patch(`/charities/${charityForm.id}`, payload)
        setSuccess('Charity updated successfully')
      } else {
        await api.post('/charities', payload)
        setSuccess('Charity created successfully')
      }

      resetCharityForm()
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save charity')
    } finally {
      setSaving(false)
    }
  }

  const deleteCharity = async (id) => {
    const confirmed = window.confirm('Delete this charity?')
    if (!confirmed) return

    try {
      setError('')
      setSuccess('')
      await api.delete(`/charities/${id}`)
      setSuccess('Charity deleted successfully')
      if (charityForm.id === id) resetCharityForm()
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete charity')
    }
  }

  const verifyWinner = async (id, action) => {
    try {
      setError('')
      setSuccess('')
      await api.patch(`/winners/${id}/verify`, { action })
      setSuccess(`Winner ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update winner')
    }
  }

  const markWinnerPaid = async (id) => {
    try {
      setError('')
      setSuccess('')
      await api.patch(`/winners/${id}/paid`)
      setSuccess('Winner marked as paid')
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to mark payout')
    }
  }

  const createDraw = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanMonth = Number(drawForm.month)
    const cleanYear = Number(drawForm.year)

    if (!cleanMonth || Number.isNaN(cleanMonth) || cleanMonth < 1 || cleanMonth > 12) {
      setError('Month is required')
      return
    }

    if (!cleanYear || Number.isNaN(cleanYear)) {
      setError('Enter a valid year')
      return
    }

    setDrawSaving(true)

    try {
      await api.post('/draws', {
        month: cleanMonth,
        year: cleanYear,
        draw_type: drawForm.draw_type
      })

      setSuccess('Draw created successfully')
      resetDrawForm()
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create draw')
    } finally {
      setDrawSaving(false)
    }
  }

  const simulateDraw = async (id) => {
    try {
      setError('')
      setSuccess('')
      await api.post(`/draws/${id}/simulate`)
      setSuccess('Draw simulated successfully')
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to simulate draw')
    }
  }

  const publishDraw = async (id) => {
    try {
      setError('')
      setSuccess('')
      await api.post(`/draws/${id}/publish`)
      setSuccess('Draw published successfully')
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to publish draw')
    }
  }

  const saveUser = async (item) => {
    try {
      setError('')
      setSuccess('')

      await api.patch(`/admin/users/${item.id}`, {
        role: item.formRole,
        charity_pct: Number(item.formCharityPct)
      })

      await api.patch(`/admin/users/${item.id}/subscription`, {
        status: item.formSubscriptionStatus
      })

      setSuccess('User updated successfully')
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update user')
    }
  }

  const deleteUser = async (id) => {
    const confirmed = window.confirm('Delete this user?')
    if (!confirmed) return

    try {
      setError('')
      setSuccess('')
      await api.delete(`/admin/users/${id}`)
      setSuccess('User deleted successfully')
      await loadPage({ showLoader: false })
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete user')
    }
  }

  const updateScore = async (score) => {
    try {
      setError('')
      setSuccess('')
      await api.patch(`/admin/scores/${score.id}`, {
        val: Number(score.editVal),
        played_on: score.editDate
      })
      setSuccess('Score updated successfully')
      if (selectedUserId) {
        await loadUserScores(selectedUserId)
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update score')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071411] text-white">
        Loading admin panel...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#071411_0%,#102822_30%,#f4efe4_30%,#f4efe4_100%)]">
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
                Control Center
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d5e3df]">
                Manage users, scores, subscriptions, charities, draws, and winners from one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white">
                {user?.name || 'Admin'}
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>

          {stats && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-[1.5rem] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Total users</p>
                <p className="mt-3 text-3xl font-semibold text-[#0f2d28]">{stats.total_users || 0}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Active subscriptions</p>
                <p className="mt-3 text-3xl font-semibold text-[#0f2d28]">{stats.active_subs || 0}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Pending winners</p>
                <p className="mt-3 text-3xl font-semibold text-[#0f2d28]">{stats.pending_winners || 0}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Prize pool</p>
                <p className="mt-3 text-3xl font-semibold text-[#0f2d28]">INR {currency(stats.total_pool)}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Direct donations</p>
                <p className="mt-3 text-3xl font-semibold text-[#0f2d28]">INR {currency(stats.total_donations)}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#9e6d16]">Total impact</p>
                <p className="mt-3 text-3xl font-semibold text-[#0f2d28]">INR {currency(stats.total_impact)}</p>
              </div>
            </div>
          )}

        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
              User Management
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28]">
              Edit roles, contribution, subscription, and scores
            </h2>

            <div className="mt-6 space-y-4">
              {users.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0f2d28]">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#45615a]">{item.email}</p>
                      {item.formRole !== 'admin' && (
                        <p className="mt-1 text-sm text-[#45615a]">
                          Current subscription: {getLatestSubscription(item.subscriptions)?.status || 'none'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start">
                      <button
                        type="button"
                        onClick={() => deleteUser(item.id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className={`mt-4 grid gap-3 ${item.formRole === 'admin' ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9e6d16]">
                        Role
                      </label>
                      {isRoleProtectedAdmin(item, user) ? (
                        <div className="rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28]">
                          Admin
                        </div>
                      ) : (
                        <select
                          value={item.formRole}
                          onChange={(e) =>
                            handleUserFieldChange(item.id, 'formRole', e.target.value)
                          }
                          className="w-full appearance-auto rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>

                    {item.formRole !== 'admin' && (
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9e6d16]">
                          Charity %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.formCharityPct}
                          onChange={(e) =>
                            handleUserFieldChange(item.id, 'formCharityPct', e.target.value)
                          }
                          className="w-full rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                        />
                      </div>
                    )}

                    {item.formRole !== 'admin' && (
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9e6d16]">
                          Subscription
                        </label>
                        <select
                          value={item.formSubscriptionStatus}
                          onChange={(e) =>
                            handleUserFieldChange(item.id, 'formSubscriptionStatus', e.target.value)
                          }
                          className="w-full appearance-auto rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                        >
                          <option value="none">No subscription</option>
                          <option value="active">Active</option>
                          <option value="lapsed">Lapsed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveUser(item)}
                        className="w-full rounded-full bg-[#0f2d28] px-4 py-3 text-sm font-semibold text-white"
                      >
                        Save user
                      </button>
                    </div>
                  </div>

                  {item.formRole !== 'admin' && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => loadUserScores(item.id)}
                        className="rounded-full border border-[#0f2d28]/10 px-4 py-2 text-xs font-semibold text-[#0f2d28]"
                      >
                        View scores
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {users.length === 0 && (
                <p className="text-sm text-[#45615a]">No users found.</p>
              )}
            </div>

            {selectedUserId && (
              <div className="mt-8 rounded-2xl border border-[#0f2d28]/10 bg-white p-5">
                <h3 className="text-xl font-semibold text-[#0f2d28]">Selected user scores</h3>

                <div className="mt-4 space-y-3">
                  {selectedUserScores.map((score) => (
                    <div
                      key={score.id}
                      className="rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <input
                          type="number"
                          min="1"
                          max="45"
                          value={score.editVal}
                          onChange={(e) =>
                            handleScoreFieldChange(score.id, 'editVal', e.target.value)
                          }
                          className="rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                        />
                        <input
                          type="date"
                          value={score.editDate}
                          onChange={(e) =>
                            handleScoreFieldChange(score.id, 'editDate', e.target.value)
                          }
                          className="rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                        />
                        <button
                          type="button"
                          onClick={() => updateScore(score)}
                          className="rounded-full bg-[#0f2d28] px-5 py-3 text-sm font-semibold text-white"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedUserScores.length === 0 && (
                    <p className="text-sm text-[#45615a]">No scores found for this user.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                  Charity Management
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28]">
                  Add or update charity partners
                </h2>

                <form onSubmit={submitCharity} className="mt-6 space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={charityForm.name}
                    onChange={handleCharityChange}
                    placeholder="Charity name"
                    className="w-full rounded-2xl border border-[#0f2d28]/20 bg-[#f8f4ea] px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                    required
                  />

                  <textarea
                    name="description"
                    value={charityForm.description}
                    onChange={handleCharityChange}
                    placeholder="Description"
                    rows="4"
                    className="w-full rounded-2xl border border-[#0f2d28]/20 bg-[#f8f4ea] px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                  />

                  <input
                    type="text"
                    name="image_url"
                    value={charityForm.image_url}
                    onChange={handleCharityChange}
                    placeholder="Image URL"
                    className="w-full rounded-2xl border border-[#0f2d28]/20 bg-[#f8f4ea] px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                  />

                  <textarea
                    name="events"
                    value={charityForm.events}
                    onChange={handleCharityChange}
                    placeholder="Events, one per line"
                    rows="4"
                    className="w-full rounded-2xl border border-[#0f2d28]/20 bg-[#f8f4ea] px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                  />

                  <label className="flex items-center gap-3 text-sm text-[#0f2d28]">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={charityForm.featured}
                      onChange={handleCharityChange}
                    />
                    Mark as featured
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-[#0f2d28] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:opacity-60"
                    >
                      {saving
                        ? 'Saving...'
                        : charityForm.id
                          ? 'Update charity'
                          : 'Create charity'}
                    </button>

                    {charityForm.id && (
                      <button
                        type="button"
                        onClick={resetCharityForm}
                        className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-8 space-y-4">
                  {charities.map((charity) => (
                    <div
                      key={charity.id}
                      className="rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-[#0f2d28]">
                            {charity.name}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-[#45615a]">
                            {charity.description || 'No description yet.'}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCharity(charity)}
                            className="rounded-full border border-[#0f2d28]/10 px-4 py-2 text-xs font-semibold text-[#0f2d28]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCharity(charity.id)}
                            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {charities.length === 0 && (
                    <p className="text-sm text-[#45615a]">No charities added yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                  Draw Management
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28]">
                  Create and run monthly draws
                </h2>

                <form onSubmit={createDraw} className="mt-6 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                      Month
                    </label>
                    <select
                      name="month"
                      value={drawForm.month}
                      onChange={handleDrawChange}
                      className="w-full appearance-auto rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                      required
                    >
                      <option value="">Select month</option>
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={drawForm.year}
                      onChange={handleDrawChange}
                      placeholder="2026"
                      className="w-full rounded-2xl border border-[#0f2d28]/20 bg-[#f8f4ea] px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#0f2d28]">
                      Draw type
                    </label>
                    <select
                      name="draw_type"
                      value={drawForm.draw_type}
                      onChange={handleDrawChange}
                      className="w-full appearance-auto rounded-2xl border border-[#0f2d28]/20 bg-white px-4 py-3 text-sm font-medium text-[#0f2d28] outline-none transition focus:border-[#0f2d28]"
                    >
                      <option value="random">Random</option>
                      <option value="algo">Algorithm</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={drawSaving}
                    className="rounded-full bg-[#0f2d28] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#18443c] disabled:opacity-60"
                  >
                    {drawSaving ? 'Creating...' : 'Create draw'}
                  </button>
                </form>

                <div className="mt-8 space-y-4">
                  {draws.map((draw) => (
                    <div
                      key={draw.id}
                      className="rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-[#0f2d28]">
                              {formatMonth(draw.month)} {draw.year}
                            </h3>
                            <p className="mt-1 text-sm text-[#45615a]">
                              Type: {draw.draw_type} | Status: {draw.status}
                            </p>
                            <p className="mt-1 text-sm text-[#45615a]">
                              Numbers: {formatNumbers(draw.numbers)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => simulateDraw(draw.id)}
                            className="rounded-full border border-[#0f2d28]/10 px-4 py-2 text-xs font-semibold text-[#0f2d28]"
                          >
                            Simulate
                          </button>
                          <button
                            type="button"
                            onClick={() => publishDraw(draw.id)}
                            className="rounded-full bg-[#0f2d28] px-4 py-2 text-xs font-semibold text-white"
                          >
                            Publish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {draws.length === 0 && (
                    <p className="text-sm text-[#45615a]">No draws created yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_50px_rgba(15,45,40,0.08)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                Winners Management
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0f2d28]">
                Verify proofs and track payouts
              </h2>

              <div className="mt-6 space-y-4">
                {winners.map((winner) => (
                  <div
                    key={winner.id}
                    className="rounded-2xl border border-[#0f2d28]/10 bg-[#f8f4ea] p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0f2d28]">
                          {winner.users?.name || 'Winner'}
                        </h3>
                        <p className="mt-1 text-sm text-[#45615a]">
                          {winner.users?.email || 'No email'}
                        </p>
                        <p className="mt-2 text-sm text-[#45615a]">
                          Draw: {formatMonth(winner.draws?.month)} {winner.draws?.year}
                        </p>
                        <p className="mt-1 text-sm text-[#45615a]">
                          Match: {winner.match_type} | Prize: INR {currency(winner.prize)}
                        </p>
                        <p className="mt-1 text-sm text-[#45615a]">
                          Verification: {winner.verified} | Paid: {winner.paid ? 'Yes' : 'No'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {winner.proof_url && (
                          <a
                            href={winner.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#0f2d28]/10 px-4 py-2 text-xs font-semibold text-[#0f2d28]"
                          >
                            View proof
                          </a>
                        )}

                        {winner.verified === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => verifyWinner(winner.id, 'approve')}
                              className="rounded-full bg-[#0f2d28] px-4 py-2 text-xs font-semibold text-white"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => verifyWinner(winner.id, 'reject')}
                              className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {winner.verified === 'approved' && !winner.paid && (
                          <button
                            type="button"
                            onClick={() => markWinnerPaid(winner.id)}
                            className="rounded-full border border-[#0f2d28]/10 px-4 py-2 text-xs font-semibold text-[#0f2d28]"
                          >
                            Mark paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {winners.length === 0 && (
                  <p className="text-sm text-[#45615a]">No winner records found yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminPage
