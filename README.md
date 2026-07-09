# 课堂资料结构化整理工具

这是一个本地化的学习资料整理工具。新的定位很简单：把豆包“录音纪要”导出的文字稿、课堂零散笔记、图片资料导入进来，然后整理成一份结构清楚、知识点一目了然的复习文档。

项目现在不做实时录音、不做 AI 出题，也不依赖豆包 API。豆包负责录音纪要，你把纪要文件导入本工具，本工具负责规范结构、提取知识点、保存资料和生成可复习的文档。

## 主要功能

- 导入 `.txt`、`.md`、`.markdown`、`.docx`、`.pdf` 等纪要文件。
- 粘贴豆包录音纪要或课堂零散笔记。
- 导入图片资料，或用摄像头拍照上传板书/课件/手写笔记。
- 本地整理核心摘要、知识点清单和结构化文档。
- 保存整理结果，在详情页查看原始附件、图片、摘要、知识点和完整文档。
- 导出 Markdown 文件，或通过浏览器打印保存为 PDF。

## 技术栈

- 前端：Vue 3、Vite、TypeScript、Element Plus、Axios、Mammoth、PDF.js
- 后端：Node.js、Express、MongoDB、Mongoose、Multer
- 数据库：MongoDB

## 项目结构

```text
.
├── README.md
├── REMIND_ME.md
├── backend
│   ├── models
│   │   └── Note.js
│   ├── routes
│   │   └── notes.js
│   ├── server.js
│   ├── package.json
│   └── pnpm-lock.yaml
└── frontend
    ├── src
    │   ├── api
    │   │   └── note.ts
    │   ├── components
    │   │   └── PhotoCapture.vue
    │   ├── router
    │   │   └── index.ts
    │   ├── utils
    │   │   ├── exportDocument.ts
    │   │   ├── importDocuments.ts
    │   │   └── structureNotes.ts
    │   ├── views
    │   │   ├── NoteCreate.vue
    │   │   ├── NoteDetail.vue
    │   │   └── NoteList.vue
    │   ├── App.vue
    │   ├── main.ts
    │   └── style.css
    ├── vite.config.ts
    ├── package.json
    └── pnpm-lock.yaml
```

## 运行前准备

需要先准备：

- Node.js
- pnpm
- MongoDB

先确保 MongoDB 已经在本机运行。

后端环境变量放在 `backend/.env`，这个文件不要提交到 GitHub。

```text
MONGODB_URI=mongodb://localhost:27017/note-summary
HOST=127.0.0.1
PORT=5050
```

## 本地部署运行

别人从 GitHub 拉下来以后，可以按下面步骤在自己电脑本地部署。

```powershell
git clone https://github.com/biounm2/-.git structured-study-notes
cd structured-study-notes
copy backend\.env.example backend\.env
pnpm run deploy:local
```

启动成功后打开：

```text
http://127.0.0.1:5050
```

`pnpm run deploy:local` 会做三件事：

1. 安装后端依赖。
2. 安装前端依赖并构建前端。
3. 启动后端服务，并由后端托管前端页面。

如果想让同一局域网里的其他设备访问，把 `backend/.env` 里的 `HOST` 改成：

```text
HOST=0.0.0.0
```

然后用这台电脑的局域网 IP 加端口访问，例如：

```text
http://192.168.1.23:5050
```

## 开发模式

开发时可以前后端分开启动。

后端：

```powershell
cd backend
pnpm install
pnpm run dev
```

默认后端地址：

```text
http://127.0.0.1:5050
```

前端：

```powershell
cd frontend
pnpm install
pnpm run dev
```

默认前端地址：

```text
http://localhost:5173
```

前端开发服务器会把 `/api` 请求代理到后端 `http://127.0.0.1:5050`。

## 怎么使用

1. 先用豆包的“录音纪要”功能得到文字纪要。
2. 打开 `http://localhost:5173`。
3. 点击“新建笔记”。
4. 导入豆包导出的 `.txt`、`.md`、`.docx` 或 `.pdf` 文件，或者直接粘贴纪要文字。
5. 如果有板书、课件、手写笔记，可以上传图片或现场拍照。
6. 点击“整理知识点”，预览核心摘要、知识点和完整文档。
7. 可以直接导出 Markdown / PDF，也可以点击“保存文档”，之后在列表和详情页查看。

## 后端接口

- `GET /api/notes`：获取文档列表。
- `GET /api/notes/:id`：获取单篇文档详情。
- `POST /api/notes`：保存结构化文档。
- `PUT /api/notes/:id`：更新文档。
- `DELETE /api/notes/:id`：删除文档。
- `POST /api/notes/upload-file`：上传文字纪要或其他附件。
- `POST /api/notes/upload-image`：上传图片资料。

## 当前限制

- 不做语音识别：音频转文字交给豆包录音纪要。
- 不做 OCR：图片会作为资料保存，若要提取图片内容，需要手动补充文字说明。
- 本地整理规则是启发式规则，不是大模型推理；优点是不需要 API，缺点是语义理解有限。

## 后续优化方向

- 为图片增加可选 OCR 模块，但保持“无外部 API”的默认模式。
- 把结构化规则做成可配置模板，例如“课堂纪要”“读书笔记”“会议纪要”。
- 增加编辑功能，允许保存后继续调整知识点。
- 增加测试和 CI。

更多交接说明见 [REMIND_ME.md](./REMIND_ME.md)。
