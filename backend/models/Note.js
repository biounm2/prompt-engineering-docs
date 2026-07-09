const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['single', 'multiple', 'judge', 'fill', 'short'],
    default: 'single'
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  answer: {
    type: String,
    required: true
  },
  analysis: {
    type: String
  }
})

const knowledgePointSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  importance: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  }
})

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  summary: {
    type: String,
    default: ''
  },
  audioUrl: {
    type: String,
    default: ''
  },
  transcription: {
    type: String,
    default: ''
  },
  imageUrls: [{
    type: String
  }],
  knowledgePoints: [knowledgePointSchema],
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Note', noteSchema)