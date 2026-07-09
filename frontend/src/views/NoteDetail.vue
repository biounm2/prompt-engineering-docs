<template>
  <div class="note-detail">
    <el-button @click="$router.back()" style="margin-bottom: 20px">返回列表</el-button>

    <el-card v-if="note">
      <div class="detail-header">
        <el-tag size="large" type="primary">{{ note.course }}</el-tag>
        <span class="date">{{ formatDate(note.createdAt) }}</span>
      </div>
      <h2 class="detail-title">{{ note.title }}</h2>

      <div class="tags">
        <el-tag v-for="tag in note.tags" :key="tag">{{ tag }}</el-tag>
      </div>

      <div v-if="note.audioUrl" class="audio-section">
        <h3>录音文件</h3>
        <audio :src="note.audioUrl" controls />
      </div>

      <div v-if="note.imageUrls && note.imageUrls.length > 0" class="image-section">
        <h3>图片资料</h3>
        <div class="image-grid">
          <img v-for="url in note.imageUrls" :key="url" :src="url" alt="笔记图片" />
        </div>
      </div>

      <div class="detail-content">
        <h3>笔记内容</h3>
        <p>{{ note.content }}</p>
      </div>

      <div class="summary" v-if="note.summary">
        <h3>AI总结</h3>
        <el-alert :title="note.summary" type="success" show-icon />
      </div>

      <div class="knowledge-section" v-if="note.knowledgePoints && note.knowledgePoints.length > 0">
        <div class="section-header">
          <h3>知识点</h3>
          <el-button v-if="!note.knowledgePoints.length" type="primary" @click="extractKnowledge">提取知识点</el-button>
        </div>
        <el-timeline>
          <el-timeline-item
            v-for="(kp, index) in note.knowledgePoints"
            :key="index"
            :type="getImportanceType(kp.importance)"
          >
            <div class="kp-card">
              <div class="kp-header">
                <span class="kp-title">{{ kp.title }}</span>
                <el-tag :type="getImportanceType(kp.importance)" size="small">
                  {{ getImportanceLabel(kp.importance) }}
                </el-tag>
              </div>
              <div class="kp-content">{{ kp.content }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="questions-section" v-if="note.questions && note.questions.length > 0">
        <div class="section-header">
          <h3>练习题</h3>
          <el-button v-if="!note.questions.length" type="primary" @click="generateQuestions">生成练习题</el-button>
        </div>

        <el-steps :active="currentQuestion" finish-status="success" align-center>
          <el-step
            v-for="(q, index) in note.questions"
            :key="index"
            :title="getQuestionTypeName(q.type)"
          />
        </el-steps>

        <div class="question-container">
          <div v-if="currentQuizQuestion" class="current-question">
            <div class="question-header">
              <span class="question-type">{{ getQuestionTypeName(currentQuizQuestion.type) }}</span>
              <span class="question-number">第{{ currentQuestion + 1 }}/{{ note.questions.length }}题</span>
            </div>
            <div class="question-content">{{ currentQuizQuestion.question }}</div>

            <div v-if="currentQuizQuestion.options && currentQuizQuestion.options.length > 0" class="question-options">
              <div
                v-for="(opt, optIndex) in currentQuizQuestion.options"
                :key="optIndex"
                class="option-item"
                :class="{ 'selected': selectedAnswer === optIndex, 'correct': showAnswer && isCorrectOption(optIndex) }"
                @click="selectOption(optIndex)"
              >
                {{ String.fromCharCode(65 + optIndex) }}. {{ opt }}
              </div>
            </div>

            <div v-if="showAnswer" class="question-result">
              <div class="answer-section">
                <span class="answer-label">正确答案：</span>
                <span class="answer-value">{{ currentQuizQuestion.answer }}</span>
              </div>
              <div v-if="currentQuizQuestion.analysis" class="analysis-section">
                <span class="analysis-label">解析：</span>
                <span>{{ currentQuizQuestion.analysis }}</span>
              </div>
            </div>

            <div class="question-actions">
              <button v-if="!showAnswer" class="btn-submit" @click="submitAnswer">提交答案</button>
              <button v-if="showAnswer" class="btn-next" @click="nextQuestion">下一题</button>
            </div>
          </div>

          <div v-else class="quiz-complete">
            <el-alert title="恭喜！你已完成所有练习题" type="success" show-icon />
            <div class="score-display">
              <span class="score-label">得分：</span>
              <span class="score-value">{{ score }}/{{ note.questions.length * 20 }}</span>
            </div>
            <el-button type="primary" @click="resetQuiz">重新做题</el-button>
          </div>
        </div>
      </div>

      <div class="actions">
        <el-button type="primary" @click="generateSummary">生成总结</el-button>
        <el-button type="warning" @click="editNote">编辑</el-button>
        <el-button type="danger" @click="deleteNote">删除</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getNote, generateNoteSummary, extractNoteKnowledge, generateNoteQuestions, deleteNote as deleteNoteApi } from '../api/note'

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

interface Note {
  _id: string
  title: string
  content: string
  course: string
  tags: string[]
  summary: string
  audioUrl: string
  transcription: string
  imageUrls: string[]
  knowledgePoints: KnowledgePoint[]
  questions: Question[]
  createdAt: string
}

const route = useRoute()
const note = ref<Note | null>(null)
const currentQuestion = ref(0)
const selectedAnswer = ref<number | null>(null)
const showAnswer = ref(false)
const score = ref(0)
const currentQuizQuestion = computed(() => note.value?.questions?.[currentQuestion.value])

onMounted(async () => {
  const id = route.params.id as string
  const response = await getNote(id)
  note.value = response.data
})

const generateSummary = async () => {
  if (!note.value) return
  const response = await generateNoteSummary(note.value._id)
  note.value!.summary = response.data.summary
}

const extractKnowledge = async () => {
  if (!note.value) return
  const response = await extractNoteKnowledge(note.value._id)
  note.value!.knowledgePoints = response.data.knowledgePoints
}

const generateQuestions = async () => {
  if (!note.value) return
  const response = await generateNoteQuestions(note.value._id)
  note.value!.questions = response.data.questions
  resetQuiz()
}

const editNote = () => {
  if (!note.value) return
}

const deleteNote = async () => {
  if (!note.value) return
  await deleteNoteApi(note.value._id)
  window.location.href = '/'
}

const selectOption = (index: number) => {
  if (showAnswer.value) return
  selectedAnswer.value = index
}

const submitAnswer = () => {
  if (selectedAnswer.value === null) return

  const currentQ = currentQuizQuestion.value
  if (!currentQ) return
  const selectedOption = currentQ.options?.[selectedAnswer.value]

  if (selectedOption && currentQ.answer.includes(String.fromCharCode(65 + selectedAnswer.value))) {
    score.value += 20
  }

  showAnswer.value = true
}

const nextQuestion = () => {
  currentQuestion.value++
  selectedAnswer.value = null
  showAnswer.value = false
}

const resetQuiz = () => {
  currentQuestion.value = 0
  selectedAnswer.value = null
  showAnswer.value = false
  score.value = 0
}

const isCorrectOption = (index: number) => {
  const currentQ = currentQuizQuestion.value
  if (!currentQ) return false
  return currentQ.answer.includes(String.fromCharCode(65 + index))
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const getImportanceType = (importance: string) => {
  switch (importance) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

const getImportanceLabel = (importance: string) => {
  switch (importance) {
    case 'high': return '重要'
    case 'medium': return '一般'
    case 'low': return '了解'
    default: return '一般'
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
.note-detail {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.date {
  font-size: 14px;
  color: #999;
}

.detail-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}

.audio-section {
  margin-bottom: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.audio-section h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.image-section {
  margin-bottom: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.image-section h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.image-grid img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 8px;
}

.detail-content {
  margin-bottom: 30px;
}

.detail-content h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #333;
}

.detail-content p {
  font-size: 16px;
  line-height: 1.8;
  color: #666;
}

.summary {
  margin-bottom: 30px;
}

.summary h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #333;
}

.knowledge-section, .questions-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 20px;
  color: #333;
}

.kp-card {
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.kp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.kp-title {
  font-weight: bold;
  font-size: 16px;
}

.kp-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.question-container {
  margin-top: 20px;
}

.current-question {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-type {
  font-weight: bold;
  color: #409eff;
}

.question-number {
  font-size: 14px;
  color: #666;
}

.question-content {
  font-size: 18px;
  margin-bottom: 20px;
  color: #333;
}

.question-options {
  margin-bottom: 20px;
}

.option-item {
  padding: 12px 15px;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #409eff;
}

.option-item.selected {
  border-color: #409eff;
  background: #e6f7ff;
}

.option-item.correct {
  border-color: #67c23a;
  background: #f0f9eb;
}

.question-result {
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

.answer-section, .analysis-section {
  margin-bottom: 10px;
  font-size: 15px;
}

.answer-label, .analysis-label {
  font-weight: bold;
  color: #67c23a;
}

.answer-value {
  font-weight: bold;
}

.question-actions {
  display: flex;
  gap: 10px;
}

.btn-submit, .btn-next {
  padding: 10px 30px;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-submit {
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
  color: white;
}

.btn-next {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.quiz-complete {
  text-align: center;
  padding: 40px;
  background: #f0f9eb;
  border-radius: 10px;
}

.score-display {
  margin: 20px 0;
  font-size: 24px;
}

.score-label {
  font-weight: bold;
}

.score-value {
  font-weight: bold;
  color: #67c23a;
  font-size: 32px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}
</style>
