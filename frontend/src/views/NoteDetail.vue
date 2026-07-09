<template>
  <div class="note-detail">
    <el-button @click="$router.back()" style="margin-bottom: 20px">返回列表</el-button>

    <el-card v-if="note">
      <div class="detail-header">
        <div>
          <el-tag size="large" type="primary">{{ note.course }}</el-tag>
          <h2 class="detail-title">{{ note.title }}</h2>
        </div>
        <span class="date">{{ formatDate(note.createdAt) }}</span>
      </div>

      <div class="tags">
        <el-tag v-for="tag in note.tags" :key="tag">{{ tag }}</el-tag>
      </div>

      <div v-if="note.sourceFiles && note.sourceFiles.length > 0" class="source-section">
        <h3>导入资料</h3>
        <div class="source-list">
          <a
            v-for="file in note.sourceFiles"
            :key="file.url"
            :href="file.url"
            target="_blank"
            rel="noreferrer"
          >
            {{ file.name }}
          </a>
        </div>
      </div>

      <div v-if="note.imageUrls && note.imageUrls.length > 0" class="image-section">
        <h3>图片资料</h3>
        <div class="image-grid">
          <img v-for="url in note.imageUrls" :key="url" :src="url" alt="笔记图片" />
        </div>
      </div>

      <div v-if="note.summary" class="summary">
        <h3>核心摘要</h3>
        <pre>{{ note.summary }}</pre>
      </div>

      <div v-if="note.knowledgePoints && note.knowledgePoints.length > 0" class="knowledge-section">
        <h3>知识点</h3>
        <div class="knowledge-grid">
          <div v-for="point in note.knowledgePoints" :key="point.title" class="knowledge-card">
            <div class="knowledge-header">
              <span>{{ point.title }}</span>
              <el-tag :type="getImportanceType(point.importance)" size="small">
                {{ getImportanceLabel(point.importance) }}
              </el-tag>
            </div>
            <p>{{ point.content }}</p>
          </div>
        </div>
      </div>

      <div class="document-section">
        <h3>结构化文档</h3>
        <pre>{{ note.content }}</pre>
      </div>

      <div class="actions">
        <el-button type="danger" @click="deleteNote">删除</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { deleteNote as deleteNoteApi, getNote } from '../api/note'

interface KnowledgePoint {
  title: string
  content: string
  importance: string
}

interface SourceFile {
  name: string
  url: string
  type: string
}

interface Note {
  _id: string
  title: string
  content: string
  course: string
  tags: string[]
  summary: string
  sourceFiles: SourceFile[]
  imageUrls: string[]
  knowledgePoints: KnowledgePoint[]
  createdAt: string
}

const route = useRoute()
const note = ref<Note | null>(null)

onMounted(async () => {
  const id = route.params.id as string
  const response = await getNote(id)
  note.value = response.data
})

const deleteNote = async () => {
  if (!note.value) return
  await deleteNoteApi(note.value._id)
  window.location.href = '/'
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const getImportanceType = (importance: string) => {
  switch (importance) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    default: return 'info'
  }
}

const getImportanceLabel = (importance: string) => {
  switch (importance) {
    case 'high': return '重点'
    case 'medium': return '一般'
    default: return '补充'
  }
}
</script>

<style scoped>
.note-detail {
  padding: 20px;
  max-width: 1080px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 28px;
  font-weight: 700;
  margin: 12px 0 0;
}

.date {
  font-size: 14px;
  color: #999;
}

.tags,
.source-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.source-list a {
  color: #409eff;
  text-decoration: none;
  padding: 8px 10px;
  background: #f4f8ff;
  border-radius: 8px;
}

.source-section,
.image-section,
.summary,
.knowledge-section,
.document-section {
  margin-bottom: 28px;
}

h3 {
  font-size: 20px;
  margin-bottom: 14px;
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

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.knowledge-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.knowledge-card p {
  margin: 10px 0 0;
  color: #555;
  line-height: 1.6;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
  line-height: 1.7;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}
</style>
