<template>
  <div class="photo-capture">
    <div class="camera-container">
      <video 
        v-if="stream" 
        ref="videoRef" 
        class="camera-video" 
        autoplay 
        playsinline
      />
      <canvas ref="canvasRef" class="camera-canvas" />
      
      <div v-if="!stream" class="camera-placeholder">
        <el-icon size="64" color="#ccc"><Camera /></el-icon>
        <span>点击下方按钮启动摄像头</span>
      </div>
    </div>
    
    <div class="camera-controls">
      <button 
        v-if="!stream" 
        class="btn-start" 
        @click="startCamera"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
          <polygon points="5,3 19,12 5,21" />
        </svg>
        <span>启动摄像头</span>
      </button>
      
      <button 
        v-else 
        class="btn-capture" 
        @click="capturePhoto"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#ff4757">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
        </svg>
        <span>拍照</span>
      </button>
      
      <button 
        v-if="stream" 
        class="btn-stop" 
        @click="stopCamera"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
          <rect x="6" y="6" width="12" height="12" />
        </svg>
        <span>关闭摄像头</span>
      </button>
    </div>
    
    <div v-if="capturedImages.length > 0" class="captured-images">
      <h4>已拍摄照片</h4>
      <div class="images-grid">
        <div v-for="(img, index) in capturedImages" :key="index" class="image-item">
          <img :src="img" alt="拍摄的照片" />
          <button class="btn-delete" @click="deleteImage(index)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff4757">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      
      <button 
        class="btn-upload" 
        @click="uploadImages"
        :disabled="uploading"
      >
        {{ uploading ? '上传中...' : '上传照片并生成笔记' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Camera } from '@element-plus/icons-vue'
import { uploadImage } from '../api/note'

const emit = defineEmits<{
  (e: 'imagesUploaded', imageUrls: string[]): void
  (e: 'processingComplete', noteId: string): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stream = ref<MediaStream | null>(null)
const capturedImages = ref<string[]>([])
const uploading = ref(false)

const startCamera = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.value = mediaStream
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch (err) {
    console.error('无法访问摄像头:', err)
    alert('请允许访问摄像头以进行拍照')
  }
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
}

const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return
  
  const canvas = canvasRef.value
  const video = videoRef.value
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(video, 0, 0)
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    capturedImages.value.push(imageDataUrl)
  }
}

const deleteImage = (index: number) => {
  capturedImages.value.splice(index, 1)
}

const uploadImages = async () => {
  if (capturedImages.value.length === 0) return
  
  uploading.value = true
  
  try {
    const imageUrls: string[] = []
    
    for (const imageDataUrl of capturedImages.value) {
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('image', blob, `photo-${Date.now()}.jpg`)
      
      const result = await uploadImage(formData)
      if (result.data.success) {
        imageUrls.push(result.data.imageUrl)
      }
    }
    
    emit('imagesUploaded', imageUrls)
    alert(`成功上传 ${imageUrls.length} 张照片`)
    
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.photo-capture {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  margin-bottom: 20px;
}

.camera-container {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  margin-bottom: 20px;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-canvas {
  display: none;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  gap: 15px;
}

.camera-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.camera-controls button {
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

.camera-controls button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.camera-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.camera-controls button span {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.btn-start {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.btn-start span {
  color: white;
}

.btn-capture {
  background: white;
  border: 4px solid #ff4757;
}

.btn-stop {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
}

.btn-stop span {
  color: white;
}

.captured-images {
  width: 100%;
  max-width: 600px;
}

.captured-images h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4/3;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-delete {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 71, 87, 0.8);
  border: none;
  border-radius: 50%;
  padding: 5px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: #ff4757;
}

.btn-upload {
  width: 100%;
  padding: 12px 30px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-upload:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-upload:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
