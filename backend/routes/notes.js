const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Note = require('../models/Note')
const doubao = require('../utils/doubao')

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

const upload = multer({ storage: storage })

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
    imageUrls: req.body.imageUrls || [],
    knowledgePoints: req.body.knowledgePoints || [],
    questions: req.body.questions || []
  })

  try {
    const savedNote = await note.save()
    res.status(201).json(savedNote)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' })
    }

    const audioUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      audioUrl,
      filename: req.file.filename,
      path: req.file.path
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/process-audio', async (req, res) => {
  const { audioPath, course } = req.body

  if (!audioPath) {
    return res.status(400).json({ message: 'audioPath is required' })
  }

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    const sendProgress = (step, message, data = {}) => {
      res.write(`data: ${JSON.stringify({ step, message, data })}\n\n`)
    }

    sendProgress('transcribing', '正在进行语音转文字...')
    const transcription = await doubao.speechToText(audioPath)

    if (!transcription) {
      sendProgress('error', '语音转文字失败，请重试')
      res.end()
      return
    }

    sendProgress('transcribed', '语音转文字完成', { transcription })

    sendProgress('summarizing', '正在生成总结...')
    const summary = await doubao.summarize(transcription)
    sendProgress('summarized', '总结生成完成', { summary })

    sendProgress('extracting', '正在提取知识点...')
    const knowledgePoints = await doubao.extractKnowledgePoints(transcription)
    sendProgress('extracted', '知识点提取完成', { knowledgePoints })

    sendProgress('generating', '正在生成练习题...')
    const questions = await doubao.generateQuestions(transcription, 5)
    sendProgress('generated', '练习题生成完成', { questions })

    const note = new Note({
      title: `${course} - ${new Date().toLocaleDateString()}`,
      content: transcription,
      course: course,
      tags: [],
      summary: summary,
      audioUrl: `/uploads/${path.basename(audioPath)}`,
      transcription: transcription,
      knowledgePoints: knowledgePoints,
      questions: questions
    })

    const savedNote = await note.save()

    sendProgress('completed', '处理完成', { noteId: savedNote._id, note: savedNote })
    res.end()

  } catch (err) {
    console.error('处理音频失败:', err)
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

router.post('/:id/summary', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }

    const summary = await doubao.summarize(note.content)
    note.summary = summary
    await note.save()

    res.json({ summary })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/knowledge', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }

    const knowledgePoints = await doubao.extractKnowledgePoints(note.content)
    note.knowledgePoints = knowledgePoints
    await note.save()

    res.json({ knowledgePoints })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/questions', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({ message: 'Note not found' })
    }

    const questions = await doubao.generateQuestions(note.content, req.body.count || 5)
    note.questions = questions
    await note.save()

    res.json({ questions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/generate-summary', async (req, res) => {
  try {
    const { content } = req.body
    if (!content) {
      return res.status(400).json({ message: 'content is required' })
    }

    const summary = await doubao.summarize(content)
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/generate-knowledge', async (req, res) => {
  try {
    const { content } = req.body
    if (!content) {
      return res.status(400).json({ message: 'content is required' })
    }

    const knowledgePoints = await doubao.extractKnowledgePoints(content)
    res.json({ knowledgePoints })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/generate-questions', async (req, res) => {
  try {
    const { content, count = 5 } = req.body
    if (!content) {
      return res.status(400).json({ message: 'content is required' })
    }

    const questions = await doubao.generateQuestions(content, count)
    res.json({ questions })
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
      path: req.file.path
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
