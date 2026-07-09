require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const noteRoutes = require('./routes/notes')

const app = express()
const PORT = process.env.PORT || 5050
const HOST = process.env.HOST || '127.0.0.1'

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-summary', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err))

app.use('/api/notes', noteRoutes)

const frontendDistPath = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../frontend/dist')
if (fsExists(frontendDistPath)) {
  app.use(express.static(frontendDistPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next()
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`)
})

function fsExists(targetPath) {
  try {
    require('fs').accessSync(targetPath)
    return true
  } catch {
    return false
  }
}
