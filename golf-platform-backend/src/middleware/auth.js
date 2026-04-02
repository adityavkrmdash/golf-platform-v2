const jwt = require('jsonwebtoken')
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

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'not logged in' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const { data: user, error } = await db
      .from('users')
      .select('id, name, email, role, charity_id, charity_pct')
      .eq('id', payload.id)
      .single()

    if (error || !user) {
      return res.status(401).json({ msg: 'user no longer exists' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ msg: 'token invalid or expired' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'admins only' })
  }
  next()
}

const requireActiveSubscription = async (req, res, next) => {
  try {
    const { data: subscriptions, error } = await db
      .from('subscriptions')
      .select('id, plan, status, renews_at, created_at')
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(500).json({ msg: 'failed to validate subscription' })
    }

    const subscription = getLatestSubscription(subscriptions || [])

    if (!subscription) {
      return res.status(403).json({ msg: 'active subscription required' })
    }

    if (subscription.status !== 'active') {
      return res.status(403).json({ msg: 'active subscription required' })
    }

    req.subscription = subscription
    next()
  } catch (err) {
    return res.status(500).json({ msg: 'failed to validate subscription' })
  }
}

module.exports = { protect, adminOnly, requireActiveSubscription }
