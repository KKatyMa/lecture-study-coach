# Lecture Study Coach

A local-first study companion for master’s lectures. Upload a text-based PDF, extract a structured English outline and concept list, keep the flashcards you actually want, then run a short retrieval quiz.

The UI and all generated study material are in English on purpose: the point is to practise the same language as the lecture.

## What it does

1. **Upload** — drop lecture notes or slides (text PDFs; no OCR in this version).
2. **Outline** — a hierarchical summary plus a concept table (term, definition, why it matters, related terms). You can edit definitions and tick what to learn.
3. **Cards** — candidate memory cards of three types: term → definition, cloze, and contrast. You choose which to keep.
4. **Quiz** — multiple-choice and short-recall items built from your deck, with a recap and retry-misses pass.

Sessions are cached in `localStorage` by PDF hash. There is no account and no database.

## Recommended open models (cost control)

This app talks to any **OpenAI-compatible** chat endpoint. Closed models work if you point a custom base URL at them, but the defaults are open-weight:

| Goal | Preset | Model |
| --- | --- | --- |
| Best cheap hosted quality | Groq | `llama-3.3-70b-versatile` |
| Strong academic extraction | DeepSeek | `deepseek-chat` (DeepSeek-V3) |
| Fully local, free | Ollama | `qwen2.5:14b` (or `:32b` with 16GB+ VRAM) |

Avoid 7B-class models as the main extractor: outlines and contrast cards get sloppy. A dummy key is sent for Ollama; Groq and DeepSeek need a real key. Keys never leave the browser except as a `Authorization` header to the URL you set.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

### Ollama

```bash
ollama pull qwen2.5:14b
ollama serve
```

In **Model**, choose the Ollama preset. No API key.

### Groq or DeepSeek

Paste a key in **Model**. Groq’s free tier is usually enough for a handful of lectures.

## Demo without a key

**Load demo lecture** walks the full loop on a STA 621 Bayesian inference / MLE lecture.

**Extract bundled sample PDF** runs the real PDF parser on `public/sample-lecture.pdf`. Generating an outline from that file still needs a model.

Regenerate the sample PDF:

```bash
npm run sample-pdf
```

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, `pdfjs-dist` in the browser, Zod-validated JSON from the model via `app/api/llm/route.ts`.
