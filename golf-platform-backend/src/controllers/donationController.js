const db = require('../db')

const getDonations = async (req, res) => {
  try {
    const { data, error } = await db
      .from('donations')
      .select('*, charities(name)')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getDonations:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const createDonation = async (req, res) => {
  const { name, email, charity_id, amount, message } = req.body

  const parsedAmount = Number(amount)

  if (!name || !email || !charity_id || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ msg: 'name, email, charity and amount are required' })
  }

  try {
    const { data: charity, error: charityError } = await db
      .from('charities')
      .select('id')
      .eq('id', charity_id)
      .maybeSingle()

    if (charityError) throw charityError

    if (!charity) {
      return res.status(400).json({ msg: 'selected charity not found' })
    }

    const { data, error } = await db
      .from('donations')
      .insert({
        name,
        email: email.toLowerCase(),
        charity_id,
        amount: parsedAmount,
        message: message || null,
        status: 'recorded'
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      msg: 'donation recorded successfully',
      donation: data
    })
  } catch (err) {
    console.error('createDonation:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = {
  getDonations,
  createDonation
}
