const Razorpay = require('razorpay')

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const createSub = async (planId, userId) => {
  const sub = await rzp.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    quantity: 1,
    total_count: 12,
    notes: { userId }
  })
  return sub
}

const cancelSub = async (subId) => {
  const cancelled = await rzp.subscriptions.cancel(subId)
  return cancelled
}

const getSub = async (subId) => {
  const sub = await rzp.subscriptions.fetch(subId)
  return sub
}

module.exports = { createSub, cancelSub, getSub }