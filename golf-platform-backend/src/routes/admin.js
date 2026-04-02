const express = require('express')
const router = express.Router()
const {
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
} = require('../controllers/adminController')
const { protect, adminOnly } = require('../middleware/auth')

router.use(protect, adminOnly)

router.get('/stats', getStats)

router.get('/users', getAllUsers)
router.get('/users/:id', getOneUser)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

router.get('/users/:id/scores', getUserScores)
router.patch('/scores/:scoreId', adminEditScore)

router.patch('/users/:id/subscription', manageSubscription)

router.get('/draws', getDrawStats)

router.get('/charities/report', getCharityReport)

module.exports = router
