const mongoose = require('mongoose')

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
  sourceType: {
    type: String,
    enum: ['text', 'image', 'mixed'],
    default: 'text'
  },
  sourceFiles: [{
    name: String,
    url: String,
    type: String
  }],
  imageUrls: [{
    type: String
  }],
  knowledgePoints: [knowledgePointSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Note', noteSchema)
