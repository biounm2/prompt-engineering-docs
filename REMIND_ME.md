# Remind Me

## 项目概览

这个文件夹是一个“课堂笔记总结应用”。项目采用前后端分离结构：

- `backend/`：Express API 服务，使用 Mongoose 连接 MongoDB。
- `frontend/`：Vue 3 + Vite 前端应用，UI 使用 Element Plus。

核心流程：

1. 用户可以手动输入、录音或拍照来创建笔记。
2. 笔记会保存课程、正文、标签、总结、音频、图片、知识点和练习题。
3. 后端通过豆包 API 对笔记内容进行总结、知识点提取和练习题生成。
4. 前端提供笔记列表、笔记详情、知识点查看和练习题作答。

## 当前目录结构

```text
D:\222
  .gitignore
  README.md
  REMIND_ME.md
  backend
    .env                  # 已忽略，存放运行密钥，不要提交
    models
      Note.js             # 笔记、知识点、题目、媒体 URL 的 Mongoose 模型
    routes
      notes.js            # 笔记 CRUD、上传、AI 生成接口
    utils
      doubao.js           # 豆包语音和对话 API 封装
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
        AudioRecorder.vue # 录音、转写、AI 生成笔记组件
        PhotoCapture.vue  # 摄像头拍照、图片上传组件
      router
        index.ts          # 列表页、详情页、创建页路由
      utils
        speechToText.ts   # Transformers.js Whisper 工具
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
DOUBAO_API_KEY=你的豆包APIKey
PORT=3000
```

## 重要接口

- `GET /api/notes`：获取笔记列表。
- `GET /api/notes/:id`：获取单篇笔记。
- `POST /api/notes`：创建笔记。
- `PUT /api/notes/:id`：更新笔记。
- `DELETE /api/notes/:id`：删除笔记。
- `POST /api/notes/upload-audio`：上传音频。
- `POST /api/notes/upload-image`：上传图片。
- `POST /api/notes/generate-summary`：根据原始内容生成总结。
- `POST /api/notes/generate-knowledge`：根据原始内容提取知识点。
- `POST /api/notes/generate-questions`：根据原始内容生成练习题。
- `POST /api/notes/:id/summary`：给已保存笔记重新生成总结。
- `POST /api/notes/:id/knowledge`：给已保存笔记重新提取知识点。
- `POST /api/notes/:id/questions`：给已保存笔记重新生成练习题。

## 已完成的修复

- 手动输入页的 AI 总结、知识点、练习题生成已经改为调用“原始内容生成接口”，不再传假的 `temp` 笔记 ID。
- 拍照笔记的 `imageUrls` 已经能保存到后端。
- 笔记详情页已经能展示保存的图片。
- `AudioRecorder.vue` 里导入的 `transcribeAudio` 不再和本地函数重名。
- `PhotoCapture.vue` 已经补充 `Camera` 图标导入。
- 前端构建已通过。
- 后端主要 JS 文件已做语法检查。

## 后续优化清单

最高优先级：

- 后端增加请求参数校验。当前很多接口直接使用 `req.body`，上线前应使用 schema validator。
- 上传接口增加文件大小限制和 MIME 类型过滤。当前 `multer` 接收范围太宽。
- 把前后端重复的 AI 生成逻辑抽成共享函数或服务层。
- 改善 AI 调用失败时的错误提示，不要只用 `alert()` 或返回空数组。
- 把前端的 `window.location.href` 改成 Vue Router 跳转，避免整个 SPA 刷新。
- 优化前端包体积。当前构建能通过，但 Vite 提醒主 JS chunk 超过 2 MB，主要原因是语音模型相关依赖进入了首屏包。

功能正确性：

- 明确语音转文字到底走浏览器端还是后端。现在两条路径都存在，但前端主要使用浏览器端转写。
- 检查 `frontend/src/utils/speechToText.ts` 的音频处理方式，直接把音频字节转成 `Float32Array` 可能不是 Transformers.js 期望的波形输入。
- 录音笔记页需要加课程输入框，不要再从 `document.querySelector('[name="course"]')` 读取，因为当前没有稳定匹配的字段。
- 补完整详情页的编辑功能，`editNote()` 现在还是空实现。
- 笔记列表和详情页应该增加加载状态、空状态和错误状态。

安全和运维：

- `backend/.env` 必须继续忽略，不能提交 API Key。
- 建议新增 `.env.example`，说明必需环境变量。
- 上传接口响应里如果前端不需要，就不要返回服务器本地文件路径 `req.file.path`。
- 如果以后多人使用，需要增加认证和权限控制；当前所有 API 都是公开的。

测试：

- 增加后端接口测试，覆盖笔记 CRUD、上传和 AI 生成接口。
- 增加前端测试，覆盖创建笔记、展示知识点和答题流程。
- 增加 CI，至少跑前端 `pnpm run build` 和后端语法/测试检查。
