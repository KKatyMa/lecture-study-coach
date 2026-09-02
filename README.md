# Lecture Study Coach

A local-first study companion for master’s lectures. Upload a text-based PDF, extract a structured English outline and concept list, keep the flashcards you actually want, then run a short retrieval quiz.

The UI and all generated study material are in English on purpose: the point is to practise the same language as the lecture.

## What it does

1. **Upload** — drop lecture notes or slides (text PDFs; no OCR in this version).
2. **Outline** — a hierarchical summary plus a concept table (term, definition, why it matters, related terms). You can edit definitions and tick what to learn.
3. **Cards** — candidate memory cards of three types: term → definition, cloze, and contrast. You choose which to keep.
4. **Quiz** — multiple-choice and short-recall items built from your deck, with a recap and retry-misses pass.

Sessions are cached in `localStorage` by PDF hash. There is no account and no database.

## Models

| Provider | Where credentials live | Model |
| --- | --- | --- |
| **Groq** (default) | `GROQ_API_KEY` in `.env.local` — **server only** | `llama-3.3-70b-versatile` |
| **Ollama** (local) | No key; server talks to localhost | `qwen2.5:14b` (override with `OLLAMA_MODEL`) |

Groq never uses `NEXT_PUBLIC_*` or browser `localStorage` for the API key. The client only knows whether the server has a key configured.

## Run locally

```bash
cp .env.example .env.local
# edit .env.local and set GROQ_API_KEY=gsk_...
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

### Verify Groq

In the app: **Model → Test Groq connection**.

Or from a terminal (dev server must be running):

```bash
curl -s http://127.0.0.1:43127/api/groq/test | jq
curl -s http://127.0.0.1:43127/api/groq/status | jq
```

Restart `npm run dev` after changing `.env.local`.

### Ollama

```bash
ollama pull qwen2.5:14b
ollama serve
```

In **Model**, choose Ollama. No API key.

## Demo without Groq

**Load demo lecture** walks the full loop on a STA 621 Bayesian inference / MLE lecture.

**Extract bundled sample PDF** runs the real PDF parser on `public/sample-lecture.pdf`. Generating an outline from that file still needs Groq or Ollama.

Regenerate the sample PDF:

```bash
npm run sample-pdf
```

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, `pdfjs-dist` in the browser, Zod-validated JSON from the model via `app/api/llm/route.ts`, Groq via `app/api/groq/test/route.ts`.

## Note on hydration warnings

If you see a React hydration warning mentioning `monica-id` or `monica-version`, that comes from the Monica browser extension injecting attributes into the DOM. It is not caused by this app.
