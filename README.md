# 课堂笔记总结应用

这是一个面向学习场景的课堂笔记工具，支持手动输入、录音转文字、拍照上传，并用 AI 自动生成笔记总结、知识点和练习题。适合把课堂内容快速整理成可复习、可刷题的结构化资料。

## 主要功能

- 手动创建课堂笔记，填写课程、标题、正文和标签。
- 使用浏览器录音，把语音转成文字，再生成结构化笔记。
- 使用摄像头拍照上传，把图片作为笔记资料保存。
- 调用豆包 API 生成 AI 总结、知识点和练习题。
- 在笔记详情页查看正文、总结、图片、录音、知识点和练习题。
- 支持练习题逐题作答和查看解析。

## 技术栈

- 前端：Vue 3、Vite、TypeScript、Element Plus、Axios、Transformers.js
- 后端：Node.js、Express、MongoDB、Mongoose、Multer、Axios
- AI 能力：豆包 API，浏览器端 Whisper 语音识别辅助能力

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
│   ├── utils
│   │   └── doubao.js
│   ├── server.js
│   ├── package.json
│   └── pnpm-lock.yaml
└── frontend
    ├── src
    │   ├── api
    │   │   └── note.ts
    │   ├── components
    │   │   ├── AudioRecorder.vue
    │   │   └── PhotoCapture.vue
    │   ├── router
    │   │   └── index.ts
    │   ├── utils
    │   │   └── speechToText.ts
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
- 豆包 API Key

后端环境变量放在 `backend/.env`，这个文件不要提交到 GitHub。

```text
MONGODB_URI=mongodb://localhost:27017/note-summary
DOUBAO_API_KEY=你的豆包APIKey
PORT=3000
```

## 启动后端

```powershell
cd backend
pnpm install
pnpm run dev
```

默认后端地址：

```text
http://localhost:3000
```

## 启动前端

```powershell
cd frontend
pnpm install
pnpm run dev
```

默认前端地址：

```text
http://localhost:5173
```

前端开发服务器会把 `/api` 请求代理到后端 `http://localhost:3000`。

## 怎么使用

1. 打开 `http://localhost:5173`。
2. 点击右上角或页面中的“新建笔记”。
3. 选择创建方式：
   - `录音笔记`：允许麦克风权限，录音后转文字，再生成笔记。
   - `拍照笔记`：允许摄像头权限，拍照上传后保存为图片笔记。
   - `手动输入`：直接输入课程、标题和正文，然后生成总结、知识点、练习题。
4. 创建完成后回到列表页，点击笔记卡片查看详情。
5. 在详情页可以查看 AI 总结、知识点和练习题，并进行答题复习。

## 后端接口

- `GET /api/notes`：获取笔记列表。
- `GET /api/notes/:id`：获取单篇笔记详情。
- `POST /api/notes`：创建笔记。
- `PUT /api/notes/:id`：更新笔记。
- `DELETE /api/notes/:id`：删除笔记。
- `POST /api/notes/upload-audio`：上传音频。
- `POST /api/notes/upload-image`：上传图片。
- `POST /api/notes/generate-summary`：根据原始正文生成总结。
- `POST /api/notes/generate-knowledge`：根据原始正文提取知识点。
- `POST /api/notes/generate-questions`：根据原始正文生成练习题。
- `POST /api/notes/:id/summary`：为已保存笔记重新生成总结。
- `POST /api/notes/:id/knowledge`：为已保存笔记重新提取知识点。
- `POST /api/notes/:id/questions`：为已保存笔记重新生成练习题。

## 当前已知优化方向

- 后端需要增加请求参数校验，避免直接信任 `req.body`。
- 上传接口需要限制文件大小和文件类型。
- 前端应把 `window.location.href` 改成 Vue Router 跳转。
- 录音笔记需要增加明确的课程输入框。
- 浏览器端语音识别相关依赖会让前端包变大，后续可以考虑按需加载或放到后端处理。
- 详情页的编辑功能还需要补完整。
- 后续可以增加测试和 CI。

更多交接说明见 [REMIND_ME.md](./REMIND_ME.md)。
