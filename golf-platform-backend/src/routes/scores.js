const router = require('express').Router()
const { getMyScores, addScore, editScore, deleteScore } = require('../controllers/scoresController')
const { protect, requireActiveSubscription } = require('../middleware/auth')

router.use(protect, requireActiveSubscription)

router.get('/', getMyScores)
router.post('/', addScore)
router.patch('/:id', editScore)
router.delete('/:id', deleteScore)

module.exports = router
