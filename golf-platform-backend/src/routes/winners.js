const express = require('express')
const router = express.Router()
const {
  getAllWinners,
  getWinnersForDraw,
  uploadProof,
  verifyWinner,
  markPaid,
  getMyWinnings
} = require('../controllers/winnersController')
const { protect, adminOnly, requireActiveSubscription } = require('../middleware/auth')

router.get('/my', protect, requireActiveSubscription, getMyWinnings)
router.get('/', protect, adminOnly, getAllWinners)
router.get('/draw/:drawId', getWinnersForDraw)

router.patch('/:id/proof', protect, requireActiveSubscription, uploadProof)
router.patch('/:id/verify', protect, adminOnly, verifyWinner)
router.patch('/:id/paid', protect, adminOnly, markPaid)

module.exports = router
