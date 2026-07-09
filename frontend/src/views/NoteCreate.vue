<template>
  <div class="note-create">
    <el-button @click="$router.back()" style="margin-bottom: 20px">返回列表</el-button>

    <el-card>
      <template #header>
        <div class="header">
          <div>
            <h2>导入资料并整理知识点</h2>
            <p>导入豆包录音纪要、课堂文字稿或图片资料，本地整理成结构化复习文档。</p>
          </div>
          <el-tag type="success">无外部 API</el-tag>
        </div>
      </template>

      <el-form label-width="92px">
        <el-form-item label="课程名称">
          <el-input v-model="form.course" placeholder="例如：高等数学、计算机网络" />
        </el-form-item>

        <el-form-item label="文档标题">
          <el-input v-model="form.title" placeholder="不填则从内容自动生成" />
        </el-form-item>

        <el-form-item label="导入文件">
          <div class="import-box">
            <input
              ref="fileInputRef"
              type="file"
              accept=".txt,.md,.markdown,.text,image/*"
              multiple
              @change="handleFileImport"
            />
            <span>支持豆包导出的 txt/Markdown 纪要，也支持图片附件。</span>
          </div>
        </el-form-item>

        <el-form-item label="拍照资料">
          <PhotoCapture @images-uploaded="handleImagesUploaded" />
        </el-form-item>

        <el-form-item label="纪要内容">
          <el-input
            v-model="form.rawText"
            type="textarea"
            :rows="12"
            placeholder="可以粘贴豆包录音纪要，也可以在导入文本文件后继续编辑。"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="structureContent">整理知识点</el-button>
          <el-button :disabled="!structured.content" @click="saveNote">保存文档</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="structured.content" class="preview-card">
      <template #header>
        <div class="preview-header">
          <h3>整理结果预览</h3>
          <el-button type="primary" @click="saveNote">保存文档</el-button>
        </div>
      </template>

      <div class="summary-block">
        <h4>核心摘要</h4>
        <pre>{{ structured.summary }}</pre>
      </div>

      <div class="knowledge-grid">
        <div v-for="point in structured.knowledgePoints" :key="point.title" class="knowledge-card">
          <div class="knowledge-title">
            <span>{{ point.title }}</span>
            <el-tag :type="getImportanceType(point.importance)" size="small">
              {{ getImportanceLabel(point.importance) }}
            </el-tag>
          </div>
          <p>{{ point.content }}</p>
        </div>
      </div>

      <div class="document-preview">
        <h4>完整文档</h4>
        <pre>{{ structured.content }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import PhotoCapture from '../components/PhotoCapture.vue'
import { createNote, uploadFile, uploadImage } from '../api/note'
import { structureNoteContent, type StructuredNote } from '../utils/structureNotes'

const fileInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  course: '',
  title: '',
  rawText: ''
})

const uploadedImages = ref<string[]>([])
const sourceFiles = ref<{ name: string; url: string; type: string }[]>([])
const structured = reactive<StructuredNote>({
  title: '',
  summary: '',
  content: '',
  knowledgePoints: []
})

const readTextFile = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'utf-8')
  })
}

const uploadGenericFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await uploadFile(formData)
  sourceFiles.value.push({
    name: response.data.originalName || file.name,
    url: response.data.fileUrl,
    type: response.data.type || file.type
  })
  return response.data.fileUrl as string
}

const uploadImageFile = async (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  const response = await uploadImage(formData)
  uploadedImages.value.push(response.data.imageUrl)
  sourceFiles.value.push({
    name: response.data.originalName || file.name,
    url: response.data.imageUrl,
    type: response.data.type || file.type
  })
}

const handleFileImport = async (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      await uploadImageFile(file)
      continue
    }

    if (/\.(txt|md|markdown|text)$/i.test(file.name) || file.type.startsWith('text/')) {
      const text = await readTextFile(file)
      form.rawText = [form.rawText, text].filter(Boolean).join('\n\n')
      await uploadGenericFile(file)
      continue
    }

    await uploadGenericFile(file)
  }

  if (fileInputRef.value) fileInputRef.value.value = ''
}

const handleImagesUploaded = (imageUrls: string[]) => {
  uploadedImages.value = [...uploadedImages.value, ...imageUrls]
  sourceFiles.value.push(
    ...imageUrls.map((url, index) => ({
      name: `拍照资料 ${sourceFiles.value.length + index + 1}`,
      url,
      type: 'image/jpeg'
    }))
  )
}

const structureContent = () => {
  const result = structureNoteContent({
    course: form.course,
    title: form.title,
    rawText: form.rawText,
    imageCount: uploadedImages.value.length
  })
  Object.assign(structured, result)
}

const saveNote = async () => {
  if (!structured.content) {
    structureContent()
  }

  const response = await createNote({
    course: form.course || '未指定课程',
    title: structured.title,
    content: structured.content,
    tags: ['结构化整理'],
    summary: structured.summary,
    sourceType: uploadedImages.value.length && form.rawText ? 'mixed' : uploadedImages.value.length ? 'image' : 'text',
    sourceFiles: sourceFiles.value,
    imageUrls: uploadedImages.value,
    knowledgePoints: structured.knowledgePoints
  })

  if (response.data?._id) {
    window.location.href = `/note/${response.data._id}`
  }
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
.note-create {
  padding: 20px;
  max-width: 1080px;
  margin: 0 auto;
}

.header,
.preview-header,
.knowledge-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.header h2,
.preview-header h3 {
  margin: 0;
}

.header p {
  margin: 6px 0 0;
  color: #666;
}

.import-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #666;
}

.preview-card {
  margin-top: 20px;
}

.summary-block,
.document-preview {
  margin-bottom: 24px;
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

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.knowledge-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.knowledge-title {
  font-weight: 600;
}

.knowledge-card p {
  margin: 10px 0 0;
  color: #555;
  line-height: 1.6;
}
</style>
