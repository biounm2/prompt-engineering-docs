# Remind Me

## 项目概览

这个项目已经从“录音 + AI 总结 + 出题”收窄成“课堂资料结构化整理工具”。

新的使用方式是：

1. 用户先用豆包的“录音纪要”能力完成录音和转文字。
2. 用户把豆包导出的文字纪要、Markdown、docx、pdf 文件或零散课堂笔记导入本工具。
3. 如果有板书、课件、手写笔记，用户可以上传图片或用摄像头拍照。
4. 本工具不调用外部 API，只在前端本地抽取文件文字，并用规则整理核心摘要、知识点和结构化复习文档。
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
        exportDocument.ts # Markdown 下载和 PDF 打印导出
        importDocuments.ts # txt/md/docx/pdf 文本抽取
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

这个项目要支持“别人从 GitHub 拉下来，在自己电脑本地部署运行”。推荐的本地部署地址是：

```text
http://127.0.0.1:5050
```

### 一键本地部署

从 GitHub 拉代码：

```powershell
git clone https://github.com/biounm2/-.git structured-study-notes
cd structured-study-notes
```

准备环境变量：

```powershell
copy backend\.env.example backend\.env
```

安装依赖、构建前端并启动服务：

```powershell
pnpm run deploy:local
```

运行前要确认 MongoDB 已经启动；默认连接地址是 `mongodb://localhost:27017/note-summary`。

成功后打开：

```text
http://127.0.0.1:5050
```

`pnpm run deploy:local` 会依次执行：

1. `pnpm --dir backend install`
2. `pnpm --dir frontend install`
3. `pnpm --dir frontend build`
4. `pnpm --dir backend start`

后端会自动托管 `frontend/dist`，所以本地部署模式下不需要单独启动 Vite。

### 局域网访问

如果要让同一 Wi-Fi 下的其他设备访问，把 `backend/.env` 改成：

```text
MONGODB_URI=mongodb://localhost:27017/note-summary
HOST=0.0.0.0
PORT=5050
```

然后用当前电脑的局域网 IP 访问，例如：

```text
http://192.168.1.23:5050
```

### 开发模式

后端开发：

```powershell
cd D:\222\backend
pnpm install
pnpm run dev
```

前端开发：

```powershell
cd D:\222\frontend
pnpm install
pnpm run dev
```

后端需要的环境变量：

```text
MONGODB_URI=mongodb://localhost:27017/note-summary
HOST=127.0.0.1
PORT=5050
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
- 新增 `frontend/src/utils/importDocuments.ts`，支持从 txt、Markdown、docx、pdf 中提取文字。
- 新增 `frontend/src/utils/exportDocument.ts`，支持导出 Markdown 和通过浏览器保存 PDF。
- 详情页只展示导入资料、图片、摘要、知识点和完整文档。

## 当前限制

- 不做语音识别。音频转文字交给豆包录音纪要。
- 不做 OCR。图片只作为附件保存，图片内容需要用户手动补充文字说明。
- 本地知识点整理是启发式规则，不是大模型语义理解。

## 后续优化清单

最高优先级：

- 支持 `.srt`、`.vtt` 等字幕/转写格式。
- 为 `structureNotes.ts` 增加更多模板，例如“课堂笔记”“读书笔记”“会议纪要”。
- 增加文档编辑功能，允许保存后继续调整标题、摘要、知识点和正文。
- 增加上传文件类型白名单和更清晰的错误提示。

可以后做：

- 增加可选本地 OCR。
- 增加搜索和按课程筛选。
- 增加测试和 CI。
