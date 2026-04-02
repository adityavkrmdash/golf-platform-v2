const crypto = require('crypto')
const db = require('../db')
const { createSub, cancelSub, getSub } = require('../services/razorpayService')

const PLAN_AMOUNTS = {
  monthly: Number(process.env.RAZORPAY_MONTHLY_AMOUNT || 999),
  yearly: Number(process.env.RAZORPAY_YEARLY_AMOUNT || 9999)
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

const resolveSubscriptionAmount = (plan, razorpaySubscription) => {
  const directAmount = Number(razorpaySubscription?.amount || 0)

  if (!Number.isNaN(directAmount) && directAmount > 0) {
    return directAmount / 100
  }

  return PLAN_AMOUNTS[plan] || 0
}

const getMySub = async (req, res) => {
  try {
    const { data, error } = await db
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return res.json(null)

    res.json(data)
  } catch (err) {
    console.error('getMySub:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const startCheckout = async (req, res) => {
  const { plan } = req.body

  if (!plan || !['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ msg: 'plan must be monthly or yearly' })
  }

  const planId = plan === 'monthly'
    ? process.env.RAZORPAY_MONTHLY_PLAN
    : process.env.RAZORPAY_YEARLY_PLAN

  try {
    const { data: existingSubscriptions, error: existingError } = await db
      .from('subscriptions')
      .select('id, status, created_at, renews_at')
      .eq('user_id', req.user.id)

    if (existingError) throw existingError

    const latestSubscription = getLatestSubscription(existingSubscriptions || [])

    if (latestSubscription?.status === 'active') {
      return res.status(400).json({ msg: 'already have an active subscription' })
    }

    const rzpSub = await createSub(planId, req.user.id)

    res.json({
      subscription_id: rzpSub.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan,
      amount: PLAN_AMOUNTS[plan] || 0
    })
  } catch (err) {
    console.error('startCheckout:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const verifyPayment = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    plan
  } = req.body

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return res.status(400).json({ msg: 'missing payment details' })
  }

  if (!plan || !['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ msg: 'plan must be monthly or yearly' })
  }

  try {
    const body = razorpay_payment_id + '|' + razorpay_subscription_id
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return res.status(400).json({ msg: 'payment verification failed' })
    }

    const rzpSub = await getSub(razorpay_subscription_id)
    const renewsAt = rzpSub.current_end ? new Date(rzpSub.current_end * 1000).toISOString() : null
    const amount = resolveSubscriptionAmount(plan, rzpSub)

    const payload = {
      user_id: req.user.id,
      stripe_sub_id: razorpay_subscription_id,
      stripe_cust_id: razorpay_payment_id,
      plan,
      status: 'active',
      amount,
      renews_at: renewsAt
    }

    const { error: deactivateError } = await db
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', req.user.id)
      .eq('status', 'active')

    if (deactivateError) throw deactivateError

    const { data: existingSub, error: existingSubError } = await db
      .from('subscriptions')
      .select('id')
      .eq('stripe_sub_id', razorpay_subscription_id)
      .maybeSingle()

    if (existingSubError) throw existingSubError

    let savedSubscription = null

    if (existingSub) {
      const { data, error } = await db
        .from('subscriptions')
        .update(payload)
        .eq('id', existingSub.id)
        .select()
        .single()

      if (error) throw error
      savedSubscription = data
    } else {
      const { data, error } = await db
        .from('subscriptions')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      savedSubscription = data
    }

    res.json({
      msg: 'subscription activated',
      sub_id: razorpay_subscription_id,
      subscription: savedSubscription
    })
  } catch (err) {
    console.error('verifyPayment:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const cancelMySub = async (req, res) => {
  try {
    const { data: subscriptions, error } = await db
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
 
    if (error) throw error

    const sub = getLatestSubscription(subscriptions || [])

    if (!sub || sub.status !== 'active') {
      return res.status(404).json({ msg: 'no active subscription found' })
    }

    await cancelSub(sub.stripe_sub_id)

    const { data: updated } = await db
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', sub.id)
      .select()
      .single()

    res.json({ msg: 'subscription cancelled', sub: updated })
  } catch (err) {
    console.error('cancelMySub:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature']

  try {
    const body = JSON.stringify(req.body)
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expected !== signature) {
      return res.status(400).json({ msg: 'invalid webhook signature' })
    }

    const event = req.body.event
    const payload = req.body.payload

    switch (event) {
      case 'subscription.activated': {
        const sub = payload.subscription.entity
        await db
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_sub_id', sub.id)
        console.log('subscription activated:', sub.id)
        break
      }

      case 'subscription.charged': {
        const sub = payload.subscription.entity
        const renewsAt = new Date(sub.current_end * 1000)
        await db
          .from('subscriptions')
          .update({ status: 'active', renews_at: renewsAt })
          .eq('stripe_sub_id', sub.id)
        console.log('subscription renewed:', sub.id)
        break
      }

      case 'subscription.halted':
      case 'subscription.payment_failed': {
        const sub = payload.subscription.entity
        await db
          .from('subscriptions')
          .update({ status: 'lapsed' })
          .eq('stripe_sub_id', sub.id)
        console.log('subscription lapsed:', sub.id)
        break
      }

      case 'subscription.cancelled': {
        const sub = payload.subscription.entity
        await db
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_sub_id', sub.id)
        console.log('subscription cancelled:', sub.id)
        break
      }

      default:
        console.log('unhandled webhook event:', event)
    }

    res.json({ received: true })
  } catch (err) {
    console.error('webhook error:', err.message)
    res.status(500).json({ msg: 'webhook failed' })
  }
}

module.exports = { getMySub, startCheckout, verifyPayment, cancelMySub, handleWebhook }
