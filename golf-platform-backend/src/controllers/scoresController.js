const db = require('../db')

const sortLatestFiveScores = (items) => {
  if (!Array.isArray(items)) return []

  return [...items]
    .sort((first, second) => {
      const firstPlayed = new Date(first.played_on || 0).getTime()
      const secondPlayed = new Date(second.played_on || 0).getTime()

      if (secondPlayed !== firstPlayed) {
        return secondPlayed - firstPlayed
      }

      const firstCreated = new Date(first.created_at || 0).getTime()
      const secondCreated = new Date(second.created_at || 0).getTime()

      return secondCreated - firstCreated
    })
    .slice(0, 5)
}

const getMyScores = async (req, res) => {
  try {
    const { data, error } = await db
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)

    if (error) throw error

    res.json(sortLatestFiveScores(data))
  } catch (err) {
    console.error('getMyScores:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const addScore = async (req, res) => {
  const { val, played_on } = req.body

  if (!val || !played_on) {
    return res.status(400).json({ msg: 'score value and date are required' })
  }

  if (val < 1 || val > 45) {
    return res.status(400).json({ msg: 'score must be between 1 and 45' })
  }

  try {
    const { data: existingScores, error: existingScoresError } = await db
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)

    if (existingScoresError) throw existingScoresError

    const sortedExistingScores = sortLatestFiveScores(existingScores || [])

    if (sortedExistingScores.length >= 5) {
      const oldestScore = [...sortedExistingScores].reverse()[0]

      if (oldestScore?.id) {
        const { error: deleteOldestError } = await db
          .from('scores')
          .delete()
          .eq('id', oldestScore.id)

        if (deleteOldestError) throw deleteOldestError
      }
    }

    const { data, error } = await db
      .from('scores')
      .insert({
        user_id: req.user.id,
        val: Number(val),
        played_on
      })
      .select()
      .single()

    if (error) throw error

    const { data: persistedScore, error: persistedScoreError } = await db
      .from('scores')
      .select('*')
      .eq('id', data.id)
      .maybeSingle()

    if (persistedScoreError) throw persistedScoreError

    if (!persistedScore) {
      return res.status(500).json({
        msg: 'The score could not be saved right now. Please try again.'
      })
    }

    const retainedScores = sortedExistingScores.length >= 5
      ? sortedExistingScores.slice(0, 4)
      : sortedExistingScores

    const nextScores = sortLatestFiveScores([...retainedScores, persistedScore])

    res.status(201).json({ added: persistedScore, scores: nextScores })
  } catch (err) {
    console.error('addScore:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const editScore = async (req, res) => {
  const { id } = req.params
  const { val, played_on } = req.body

  try {
    const { data: existing } = await db
      .from('scores')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return res.status(404).json({ msg: 'score not found' })
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'not your score' })
    }

    const updates = {}
    if (val !== undefined) {
      const parsedVal = Number(val)

      if (Number.isNaN(parsedVal) || parsedVal < 1 || parsedVal > 45) {
        return res.status(400).json({ msg: 'score must be between 1 and 45' })
      }
      updates.val = parsedVal
    }
    if (played_on) updates.played_on = played_on

    const { data, error } = await db
      .from('scores')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('editScore:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const deleteScore = async (req, res) => {
  const { id } = req.params

  try {
    const { data: existing } = await db
      .from('scores')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return res.status(404).json({ msg: 'score not found' })
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'not your score' })
    }

    const { error } = await db
      .from('scores')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ msg: 'score deleted' })
  } catch (err) {
    console.error('deleteScore:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = { getMyScores, addScore, editScore, deleteScore }
