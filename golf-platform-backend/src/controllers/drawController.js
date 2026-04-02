const db = require('../db')
const { sendEmail } = require('../services/mailer')
const { drawResultTemplate } = require('../services/emailTemplates')

const getLatestSubscription = (subscriptions) => {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return null
  }

  return [...subscriptions].sort((a, b) => {
    const first = new Date(a.created_at || a.renews_at || 0).getTime()
    const second = new Date(b.created_at || b.renews_at || 0).getTime()
    return second - first
  })[0]
}

const monthNameFromNumber = (value) => {
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

  return months[Number(value) - 1] || `Month ${value}`
}

const selectLatestFiveScores = (scores) => {
  return [...scores]
    .sort((a, b) => {
      const playedDiff =
        new Date(b.played_on || 0).getTime() - new Date(a.played_on || 0).getTime()

      if (playedDiff !== 0) return playedDiff

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
    .slice(0, 5)
}

const normalizeDrawNumbers = (numbers) => {
  if (!Array.isArray(numbers)) return []

  return numbers
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value))
}

const normalizeMonth = (value) => {
  if (value === undefined || value === null) return null

  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 && value <= 12 ? value : null
  }

  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    const parsed = Number(raw)
    return parsed >= 1 && parsed <= 12 ? parsed : null
  }

  const monthMap = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
  }

  return monthMap[raw.toLowerCase()] || null
}

const getDraws = async (req, res) => {
  try {
    const { data, error } = await db
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getDraws:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getOneDraw = async (req, res) => {
  try {
    const { data, error } = await db
      .from('draws')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ msg: 'draw not found' })
    }

    res.json(data)
  } catch (err) {
    console.error('getOneDraw:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const createDraw = async (req, res) => {
  const { month, year, draw_type } = req.body

  const normalizedMonth = normalizeMonth(month)
  const normalizedYear = Number(year)

  if (!normalizedMonth || Number.isNaN(normalizedYear)) {
    return res.status(400).json({ msg: 'month and year are required' })
  }

  if (normalizedYear < 2024 || normalizedYear > 2100) {
    return res.status(400).json({ msg: 'enter a valid year' })
  }

  try {
    const { data: existing, error: existingError } = await db
      .from('draws')
      .select('id')
      .eq('month', normalizedMonth)
      .eq('year', normalizedYear)
      .maybeSingle()

    if (existingError) throw existingError

    if (existing) {
      return res.status(409).json({ msg: 'draw for this month already exists' })
    }

    const { data, error } = await db
      .from('draws')
      .insert({
        month: normalizedMonth,
        year: normalizedYear,
        draw_type: draw_type || 'random',
        status: 'draft'
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    console.error('createDraw:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const generateRandom = () => {
  const nums = new Set()

  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1)
  }

  return Array.from(nums).sort((a, b) => a - b)
}

const generateAlgo = async () => {
  const { data: allScores } = await db
    .from('scores')
    .select('val')

  if (!allScores || allScores.length === 0) {
    return generateRandom()
  }

  const freq = {}

  allScores.forEach((score) => {
    freq[score.val] = (freq[score.val] || 0) + 1
  })

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => parseInt(entry[0], 10))

  const picked = new Set()

  for (const num of sorted) {
    if (picked.size >= 5) break
    picked.add(num)
  }

  while (picked.size < 5) {
    picked.add(Math.floor(Math.random() * 45) + 1)
  }

  return Array.from(picked).sort((a, b) => a - b)
}

const simulateDraw = async (req, res) => {
  try {
    const { data: draw, error } = await db
      .from('draws')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !draw) {
      return res.status(404).json({ msg: 'draw not found' })
    }

    if (draw.status === 'published') {
      return res.status(400).json({ msg: 'draw already published' })
    }

    const numbers = draw.draw_type === 'algo'
      ? await generateAlgo()
      : generateRandom()

    const { data: updated, error: updateErr } = await db
      .from('draws')
      .update({ numbers, status: 'simulated' })
      .eq('id', draw.id)
      .select()
      .single()

    if (updateErr) throw updateErr

    res.json({ msg: 'simulation done', draw: updated, numbers })
  } catch (err) {
    console.error('simulateDraw:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const matchNumbers = (userScores, winningNums) => {
  const userSet = new Set(
    userScores
      .map((score) => Number(score.val))
      .filter((value) => !Number.isNaN(value))
  )
  const matched = normalizeDrawNumbers(winningNums).filter((num) => userSet.has(num))
  return matched.length
}

const publishDraw = async (req, res) => {
  try {
    const { data: draw, error } = await db
      .from('draws')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !draw) {
      return res.status(404).json({ msg: 'draw not found' })
    }

    if (draw.status === 'published') {
      return res.status(400).json({ msg: 'already published' })
    }

    if (draw.status === 'draft') {
      return res.status(400).json({ msg: 'simulate before publishing' })
    }

    const winningNums = normalizeDrawNumbers(draw.numbers)

    const { data: userSubscriptions, error: userSubscriptionsError } = await db
      .from('users')
      .select('id, subscriptions(user_id, status, created_at, renews_at)')

    if (userSubscriptionsError) throw userSubscriptionsError

    const activeSubscribers = (userSubscriptions || []).filter((user) => {
      const latestSubscription = getLatestSubscription(user.subscriptions)
      return latestSubscription?.status === 'active'
    })

    if (activeSubscribers.length === 0) {
      return res.status(400).json({ msg: 'no active subscribers' })
    }

    const subUserIds = activeSubscribers.map((user) => user.id)

    const { data: allScores } = await db
      .from('scores')
      .select('user_id, val, played_on, created_at')
      .in('user_id', subUserIds)

    const scoresByUser = {}

    ;(allScores || []).forEach((score) => {
      if (!scoresByUser[score.user_id]) {
        scoresByUser[score.user_id] = []
      }
      scoresByUser[score.user_id].push(score)
    })

    const match5 = []
    const match4 = []
    const match3 = []

    subUserIds.forEach((uid) => {
      const userScores = selectLatestFiveScores(scoresByUser[uid] || [])
      const count = matchNumbers(userScores, winningNums)

      if (count === 5) match5.push(uid)
      else if (count === 4) match4.push(uid)
      else if (count === 3) match3.push(uid)
    })

    const totalPool = activeSubscribers.length * (draw.jackpot > 0 ? draw.jackpot : 100)

    let jackpotPool = totalPool * 0.4
    const pool4 = totalPool * 0.35
    const pool3 = totalPool * 0.25

    if (draw.rolled_over) {
      jackpotPool += draw.jackpot
    }

    const winnersToInsert = []

    if (match5.length > 0) {
      const share = jackpotPool / match5.length
      match5.forEach((uid) => {
        winnersToInsert.push({
          draw_id: draw.id,
          user_id: uid,
          match_type: 5,
          prize: share
        })
      })
    }

    if (match4.length > 0) {
      const share = pool4 / match4.length
      match4.forEach((uid) => {
        winnersToInsert.push({
          draw_id: draw.id,
          user_id: uid,
          match_type: 4,
          prize: share
        })
      })
    }

    if (match3.length > 0) {
      const share = pool3 / match3.length
      match3.forEach((uid) => {
        winnersToInsert.push({
          draw_id: draw.id,
          user_id: uid,
          match_type: 3,
          prize: share
        })
      })
    }

    if (winnersToInsert.length > 0) {
      const payload = winnersToInsert.map((winner) => ({
        ...winner,
        verified: 'pending',
        paid: false,
        proof_url: null
      }))

      const { error: winnerInsertError } = await db.from('winners').insert(payload)

      if (winnerInsertError) throw winnerInsertError
    }

    const rolled = match5.length === 0

    await db.from('pool_log').insert({
      draw_id: draw.id,
      total: totalPool,
      m5: jackpotPool,
      m4: pool4,
      m3: pool3,
      sub_count: activeSubscribers.length
    })

    const { data: published } = await db
      .from('draws')
      .update({
        status: 'published',
        rolled_over: rolled,
        jackpot: rolled ? jackpotPool : 0
      })
      .eq('id', draw.id)
      .select()
      .single()

    const { data: usersToNotify } = await db
      .from('users')
      .select('id, name, email')
      .in('id', subUserIds)

    if (usersToNotify?.length) {
      await Promise.all(
        usersToNotify.map(async (user) => {
          const winnerRecord = winnersToInsert.find(
            (item) => item.user_id === user.id
          )

          try {
            await sendEmail({
              to: user.email,
              subject: `Draw results for ${monthNameFromNumber(draw.month)} ${draw.year}`,
              html: drawResultTemplate({
                name: user.name,
                month: monthNameFromNumber(draw.month),
                year: draw.year,
                numbers: winningNums,
                winnerRecord
              })
            })
          } catch (emailErr) {
            console.error(`draw result email failed for user ${user.id}:`, emailErr.message)
          }
        })
      )
    }

    res.json({
      msg: 'draw published',
      draw: published,
      winners: {
        match5: match5.length,
        match4: match4.length,
        match3: match3.length
      },
      jackpot_rolled: rolled
    })
  } catch (err) {
    console.error('publishDraw:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getMyDrawHistory = async (req, res) => {
  try {
    const { data, error } = await db
      .from('winners')
      .select('*, draws(month, year, numbers)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getMyDrawHistory:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = {
  getDraws,
  getOneDraw,
  createDraw,
  simulateDraw,
  publishDraw,
  getMyDrawHistory
}
