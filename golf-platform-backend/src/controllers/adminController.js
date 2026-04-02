const db = require('../db')

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

const getStats = async (req, res) => {
  try {
    const { count: totalUsers } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalDraws } = await db
      .from('draws')
      .select('*', { count: 'exact', head: true })

    const { count: pendingWinners } = await db
      .from('winners')
      .select('*', { count: 'exact', head: true })
      .eq('verified', 'pending')

    const { data: poolData } = await db
      .from('pool_log')
      .select('total')

    const totalPool =
      poolData?.reduce((sum, row) => sum + Number(row.total || 0), 0) || 0

    const { data: donationData } = await db
      .from('donations')
      .select('amount')

    const totalDonations =
      donationData?.reduce((sum, row) => sum + Number(row.amount || 0), 0) || 0

    const { data: charityData } = await db
      .from('users')
      .select('charity_id, charity_pct, subscriptions(amount, status, created_at, renews_at)')

    let totalCharity = 0
    let activeSubs = 0
    charityData?.forEach(u => {
      const latestSubscription = getLatestSubscription(u.subscriptions)

      if (latestSubscription?.status === 'active') {
        activeSubs += 1
      }

      if (latestSubscription?.status === 'active' && u.charity_id) {
        totalCharity +=
          (Number(latestSubscription.amount || 0) * Number(u.charity_pct || 0)) / 100
      }
    })

    res.json({
      total_users: totalUsers,
      active_subs: activeSubs,
      total_draws: totalDraws,
      pending_winners: pendingWinners,
      total_pool: totalPool,
      total_charity: totalCharity,
      total_donations: totalDonations,
      total_impact: totalCharity + totalDonations
    })
  } catch (err) {
    console.error('getStats:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await db
      .from('users')
      .select('id, name, email, role, charity_id, charity_pct, created_at, subscriptions(plan, status, renews_at, created_at)')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getAllUsers:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getOneUser = async (req, res) => {
  try {
    const { data, error } = await db
      .from('users')
      .select('id, name, email, role, charity_id, charity_pct, created_at, subscriptions(*), scores(*)')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ msg: 'user not found' })

    res.json(data)
  } catch (err) {
    console.error('getOneUser:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const updateUser = async (req, res) => {
  const { name, email, role, charity_id, charity_pct } = req.body

  try {
    const { data: existingUser, error: existingUserError } = await db
      .from('users')
      .select('id, role')
      .eq('id', req.params.id)
      .single()

    if (existingUserError || !existingUser) {
      return res.status(404).json({ msg: 'user not found' })
    }

    if (role && role !== existingUser.role) {
      if (existingUser.id === req.user.id) {
        return res.status(400).json({ msg: 'cannot change your own role' })
      }

      if (existingUser.role === 'admin') {
        return res.status(403).json({ msg: 'cannot change another admin role' })
      }
    }

  const updates = {}
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email.toLowerCase()
  if (role && ['user', 'admin'].includes(role)) updates.role = role
  if (charity_id !== undefined) updates.charity_id = charity_id
  if (charity_pct !== undefined) {
    const parsedPct = Number(charity_pct)

    if (Number.isNaN(parsedPct) || parsedPct < 0 || parsedPct > 100) {
      return res.status(400).json({ msg: 'charity percentage must be between 0 and 100' })
    }

    updates.charity_pct = parsedPct
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ msg: 'nothing to update' })
  }

    const { data, error } = await db
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role, charity_id, charity_pct')
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('updateUser:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ msg: 'cannot delete yourself' })
    }

    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ msg: 'user not found' })

    const { error } = await db
      .from('users')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error

    res.json({ msg: 'user deleted' })
  } catch (err) {
    console.error('deleteUser:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const adminEditScore = async (req, res) => {
  const { val, played_on } = req.body

  const updates = {}
  if (val !== undefined) {
    const parsedVal = Number(val)

    if (Number.isNaN(parsedVal) || parsedVal < 1 || parsedVal > 45) {
      return res.status(400).json({ msg: 'score must be between 1 and 45' })
    }
    updates.val = parsedVal
  }
  if (played_on) updates.played_on = played_on

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ msg: 'nothing to update' })
  }

  try {
    const { data: existing } = await db
      .from('scores')
      .select('id')
      .eq('id', req.params.scoreId)
      .single()

    if (!existing) return res.status(404).json({ msg: 'score not found' })

    const { data, error } = await db
      .from('scores')
      .update(updates)
      .eq('id', req.params.scoreId)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('adminEditScore:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getUserScores = async (req, res) => {
  try {
    const { data, error } = await db
      .from('scores')
      .select('*')
      .eq('user_id', req.params.id)
      .order('played_on', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getUserScores:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const manageSubscription = async (req, res) => {
  const { status } = req.body

  if (!status || !['none', 'active', 'cancelled', 'lapsed'].includes(status)) {
    return res.status(400).json({ msg: 'status must be none, active, cancelled or lapsed' })
  }

  try {
    const { data: existingSub, error: subError } = await db
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) throw subError

    if (status === 'none') {
      if (!existingSub) {
        return res.json({ msg: 'no subscription to remove' })
      }

      const { error } = await db
        .from('subscriptions')
        .delete()
        .eq('user_id', req.params.id)

      if (error) throw error

      return res.json({ msg: 'subscription removed' })
    }

    if (!existingSub) {
      const { data, error } = await db
        .from('subscriptions')
        .insert({
          user_id: req.params.id,
          plan: 'monthly',
          status,
          amount: 0
        })
        .select()
        .single()

      if (error) throw error

      return res.json(data)
    }

    const { data, error } = await db
      .from('subscriptions')
      .update({ status })
      .eq('id', existingSub.id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('manageSubscription:', err)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getDrawStats = async (req, res) => {
  try {
    const { data: draws, error } = await db
      .from('draws')
      .select('*, pool_log(total, m5, m4, m3, sub_count)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const { data: winners } = await db
      .from('winners')
      .select('draw_id, match_type, prize, verified, paid')

    const enriched = draws.map(d => {
      const drawWinners = winners.filter(w => w.draw_id === d.id)
      return {
        ...d,
        winner_count: drawWinners.length,
        unpaid_count: drawWinners.filter(w => w.paid === false && w.verified === 'approved').length
      }
    })

    res.json(enriched)
  } catch (err) {
    console.error('getDrawStats:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getCharityReport = async (req, res) => {
  try {
    const { data: charities, error } = await db
      .from('charities')
      .select('id, name, featured')

    if (error) throw error

    const { data: users } = await db
      .from('users')
      .select('charity_id, charity_pct, subscriptions(amount, status, created_at, renews_at)')

    const report = charities.map(charity => {
      const supporters = users.filter(u => u.charity_id === charity.id)
      let total = 0

      supporters.forEach(u => {
        const latestSubscription = getLatestSubscription(u.subscriptions)
        if (latestSubscription?.status === 'active') {
          total +=
            (Number(latestSubscription.amount || 0) * Number(u.charity_pct || 0)) / 100
        }
      })

      return {
        ...charity,
        supporter_count: supporters.length,
        total_contributions: total
      }
    })

    res.json(report)
  } catch (err) {
    console.error('getCharityReport:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = {
  getStats,
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
  adminEditScore,
  getUserScores,
  manageSubscription,
  getDrawStats,
  getCharityReport
}
