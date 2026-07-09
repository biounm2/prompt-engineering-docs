# Remind Me

## Project snapshot

This folder is a classroom note summary application. It is split into:

- `backend/`: Express API server with MongoDB persistence through Mongoose.
- `frontend/`: Vue 3 + Vite app using Element Plus for the UI.

The product flow is:

1. Create a note manually, from a recording, or from captured photos.
2. Store notes with course, content, tags, summaries, audio, images, knowledge points, and practice questions.
3. Use the Doubao API to summarize note content, extract knowledge points, and generate exercises.
4. Browse note cards, open note detail pages, review generated material, and practice quiz questions.

## Current structure

```text
D:\222
  .gitignore
  REMIND_ME.md
  backend
    .env                  # ignored; contains runtime secrets
    models
      Note.js             # Mongoose schema for notes, knowledge points, questions, media URLs
    routes
      notes.js            # CRUD, uploads, AI generation endpoints
    utils
      doubao.js           # Doubao speech/chat API wrapper
    server.js             # Express app, CORS, JSON, static uploads, MongoDB connection
    package.json
  frontend
    index.html
    vite.config.ts        # dev server and /api proxy to backend port 3000
    src
      api
        note.ts           # Axios API client
      components
        AudioRecorder.vue # browser recording + local speech transcription + AI note creation
        PhotoCapture.vue  # camera capture + image upload
      router
        index.ts          # list, detail, create routes
      utils
        speechToText.ts   # Transformers.js Whisper helper
      views
        NoteList.vue
        NoteCreate.vue
        NoteDetail.vue
      App.vue
      main.ts
      style.css
    package.json
```

## How to run

Backend:

```powershell
cd D:\222\backend
npm install
npm run dev
```

Frontend:

```powershell
cd D:\222\frontend
npm install
npm run dev
```

Required backend environment:

```text
MONGODB_URI=mongodb://localhost:27017/note-summary
DOUBAO_API_KEY=your_api_key
PORT=3000
```

## Important endpoints

- `GET /api/notes`: list notes.
- `GET /api/notes/:id`: get a note.
- `POST /api/notes`: create a note.
- `PUT /api/notes/:id`: update a note.
- `DELETE /api/notes/:id`: delete a note.
- `POST /api/notes/upload-audio`: upload audio.
- `POST /api/notes/upload-image`: upload one image.
- `POST /api/notes/generate-summary`: summarize raw content before saving.
- `POST /api/notes/generate-knowledge`: extract knowledge points from raw content.
- `POST /api/notes/generate-questions`: generate questions from raw content.
- `POST /api/notes/:id/summary`: regenerate summary for a saved note.
- `POST /api/notes/:id/knowledge`: regenerate knowledge points for a saved note.
- `POST /api/notes/:id/questions`: regenerate questions for a saved note.

## Fixes already made in this pass

- Manual note AI actions now call raw-content generation endpoints instead of sending a fake `temp` note id.
- Photo note image URLs are now persisted when creating a note.
- Note detail now displays saved images.
- `AudioRecorder.vue` no longer shadows the imported `transcribeAudio` helper.
- `PhotoCapture.vue` imports the `Camera` icon used by the template.

## Optimization backlog

Highest priority:

- Add request validation on the backend. Right now most routes trust `req.body`; use a schema validator before saving notes or passing content to AI.
- Add upload limits and MIME filtering for `multer`. Audio/image endpoints currently accept any file type and size.
- Move repeated AI generation request logic into shared frontend helpers and backend service functions.
- Improve error handling for AI calls. The UI should show actionable failures instead of only `alert()` or empty arrays.
- Replace `window.location.href` navigation with Vue Router navigation so the SPA does not fully reload.
- Reduce the frontend bundle size. `npm run build`/`pnpm run build` currently succeeds, but Vite warns that the main JS chunk is over 2 MB because speech/model dependencies are bundled into the initial load.

Feature correctness:

- Decide whether speech-to-text should run in the browser or backend. The current code has both paths, but the frontend mostly uses browser transcription.
- Review `frontend/src/utils/speechToText.ts`; raw audio bytes are converted directly to `Float32Array`, which may not be the audio waveform format expected by Transformers.js.
- Add a course input to the audio-note tab instead of reading `document.querySelector('[name="course"]')`, because that selector currently has no stable matching field.
- Support editing notes from the detail page; `editNote()` is currently a placeholder.
- Show loading states on list/detail pages and empty states when no notes exist.

Security and operations:

- Keep `backend/.env` ignored and never commit API keys.
- Add `.env.example` documenting required variables.
- Avoid returning local server file paths such as `req.file.path` from upload responses if not needed by the frontend.
- Consider authentication before this becomes multi-user; currently every API route is public.

Testing:

- Add backend route tests for note CRUD, uploads, and AI endpoint validation.
- Add frontend tests for note creation flows and generated quiz rendering.
- Add a simple CI workflow for `npm run build` in `frontend` and a backend syntax/test check.
