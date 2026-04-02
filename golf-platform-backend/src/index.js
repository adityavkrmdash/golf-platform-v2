const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/public', require('./routes/public'))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/scores', require('./routes/scores'))
app.use('/api/draws', require('./routes/draws'))
app.use('/api/charities', require('./routes/charities'))
app.use('/api/subscriptions', require('./routes/subscriptions'))
app.use('/api/winners', require('./routes/winners'))
app.use('/api/donations', require('./routes/donations'))
app.use('/api/admin', require('./routes/admin'))

app.get('/', (req, res) => res.send('Golf platform API running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))
