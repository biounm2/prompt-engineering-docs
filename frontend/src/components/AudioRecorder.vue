<template>
  <div class="audio-recorder">
    <div v-if="modelLoading" class="model-loading">
      <el-spinner />
      <span>正在加载语音识别模型...</span>
    </div>
    
    <div v-else class="recording-area">
      <div class="recording-status">
        <span v-if="!isRecording && !audioBlob">点击下方按钮开始录音</span>
        <span v-else-if="isRecording" class="recording">正在录音... {{ formatTime(duration) }}</span>
        <span v-else-if="transcription">语音转文字完成</span>
        <span v-else>录音已完成，时长：{{ formatTime(duration) }}</span>
      </div>
      
      <div class="recorder-controls">
        <button 
          v-if="!isRecording && !audioBlob" 
          class="btn-record" 
          @click="startRecording"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ff4757">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span>开始录音</span>
        </button>
        
        <button 
          v-else-if="isRecording" 
          class="btn-stop" 
          @click="stopRecording"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#2ed573">
            <rect x="8" y="8" width="8" height="8" />
          </svg>
          <span>停止录音</span>
        </button>
        
        <button 
          v-else 
          class="btn-play" 
          @click="playRecording"
          :disabled="!audioBlob"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#3742fa">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          <span>{{ isPlaying ? '暂停' : '播放' }}</span>
        </button>
      </div>
      
      <div v-if="audioBlob && !isRecording && !isPlaying" class="transcription-section">
        <button 
          class="btn-transcribe" 
          @click="transcribeAudio"
          :disabled="transcribing"
        >
          {{ transcribing ? '正在转写...' : '语音转文字' }}
        </button>
        
        <div v-if="transcription" class="transcription-content">
          <h4>转写结果</h4>
          <textarea v-model="transcription" :rows="5" placeholder="转写内容..." />
        </div>
      </div>
      
      <button 
        v-if="audioBlob && !isRecording" 
        class="btn-upload" 
        @click="processTranscription"
        :disabled="!transcription || processing"
      >
        {{ processing ? 'AI处理中...' : 'AI总结并生成笔记' }}
      </button>
      
      <button 
        v-if="audioBlob && !isRecording" 
        class="btn-reset" 
        @click="resetRecording"
      >
        重新录音
      </button>
      
      <div v-if="processing" class="upload-progress">
        <el-progress :percentage="progressPercentage" :stroke-width="20" />
        <span>{{ progressMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { initSpeechModel, transcribeAudio as transcribeAudioBlob } from '../utils/speechToText'
import { createNote } from '../api/note'

const emit = defineEmits<{
  (e: 'processingComplete', noteId: string): void
  (e: 'progress', progress: { step: string; message: string; data?: any }): void
}>()

const isRecording = ref(false)
const isPlaying = ref(false)
const audioBlob = ref<Blob | null>(null)
const audioUrl = ref('')
const duration = ref(0)
const transcription = ref('')
const transcribing = ref(false)
const processing = ref(false)
const modelLoading = ref(true)
const progressPercentage = ref(0)
const progressMessage = ref('')

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let timer: number | null = null
let audioElement: HTMLAudioElement | null = null

onMounted(async () => {
  await initSpeechModel()
  modelLoading.value = false
})

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }
    
    mediaRecorder.onstop = () => {
      audioBlob.value = new Blob(audioChunks, { type: 'audio/wav' })
      audioUrl.value = URL.createObjectURL(audioBlob.value)
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.start()
    isRecording.value = true
    duration.value = 0
    
    timer = window.setInterval(() => {
      duration.value++
    }, 1000)
    
  } catch (err) {
    console.error('无法访问麦克风:', err)
    alert('请允许访问麦克风以进行录音')
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

const playRecording = () => {
  if (!audioUrl.value) return
  
  if (isPlaying.value) {
    audioElement?.pause()
    isPlaying.value = false
  } else {
    audioElement = new Audio(audioUrl.value)
    audioElement.play()
    isPlaying.value = true
    audioElement.onended = () => {
      isPlaying.value = false
    }
  }
}

const resetRecording = () => {
  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
  audioBlob.value = null
  audioUrl.value = ''
  duration.value = 0
  isPlaying.value = false
  transcription.value = ''
}

const transcribeAudio = async () => {
  if (!audioBlob.value) return
  
  transcribing.value = true
  progressMessage.value = '正在语音转文字...'
  
  try {
    const text = await transcribeAudioBlob(audioBlob.value)
    transcription.value = text || '未能识别出语音内容，请重试'
  } catch (error) {
    console.error('语音转文字失败:', error)
    transcription.value = '语音转文字失败，请重试'
  } finally {
    transcribing.value = false
  }
}

const processTranscription = async () => {
  if (!transcription.value) return
  
  processing.value = true
  progressPercentage.value = 0
  progressMessage.value = '开始AI处理...'
  
  try {
    const course = (document.querySelector('[name="course"]') as HTMLInputElement)?.value || '未指定课程'
    
    progressPercentage.value = 25
    progressMessage.value = '正在生成总结...'
    
    const summaryResponse = await fetch('/api/notes/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: transcription.value })
    })
    const { summary } = await summaryResponse.json()
    
    progressPercentage.value = 50
    progressMessage.value = '正在提取知识点...'
    
    const knowledgeResponse = await fetch('/api/notes/generate-knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: transcription.value })
    })
    const { knowledgePoints } = await knowledgeResponse.json()
    
    progressPercentage.value = 75
    progressMessage.value = '正在生成练习题...'
    
    const questionsResponse = await fetch('/api/notes/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: transcription.value })
    })
    const { questions } = await questionsResponse.json()
    
    progressPercentage.value = 90
    progressMessage.value = '正在保存笔记...'
    
    const noteResponse = await createNote({
      course,
      title: `${course} - ${new Date().toLocaleDateString()}`,
      content: transcription.value,
      tags: [],
      summary,
      knowledgePoints,
      questions
    })
    
    progressPercentage.value = 100
    progressMessage.value = '处理完成！'
    
    if (noteResponse.data) {
      emit('processingComplete', noteResponse.data._id)
    }
    
  } catch (error) {
    console.error('AI处理失败:', error)
    alert('AI处理失败，请重试')
  } finally {
    processing.value = false
  }
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.audio-recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  margin-bottom: 20px;
}

.model-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 40px;
}

.model-loading span {
  font-size: 16px;
  color: #666;
}

.recording-area {
  width: 100%;
}

.recording-status {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
  min-height: 24px;
  text-align: center;
}

.recording-status .recording {
  color: #ff4757;
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recorder-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.recorder-controls button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 25px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recorder-controls button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.recorder-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.recorder-controls button span {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.btn-record {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
}

.btn-stop {
  background: linear-gradient(135deg, #2ed573 0%, #1dd1a1 100%);
}

.btn-play {
  background: linear-gradient(135deg, #5352ed 0%, #3742fa 100%);
}

.transcription-section {
  width: 100%;
  max-width: 600px;
  margin: 0 auto 20px;
}

.btn-transcribe {
  width: 100%;
  padding: 12px 30px;
  background: linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 15px;
}

.btn-transcribe:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-transcribe:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.transcription-content {
  background: white;
  border-radius: 10px;
  padding: 15px;
}

.transcription-content h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.transcription-content textarea {
  width: 100%;
  min-height: 100px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  resize: vertical;
}

.btn-upload {
  padding: 12px 30px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 10px;
}

.btn-upload:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-upload:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-reset {
  padding: 10px 20px;
  background: transparent;
  color: #666;
  border: 1px solid #ccc;
  border-radius: 30px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: #f0f0f0;
}

.upload-progress {
  width: 100%;
  max-width: 400px;
  margin-top: 20px;
  text-align: center;
}

.upload-progress span {
  display: block;
  margin-top: 10px;
  font-size: 14px;
  color: #333;
}
</style>
