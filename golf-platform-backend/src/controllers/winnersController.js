const db = require('../db')
const { sendEmail } = require('../services/mailer')
const {
  winnerVerificationTemplate,
  payoutCompletedTemplate
} = require('../services/emailTemplates')

const formatMonth = (value) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  return months[Number(value) - 1] || value || 'Unknown month'
}

const getAllWinners = async (req, res) => {
  try {
    const { data, error } = await db
      .from('winners')
      .select('*, users(name, email), draws(month, year)')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getAllWinners:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getWinnersForDraw = async (req, res) => {
  try {
    const { data, error } = await db
      .from('winners')
      .select('*, users(name, email)')
      .eq('draw_id', req.params.drawId)
      .order('match_type', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getWinnersForDraw:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const uploadProof = async (req, res) => {
  const { proof_url } = req.body

  if (!proof_url) return res.status(400).json({ msg: 'proof url is required' })

  try {
    const { data: winner, error } = await db
      .from('winners')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !winner) {
      return res.status(404).json({ msg: 'winner record not found' })
    }

    if (winner.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'not your winner record' })
    }

    if (winner.verified === 'approved') {
      return res.status(400).json({ msg: 'already verified' })
    }

    const { data, error: updateErr } = await db
      .from('winners')
      .update({ proof_url, verified: 'pending' })
      .eq('id', req.params.id)
      .select()
      .single()

    if (updateErr) throw updateErr

    res.json({ msg: 'proof submitted', winner: data })
  } catch (err) {
    console.error('uploadProof:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const verifyWinner = async (req, res) => {
  const { action } = req.body

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ msg: 'action must be approve or reject' })
  }

  try {
    const { data: winner, error } = await db
      .from('winners')
      .select('*, users(name, email), draws(month, year)')
      .eq('id', req.params.id)
      .single()

    if (error || !winner) {
      return res.status(404).json({ msg: 'winner not found' })
    }

    const verified = action === 'approve' ? 'approved' : 'rejected'

    const { data, error: updateErr } = await db
      .from('winners')
      .update({ verified })
      .eq('id', req.params.id)
      .select('*, users(name, email), draws(month, year)')
      .single()

    if (updateErr) throw updateErr

    if (data?.users?.email) {
      const subject =
        verified === 'approved'
          ? 'Your winner submission was approved'
          : 'Your winner submission was rejected'

      try {
        await sendEmail({
          to: data.users.email,
          subject,
          html: winnerVerificationTemplate({
            name: data.users?.name,
            month: formatMonth(data.draws?.month),
            year: data.draws?.year,
            prize: data.prize,
            approved: verified === 'approved'
          })
        })
      } catch (emailErr) {
        console.error(
          `winner verification email failed for winner ${data.id}:`,
          emailErr.message
        )
      }
    }

    res.json({ msg: `winner ${verified}`, winner: data })
  } catch (err) {
    console.error('verifyWinner:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const markPaid = async (req, res) => {
  try {
    const { data: winner, error } = await db
      .from('winners')
      .select('*, users(name, email), draws(month, year)')
      .eq('id', req.params.id)
      .single()

    if (error || !winner) {
      return res.status(404).json({ msg: 'winner not found' })
    }

    if (winner.verified !== 'approved') {
      return res.status(400).json({ msg: 'winner not verified yet' })
    }

    if (winner.paid) {
      return res.status(400).json({ msg: 'already marked as paid' })
    }

    const { data, error: updateErr } = await db
      .from('winners')
      .update({ paid: true })
      .eq('id', req.params.id)
      .select('*, users(name, email), draws(month, year)')
      .single()

    if (updateErr) throw updateErr

    if (data?.users?.email) {
      try {
        await sendEmail({
          to: data.users.email,
          subject: 'Your payout has been completed',
          html: payoutCompletedTemplate({
            name: data.users?.name,
            month: formatMonth(data.draws?.month),
            year: data.draws?.year,
            prize: data.prize
          })
        })
      } catch (emailErr) {
        console.error(
          `payout email failed for winner ${data.id}:`,
          emailErr.message
        )
      }
    }

    res.json({ msg: 'marked as paid', winner: data })
  } catch (err) {
    console.error('markPaid:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getMyWinnings = async (req, res) => {
  try {
    const { data, error } = await db
      .from('winners')
      .select('*, draws(month, year, numbers)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getMyWinnings:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = {
  getAllWinners,
  getWinnersForDraw,
  uploadProof,
  verifyWinner,
  markPaid,
  getMyWinnings
}
