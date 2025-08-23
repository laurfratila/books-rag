```markdown
# Smart Librarian — RAG + LLM + Open Library

A full-stack book recommender.

- **Frontend:** React + Vite + Tailwind (dark, minimal)
- **Backend:** FastAPI
- **Vector store:** Chroma (local persistent) with OpenAI embeddings
- **LLM:** `gpt-4o-mini` / `gpt-4.1-mini` / `gpt-4.1-nano`
- **Tool:** `get_summary_by_title(title)` → returns the full summary from a curated JSON

---

## Features

- 🔎 **One-shot Ask:** RAG retrieval → LLM picks one → local summary tool → Open Library enrichment (authors/year/cover/link)
- 🎤 **Voice input (STT)** and 🎧 **Listen (TTS)** in the browser
- 🛡️ **Safety guard** (optional) politely blocks offensive queries before hitting the LLM
- 🔍 Transparent **RAG candidates** included in responses for debugging

---

## Architecture

```text
Frontend (React) ── /api/* ──> FastAPI (Python)
│
├─ Open Library client (free API)
├─ RAG retriever (Chroma + embeddings)
├─ LLM (4o-mini / 4.1-mini / 4.1-nano)
└─ Tool: get_summary_by_title(title)
```

**Unified flow (`/api/answer`):**

1. Embed query → retrieve top-k from **Chroma**  
2. Send candidates to **LLM** → model must pick one title (no hallucinating)  
3. Call local **tool** to fetch the full summary by exact title  
4. Enrich with **Open Library** metadata (authors/year/cover/link)  
5. Return a single JSON payload (title, reason, summary, details, candidates)

---

## Repo Layout

```text
backend/
  data/book_summaries.json
  src/app/clients/openlibrary.py
  src/app/rag/ingest.py
  src/app/rag/query.py
  src/app/llm/recommend.py
  src/app/answer/unified.py
  src/app/safety/guard.py
  src/app/main.py
  .chroma/                 # local vector index (gitignored)
  requirements.txt
  .env                      # local only (NOT committed)

frontend/
  index.html
  src/main.tsx
  src/App.tsx
  src/lib/api.ts
  src/lib/tts.ts            # TTS (browser Speech Synthesis)
  src/lib/stt.ts            # STT (webkitSpeechRecognition)
  src/index.css             # Tailwind v4 + @theme tokens
  tailwind.config.js
  postcss.config.js
```

---

## Prerequisites

- **Python 3.10+**
- **Node 18+**
- **OpenAI API key** (company-managed). Put it in `backend/.env` (never commit it).

---

## Quickstart

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -U pip
pip install -r requirements.txt
```

Create `backend/.env`:

```ini
OPENAI_API_KEY=sk-REPLACE_ME
EMBED_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o-mini          # or gpt-4.1-mini / gpt-4.1-nano
SAFETY_GUARD=true               # or false
```

Build the vector store once (embeds the curated summaries into Chroma):

```bash
python -m src.app.rag.ingest
```

Run the API:

```bash
python -m uvicorn src.app.main:app --reload --host 127.0.0.1 --port 8000
# Health:   http://127.0.0.1:8000/health
# Swagger:  http://127.0.0.1:8000/docs
```

### 2) Frontend

```bash
cd frontend
npm i
npm run dev
# http://localhost:5173
```

> **Note (Tailwind v4):** `src/index.css` contains an `@theme` block. If you see a white background, ensure `index.css` is imported in `src/main.tsx`, then restart `npm run dev`.

---

## API Endpoints

### `GET /api/answer?q=...&k=3` (recommended)

Returns:

```json
{
  "title": "...",
  "reason_message": "...",
  "summary": "...",
  "details": {
    "authors": ["..."],
    "year": 1930,
    "cover_url": "...",
    "openlibrary_url": "..."
  },
  "rag_candidates": [{ "title": "...", "snippet": "..." }],
  "k": 3,
  "source": "rag+llm+openlibrary"
}
```

### Other endpoints

- `GET /api/search?q=...` — Open Library passthrough  
- `GET /api/rag/search?q=...&k=3` — semantic candidates from Chroma  
- `GET /api/summary?title=...` — full local summary by exact title  
- `GET /api/recommend_chat?q=...&k=3` — LLM pick + tool (without OL enrichment)  
- `GET /api/safety/status` — check if the guard is enabled  
- `GET /health` — liveness

---

## Model Selection

Set in `backend/.env`:

```ini
EMBED_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o-mini      # or gpt-4.1-mini / gpt-4.1-nano
```

---

## Safety Guard

Toggle with `SAFETY_GUARD=true|false` in `backend/.env`.

When enabled, offensive input returns **HTTP 400** with a polite message and does **not** call the LLM.

---

## Voice Features

- **STT (mic):** Chromium browsers (Chrome/Edge) via `webkitSpeechRecognition`. Dictation auto-sends when you stop speaking.  
- **TTS (listen):** Browser Speech Synthesis reads the recommended title, reason, and summary.

---

## Screenshots

Create a `docs/` folder and add:

- `docs/home.png` — landing + input  
- `docs/result.png` — recommendation card with cover

Reference them here:

```md
![Home](docs/home.png)
![Result](docs/result.png)
```

---

## Troubleshooting

- **Blank/white page:**  
  Ensure `src/index.css` has `@import "tailwindcss";` and the `@theme` block defining `--color-ink-*`. Restart `npm run dev`.

- **HTTP 400 on Ask:**  
  The safety guard likely blocked the text. The frontend shows the backend’s detail. Set `SAFETY_GUARD=false` to disable.

- **HTTP 404 (No recommendation):**  
  Query didn’t match the curated set. Try simpler phrasing or fewer constraints.

- **Git push rejected (secrets):**  
  Remove keys from code. Keep secrets only in `backend/.env`.

- **Large files warning:**  
  Don’t commit `backend/.chroma/` (it’s already in `.gitignore`).

---

## License

Educational project.
```

