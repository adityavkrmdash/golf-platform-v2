const express = require('express')
const router = express.Router()
const {
  getAllCharities,
  getOneCharity,
  createCharity,
  updateCharity,
  deleteCharity,
  getFeatured
} = require('../controllers/charityController')
const { protect, adminOnly } = require('../middleware/auth')

router.get('/', getAllCharities)
router.get('/featured', getFeatured)
router.get('/:id', getOneCharity)

router.post('/', protect, adminOnly, createCharity)
router.patch('/:id', protect, adminOnly, updateCharity)
router.delete('/:id', protect, adminOnly, deleteCharity)

module.exports = router