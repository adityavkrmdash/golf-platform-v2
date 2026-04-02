const router = require('express').Router()
const { getDonations, createDonation } = require('../controllers/donationController')
const { protect, adminOnly } = require('../middleware/auth')

router.post('/', createDonation)
router.get('/', protect, adminOnly, getDonations)

module.exports = router
