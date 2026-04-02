const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const register = async (req, res) => {
  const { name, email, password, charity_id, charity_pct } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'name, email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: 'password must be at least 6 chars' })
  }

  try {
    let validatedCharityId = null
    let validatedCharityPct = 10

    if (charity_id) {
      const { data: charity, error: charityError } = await db
        .from('charities')
        .select('id')
        .eq('id', charity_id)
        .maybeSingle()

      if (charityError) throw charityError

      if (!charity) {
        return res.status(400).json({ msg: 'selected charity not found' })
      }

      validatedCharityId = charity.id
    }

    if (charity_pct !== undefined) {
      const parsedPct = Number(charity_pct)

      if (Number.isNaN(parsedPct) || parsedPct < 10 || parsedPct > 100) {
        return res.status(400).json({ msg: 'charity contribution must be between 10% and 100%' })
      }

      validatedCharityPct = parsedPct
    }

    const { data: existing, error: existingError } = await db
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingError) throw existingError

    if (existing) {
      return res.status(409).json({ msg: 'email already registered' })
    }

    const hashedPw = await bcrypt.hash(password, 10)

    const { data: newUser, error } = await db
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password: hashedPw,
        charity_id: validatedCharityId,
        charity_pct: validatedCharityPct
      })
      .select('id, name, email, role, charity_id, charity_pct')
      .single()

    if (error) throw error

    const token = signToken(newUser.id)

    res.status(201).json({ token, user: newUser })
  } catch (err) {
    console.error('register error:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ msg: 'email and password required' })
  }

  try {
    const { data: user, error } = await db
      .from('users')
      .select('id, name, email, role, password, charity_id, charity_pct')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (error || !user) {
      return res.status(401).json({ msg: 'invalid email or password' })
    }

    const pwMatch = await bcrypt.compare(password, user.password)
    if (!pwMatch) {
      return res.status(401).json({ msg: 'invalid email or password' })
    }

    const { password: _pw, ...userData } = user

    const token = signToken(user.id)

    res.json({ token, user: userData })
  } catch (err) {
    console.error('login error:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getMe = async (req, res) => {
  // req.user already set by protect middleware, just send it back
  res.json(req.user)
}

const updateMe = async (req, res) => {
  const { name, charity_id, charity_pct } = req.body

  const updates = {}
  if (name !== undefined) updates.name = name
  if (charity_id !== undefined) updates.charity_id = charity_id
  if (charity_pct !== undefined) {
    const parsedPct = Number(charity_pct)

    if (Number.isNaN(parsedPct)) {
      return res.status(400).json({ msg: 'charity contribution must be a number' })
    }

    if (parsedPct < 10) {
      return res.status(400).json({ msg: 'minimum charity contribution is 10%' })
    }

    if (parsedPct > 100) {
      return res.status(400).json({ msg: 'charity contribution cannot exceed 100%' })
    }

    updates.charity_pct = parsedPct
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ msg: 'nothing to update' })
  }

  try {
    const { data: updated, error } = await db
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, role, charity_id, charity_pct')
      .single()

    if (error) throw error

    res.json(updated)
  } catch (err) {
    console.error('updateMe error:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = { register, login, getMe, updateMe }
