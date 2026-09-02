# Lecture Study Coach

A study companion for master’s lectures. Upload a text-based PDF, get an English outline and concept list, pick flashcards, then quiz yourself.

## What it does

1. **Upload** — lecture notes or slides (text PDFs; scanned pages are not supported).
2. **Outline** — summary, section tree, and a concept table you can edit.
3. **Cards** — term, cloze, and contrast cards; you choose what to keep.
4. **Quiz** — multiple-choice and short recall, with a recap for misses.

Progress is saved in your browser (`localStorage`). No account, no database.

## Models

Works with any **OpenAI-compatible** API. Open **Model** in the app, pick a provider, paste your key, and edit the model id if needed.

| Preset | Default model |
| --- | --- |
| Groq | `qwen/qwen3.8-27b` |
| OpenRouter | `qwen/qwen-2.5-72b-instruct` |
| DeepSeek | `deepseek-chat` |
| Ollama | `qwen2.5:14b` (local, no key) |
| Custom | your endpoint |

Different models return JSON in different shapes — the app normalizes that for you.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

1. **Model** → choose provider → paste API key → **Test connection**
2. Upload a PDF → **Extract outline**

No key? Use **Load demo lecture** to try the full flow on sample STA 621 notes.

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · pdfjs-dist · Zod
