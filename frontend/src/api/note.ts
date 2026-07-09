import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export const getNotes = () => api.get('/notes')
export const getNote = (id: string) => api.get(`/notes/${id}`)
export const createNote = (data: {
  course: string;
  title: string;
  content: string;
  tags: string[];
  summary?: string;
  audioUrl?: string;
  transcription?: string;
  imageUrls?: string[];
  knowledgePoints?: any[];
  questions?: any[];
}) => api.post('/notes', data)
export const updateNote = (id: string, data: {
  course?: string;
  title?: string;
  content?: string;
  tags?: string[];
  summary?: string;
  imageUrls?: string[];
  knowledgePoints?: any[];
  questions?: any[];
}) => api.put(`/notes/${id}`, data)
export const deleteNote = (id: string) => api.delete(`/notes/${id}`)
export const generateNoteSummary = (id: string) => api.post(`/notes/${id}/summary`)
export const extractNoteKnowledge = (id: string) => api.post(`/notes/${id}/knowledge`)
export const generateNoteQuestions = (id: string, count?: number) => api.post(`/notes/${id}/questions`, { count })
export const generateSummaryFromContent = (content: string) => api.post('/notes/generate-summary', { content })
export const extractKnowledgeFromContent = (content: string) => api.post('/notes/generate-knowledge', { content })
export const generateQuestionsFromContent = (content: string, count = 5) => api.post('/notes/generate-questions', { content, count })
export const uploadAudio = (formData: FormData) => api.post('/notes/upload-audio', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const processAudio = (audioPath: string, course: string) => api.post('/notes/process-audio', { audioPath, course })
export const uploadImage = (formData: FormData) => api.post('/notes/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
