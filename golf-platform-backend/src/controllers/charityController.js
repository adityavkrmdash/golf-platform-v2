const db = require('../db')

const getAllCharities = async (req, res) => {
  try {
    const { data, error } = await db
      .from('charities')
      .select('*')
      .order('featured', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getAllCharities:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getOneCharity = async (req, res) => {
  try {
    const { data, error } = await db
      .from('charities')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ msg: 'charity not found' })

    res.json(data)
  } catch (err) {
    console.error('getOneCharity:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const createCharity = async (req, res) => {
  const { name, description, image_url, featured, events } = req.body

  if (!name) return res.status(400).json({ msg: 'name is required' })

  try {
    const { data, error } = await db
      .from('charities')
      .insert({
        name,
        description: description || null,
        image_url: image_url || null,
        featured: featured || false,
        events: events || []
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    console.error('createCharity:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const updateCharity = async (req, res) => {
  const { name, description, image_url, featured, events } = req.body

  const updates = {}
  if (name) updates.name = name
  if (description !== undefined) updates.description = description
  if (image_url !== undefined) updates.image_url = image_url
  if (featured !== undefined) updates.featured = featured
  if (events !== undefined) updates.events = events

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ msg: 'nothing to update' })
  }

  try {
    const { data: existing } = await db
      .from('charities')
      .select('id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ msg: 'charity not found' })

    const { data, error } = await db
      .from('charities')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('updateCharity:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const deleteCharity = async (req, res) => {
  try {
    const { data: existing } = await db
      .from('charities')
      .select('id')
      .eq('id', req.params.id)
      .single()

    if (!existing) return res.status(404).json({ msg: 'charity not found' })

    const { error } = await db
      .from('charities')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error

    res.json({ msg: 'charity deleted' })
  } catch (err) {
    console.error('deleteCharity:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

const getFeatured = async (req, res) => {
  try {
    const { data, error } = await db
      .from('charities')
      .select('*')
      .eq('featured', true)
      .limit(3)

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('getFeatured:', err.message)
    res.status(500).json({ msg: 'something went wrong' })
  }
}

module.exports = {
  getAllCharities,
  getOneCharity,
  createCharity,
  updateCharity,
  deleteCharity,
  getFeatured
}