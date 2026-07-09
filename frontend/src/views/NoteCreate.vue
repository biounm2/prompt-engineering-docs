<template>
  <div class="note-create">
    <el-button @click="$router.back()" style="margin-bottom: 20px">返回列表</el-button>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="录音笔记" name="audio">
        <AudioRecorder
          @processing-complete="handleProcessingComplete"
          @progress="handleProgress"
        />

        <div v-if="processingResult" class="processing-result">
          <h3>处理结果预览</h3>
          <el-alert title="笔记已创建成功" type="success" show-icon />
          <el-button type="primary" @click="viewNote(processingResult)">查看笔记详情</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="拍照笔记" name="photo">
        <PhotoCapture
          @images-uploaded="handleImagesUploaded"
        />

        <div v-if="uploadedImages.length > 0" class="photo-note-form">
          <el-form ref="photoFormRef" label-width="80px">
            <el-form-item label="课程名称">
              <el-input v-model="photoForm.course" placeholder="请输入课程名称" />
            </el-form-item>
            <el-form-item label="笔记标题">
              <el-input v-model="photoForm.title" placeholder="请输入笔记标题" />
            </el-form-item>
            <el-form-item label="笔记内容">
              <el-input v-model="photoForm.content" type="textarea" :rows="5" placeholder="请输入笔记内容（或基于照片描述）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="savePhotoNote">保存笔记</el-button>
              <el-button @click="generatePhotoSummary">AI自动总结</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="手动输入" name="manual">
        <el-form ref="formRef" :model="form" label-width="80px">
          <el-form-item label="课程名称" required>
            <el-input v-model="form.course" placeholder="请输入课程名称" />
          </el-form-item>
          <el-form-item label="笔记标题" required>
            <el-input v-model="form.title" placeholder="请输入笔记标题" />
          </el-form-item>
          <el-form-item label="笔记内容" required>
            <el-input v-model="form.content" type="textarea" :rows="10" placeholder="请输入笔记内容" />
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="form.tags" multiple placeholder="请选择标签" @change="handleTagChange">
              <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
            </el-select>
            <el-input v-model="newTag" placeholder="添加新标签" style="margin-top: 10px">
              <template #append>
                <el-button @click="addTag">添加</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">保存笔记</el-button>
            <el-button @click="generateSummary">AI自动总结</el-button>
            <el-button @click="extractKnowledge">提取知识点</el-button>
            <el-button @click="generateQuestions">生成练习题</el-button>
          </el-form-item>
        </el-form>

        <div v-if="form.summary" class="result-section">
          <h3>AI总结</h3>
          <el-alert :title="form.summary" type="success" show-icon />
        </div>

        <div v-if="knowledgePoints.length > 0" class="result-section">
          <h3>知识点</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(kp, index) in knowledgePoints"
              :key="index"
              :type="getImportanceType(kp.importance)"
            >
              <div class="kp-title">{{ kp.title }}</div>
              <div class="kp-content">{{ kp.content }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div v-if="questions.length > 0" class="result-section">
          <h3>练习题</h3>
          <div v-for="(q, index) in questions" :key="index" class="question-card">
            <div class="question-header">
              <span class="question-type">{{ getQuestionTypeName(q.type) }}第{{ index + 1 }}题</span>
            </div>
            <div class="question-content">{{ q.question }}</div>
            <div v-if="q.options && q.options.length > 0" class="question-options">
              <div v-for="(opt, optIndex) in q.options" :key="optIndex" class="option-item">
                {{ String.fromCharCode(65 + optIndex) }}. {{ opt }}
              </div>
            </div>
            <div class="question-answer">
              <span class="answer-label">答案：</span>
              <span>{{ q.answer }}</span>
            </div>
            <div v-if="q.analysis" class="question-analysis">
              <span class="analysis-label">解析：</span>
              <span>{{ q.analysis }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AudioRecorder from '../components/AudioRecorder.vue'
import PhotoCapture from '../components/PhotoCapture.vue'
import {
  createNote,
  extractKnowledgeFromContent,
  generateQuestionsFromContent,
  generateSummaryFromContent
} from '../api/note'

interface KnowledgePoint {
  title: string
  content: string
  importance: string
}

interface Question {
  type: string
  question: string
  options?: string[]
  answer: string
  analysis?: string
}

const activeTab = ref('audio')
const formRef = ref()
const photoFormRef = ref()
const newTag = ref('')
const availableTags = ref(['数学', '英语', '物理', '化学', '计算机', '历史', '地理'])
const knowledgePoints = ref<KnowledgePoint[]>([])
const questions = ref<Question[]>([])
const processingResult = ref<string | null>(null)
const uploadedImages = ref<string[]>([])

const form = reactive({
  course: '',
  title: '',
  content: '',
  tags: [] as string[],
  summary: ''
})

const photoForm = reactive({
  course: '',
  title: '',
  content: ''
})

const handleTagChange = () => {}

const addTag = () => {
  if (newTag.value && !availableTags.value.includes(newTag.value)) {
    availableTags.value.push(newTag.value)
    form.tags.push(newTag.value)
    newTag.value = ''
  }
}

const submitForm = async () => {
  const response = await createNote({
    ...form,
    knowledgePoints: knowledgePoints.value,
    questions: questions.value
  })
  if (response.data) {
    window.location.href = '/'
  }
}

const savePhotoNote = async () => {
  const response = await createNote({
    course: photoForm.course || '未指定课程',
    title: photoForm.title || `${photoForm.course} - ${new Date().toLocaleDateString()}`,
    content: photoForm.content || '图片笔记',
    tags: [],
    summary: '',
    imageUrls: uploadedImages.value
  })
  if (response.data) {
    window.location.href = '/'
  }
}

const generatePhotoSummary = async () => {
  if (!photoForm.content) {
    alert('请先输入笔记内容')
    return
  }
  const response = await generateSummaryFromContent(photoForm.content)
  photoForm.content = response.data.summary
}

const generateSummary = async () => {
  if (!form.content) {
    alert('请先输入笔记内容')
    return
  }
  const response = await generateSummaryFromContent(form.content)
  form.summary = response.data.summary
}

const extractKnowledge = async () => {
  if (!form.content) {
    alert('请先输入笔记内容')
    return
  }
  const response = await extractKnowledgeFromContent(form.content)
  knowledgePoints.value = response.data.knowledgePoints
}

const generateQuestions = async () => {
  if (!form.content) {
    alert('请先输入笔记内容')
    return
  }
  const response = await generateQuestionsFromContent(form.content)
  questions.value = response.data.questions
}

const handleImagesUploaded = (imageUrls: string[]) => {
  uploadedImages.value = imageUrls
}

const handleProcessingComplete = (noteId: string) => {
  processingResult.value = noteId
}

const handleProgress = (progress: { step: string; message: string; data?: any }) => {
  console.log('处理进度:', progress)
}

const viewNote = (noteId: string) => {
  window.location.href = `/note/${noteId}`
}

const getImportanceType = (importance: string) => {
  switch (importance) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

const getQuestionTypeName = (type: string) => {
  switch (type) {
    case 'single': return '单选题'
    case 'multiple': return '多选题'
    case 'judge': return '判断题'
    case 'fill': return '填空题'
    case 'short': return '简答题'
    default: return '未知题型'
  }
}
</script>

<style scoped>
.note-create {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.processing-result {
  margin-top: 20px;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 10px;
}

.processing-result h3 {
  margin-bottom: 15px;
}

.result-section {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.result-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.kp-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.kp-content {
  font-size: 14px;
  color: #666;
}

.question-card {
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px solid #e9ecef;
}

.question-header {
  margin-bottom: 10px;
}

.question-type {
  font-weight: bold;
  color: #409eff;
}

.question-content {
  font-size: 16px;
  margin-bottom: 10px;
  color: #333;
}

.question-options {
  margin-bottom: 10px;
}

.option-item {
  padding: 5px 0;
  font-size: 14px;
}

.question-answer {
  margin-bottom: 5px;
  font-size: 14px;
}

.answer-label {
  font-weight: bold;
  color: #67c23a;
}

.question-analysis {
  font-size: 14px;
  color: #666;
  padding-top: 5px;
  border-top: 1px dashed #ddd;
}

.analysis-label {
  font-weight: bold;
}
</style>
