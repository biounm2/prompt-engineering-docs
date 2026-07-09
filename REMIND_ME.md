# Remind Me

## 项目概览

这个项目已经从“录音 + AI 总结 + 出题”收窄成“课堂资料结构化整理工具”。

新的使用方式是：

1. 用户先用豆包的“录音纪要”能力完成录音和转文字。
2. 用户把豆包导出的文字纪要、Markdown 文件、零散课堂笔记导入本工具。
3. 如果有板书、课件、手写笔记，用户可以上传图片或用摄像头拍照。
4. 本工具不调用外部 API，只在前端本地用规则整理核心摘要、知识点和结构化复习文档。
5. 后端负责保存文档、知识点和附件。

## 当前目录结构

```text
D:\222
  .gitignore
  README.md
  REMIND_ME.md
  backend
    .env                  # 已忽略，存放 MongoDB 等运行配置
    models
      Note.js             # 文档、知识点、附件、图片 URL 的 Mongoose 模型
    routes
      notes.js            # 文档 CRUD、文件上传、图片上传接口
    server.js             # Express 入口、CORS、静态上传目录、MongoDB 连接
    package.json
    pnpm-lock.yaml
  frontend
    index.html
    vite.config.ts        # Vite 开发服务器和 /api 代理
    src
      api
        note.ts           # Axios API 客户端
      components
        PhotoCapture.vue  # 摄像头拍照、图片上传组件
      router
        index.ts          # 列表页、详情页、创建页路由
      utils
        structureNotes.ts # 本地结构化整理规则
      views
        NoteList.vue
        NoteCreate.vue
        NoteDetail.vue
      App.vue
      main.ts
      style.css
    package.json
    pnpm-lock.yaml
    pnpm-workspace.yaml
```

## 运行方式

后端：

```powershell
cd D:\222\backend
pnpm install
pnpm run dev
```

前端：

```powershell
cd D:\222\frontend
pnpm install
pnpm run dev
```

后端需要的环境变量：

```text
MONGODB_URI=mongodb://localhost:27017/note-summary
PORT=3000
```

## 重要接口

- `GET /api/notes`：获取文档列表。
- `GET /api/notes/:id`：获取单篇文档。
- `POST /api/notes`：保存结构化文档。
- `PUT /api/notes/:id`：更新文档。
- `DELETE /api/notes/:id`：删除文档。
- `POST /api/notes/upload-file`：上传文字纪要或附件。
- `POST /api/notes/upload-image`：上传图片资料。

## 本次简化后的变化

- 移除了豆包 API 封装和后端 AI 生成接口。
- 移除了实时录音组件和浏览器端 Whisper 语音识别依赖。
- 移除了练习题/出题流程。
- 创建页变成导入工具：导入文字纪要、粘贴零散笔记、上传图片或拍照。
- 新增 `frontend/src/utils/structureNotes.ts`，用本地规则生成摘要、知识点和结构化文档。
- 详情页只展示导入资料、图片、摘要、知识点和完整文档。

## 当前限制

- 不做语音识别。音频转文字交给豆包录音纪要。
- 不做 OCR。图片只作为附件保存，图片内容需要用户手动补充文字说明。
- 本地知识点整理是启发式规则，不是大模型语义理解。

## 后续优化清单

最高优先级：

- 增加 Markdown / PDF 导出，让整理结果可以直接交作业或复习。
- 支持 `.docx`、`.pdf`、`.srt`、`.vtt` 等更多导入格式。
- 为 `structureNotes.ts` 增加更多模板，例如“课堂笔记”“读书笔记”“会议纪要”。
- 增加文档编辑功能，允许保存后继续调整标题、摘要、知识点和正文。
- 增加上传文件类型白名单和更清晰的错误提示。

可以后做：

- 增加可选本地 OCR。
- 增加搜索和按课程筛选。
- 增加测试和 CI。
