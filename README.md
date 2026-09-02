# Lecture Study Coach

A study companion for master’s lectures. Upload a text-based PDF, get an English outline and concept list, pick flashcards, then quiz yourself.

## What it does

1. **Upload** — lecture notes or slides (text PDFs; scanned pages are not supported).
2. **Outline** — summary, section tree, and a concept table you can edit.
3. **Cards** — term, cloze, and contrast cards; you choose what to keep.
4. **Quiz** — multiple-choice and short recall, with a recap for misses.

Study progress is saved in your browser (`localStorage`). Groq API keys stay in `sessionStorage` for the current tab only — never on the server.

## Groq API key (BYOK)

1. Open the app — you’ll see a **Groq API key** screen first.
2. Paste your key from [console.groq.com](https://console.groq.com/keys).
3. The app verifies it with Groq, then stores it in **sessionStorage** only.
4. Each outline/cards request sends your key from the browser to this app’s API, which forwards it to Groq for that request only.
5. Use **Log out / Forget API key** in the header to clear the key from this session.

No key? Click **Load demo lecture (no key)** on the welcome screen to try the full workflow on sample STA 621 notes.

Default model: `qwen/qwen3.8-27b`. Override with `GROQ_MODEL` in `.env.local` (not secret) or change the model id under **Model** in the app.

Other OpenAI-compatible providers (OpenRouter, DeepSeek, Ollama) are still available under **Model** — their keys are entered in that drawer (Groq keys are not stored there).

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

1. Enter your Groq API key on the welcome screen
2. Upload a PDF → **Extract outline**

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · pdfjs-dist · Zod
