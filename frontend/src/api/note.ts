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
  sourceType?: 'text' | 'image' | 'mixed';
  sourceFiles?: { name: string; url: string; type: string }[];
  imageUrls?: string[];
  knowledgePoints?: any[];
}) => api.post('/notes', data)
export const updateNote = (id: string, data: {
  course?: string;
  title?: string;
  content?: string;
  tags?: string[];
  summary?: string;
  sourceType?: 'text' | 'image' | 'mixed';
  sourceFiles?: { name: string; url: string; type: string }[];
  imageUrls?: string[];
  knowledgePoints?: any[];
}) => api.put(`/notes/${id}`, data)
export const deleteNote = (id: string) => api.delete(`/notes/${id}`)
export const uploadFile = (formData: FormData) => api.post('/notes/upload-file', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const uploadImage = (formData: FormData) => api.post('/notes/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
