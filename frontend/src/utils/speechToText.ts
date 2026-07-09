import { pipeline } from '@xenova/transformers'

let transcriber: any = null

export const initSpeechModel = async () => {
  try {
    if (!transcriber) {
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en')
    }
    return true
  } catch (error) {
    console.error('Failed to load speech model:', error)
    return false
  }
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!transcriber) {
    await initSpeechModel()
  }
  
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioData = new Float32Array(arrayBuffer)
    
    const result = await transcriber(audioData, {
      language: 'zh',
      return_timestamps: false
    })
    
    return result.text || ''
  } catch (error) {
    console.error('Transcription failed:', error)
    return ''
  }
}

export const transcribeAudioFromUrl = async (audioUrl: string): Promise<string> => {
  try {
    const response = await fetch(audioUrl)
    const blob = await response.blob()
    return await transcribeAudio(blob)
  } catch (error) {
    console.error('Failed to fetch and transcribe audio:', error)
    return ''
  }
}