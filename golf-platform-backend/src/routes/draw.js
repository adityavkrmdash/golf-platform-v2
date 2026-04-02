const express = require('express')
const router = express.Router()
const {
  getDraws,
  getOneDraw,
  createDraw,
  simulateDraw,
  publishDraw,
  getMyDrawHistory
} = require('../controllers/drawController')
const { protect, adminOnly, requireActiveSubscription } = require('../middleware/auth')

router.get('/', getDraws)
router.get('/my', protect, requireActiveSubscription, getMyDrawHistory)
router.get('/:id', getOneDraw)

router.post('/', protect, adminOnly, createDraw)
router.post('/:id/simulate', protect, adminOnly, simulateDraw)
router.post('/:id/publish', protect, adminOnly, publishDraw)

module.exports = router
