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

const getPublicStats = async (req, res) => {
  try {
    const { count: totalUsers } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalCharities } = await db
      .from('charities')
      .select('*', { count: 'exact', head: true })

    const { count: totalDraws } = await db
      .from('draws')
      .select('*', { count: 'exact', head: true })

    const { count: publishedDraws } = await db
      .from('draws')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    const { count: totalWinners } = await db
      .from('winners')
      .select('*', { count: 'exact', head: true })

    const { data: poolData, error: poolError } = await db
      .from('pool_log')
      .select('total')

    if (poolError) throw poolError

    const totalPool =
      poolData?.reduce((sum, row) => sum + Number(row.total || 0), 0) || 0

    const { data: donationData, error: donationError } = await db
      .from('donations')
      .select('amount')

    const totalDonations = donationError
      ? 0
      : donationData?.reduce((sum, row) => sum + Number(row.amount || 0), 0) || 0

    const { data: charityData, error: charityError } = await db
      .from('users')
      .select('charity_id, charity_pct, subscriptions(amount, status, created_at, renews_at)')

    if (charityError) throw charityError

    let totalCharity = 0
    let activeSubscriptionCount = 0

    charityData?.forEach((user) => {
      const latestSubscription = getLatestSubscription(user.subscriptions)

      if (latestSubscription?.status === 'active') {
        activeSubscriptionCount += 1
      }

      if (latestSubscription?.status === 'active' && user.charity_id) {
        totalCharity +=
          (Number(latestSubscription.amount || 0) * Number(user.charity_pct || 0)) / 100
      }
    })

    res.json({
      total_users: totalUsers || 0,
      active_subscriptions: activeSubscriptionCount,
      total_charities: totalCharities || 0,
      total_draws: totalDraws || 0,
      published_draws: publishedDraws || 0,
      total_winners: totalWinners || 0,
      total_pool: totalPool,
      total_charity: totalCharity,
      total_donations: totalDonations,
      total_impact: totalCharity + totalDonations
    })
  } catch (err) {
    console.error('getPublicStats:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = {
  getPublicStats
}
