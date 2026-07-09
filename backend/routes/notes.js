const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Note = require('../models/Note')

const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
})

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 })
    res.json(notes)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }
    res.json(note)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  const note = new Note({
    title: req.body.title,
    content: req.body.content,
    course: req.body.course,
    tags: req.body.tags || [],
    summary: req.body.summary || '',
    audioUrl: req.body.audioUrl || '',
    transcription: req.body.transcription || '',
    sourceType: req.body.sourceType || 'text',
    sourceFiles: req.body.sourceFiles || [],
    imageUrls: req.body.imageUrls || [],
    knowledgePoints: req.body.knowledgePoints || []
  })

  try {
    const savedNote = await note.save()
    res.status(201).json(savedNote)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      type: req.file.mimetype
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }
    res.json(note)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id)
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }
    res.json({ message: 'Note deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' })
    }

    const imageUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      type: req.file.mimetype
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
