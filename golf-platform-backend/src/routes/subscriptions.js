const express = require('express')
const router = express.Router()
const { getMySub, startCheckout, verifyPayment, cancelMySub, handleWebhook } = require('../controllers/subscriptionController')
const { protect } = require('../middleware/auth')

router.post('/webhook', handleWebhook)

router.get('/my', protect, getMySub)
router.post('/checkout', protect, startCheckout)
router.post('/verify', protect, verifyPayment)
router.post('/cancel', protect, cancelMySub)

module.exports = router