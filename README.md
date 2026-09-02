# Lecture Study Coach

A local-first study companion for master’s lectures. Upload a text-based PDF, extract a structured English outline and concept list, keep the flashcards you actually want, then run a short retrieval quiz.

Built to **share with classmates**: everyone uses their **own API key** in the app. Your key never goes into git.

## What it does

1. **Upload** — drop lecture notes or slides (text PDFs; no OCR in this version).
2. **Outline** — hierarchical summary + concept table (term, definition, why it matters).
3. **Cards** — term / cloze / contrast flashcard candidates; you pick what to keep.
4. **Quiz** — multiple-choice and short-recall items with a recap and retry-misses pass.

Sessions are cached in `localStorage` by PDF hash. No account, no database.

## Supported providers

Any **OpenAI-compatible** chat API:

| Preset | Default model | Get a key |
| --- | --- | --- |
| Groq | `qwen/qwen3.8-27b` | [console.groq.com](https://console.groq.com) |
| OpenRouter | `qwen/qwen-2.5-72b-instruct` | [openrouter.ai](https://openrouter.ai) |
| DeepSeek | `deepseek-chat` | [platform.deepseek.com](https://platform.deepseek.com) |
| Ollama | `qwen2.5:14b` | No key (local) |
| Custom | You choose | Together, Fireworks, LM Studio, … |

Model ids are editable in **Model** settings. JSON from different models is normalized automatically — you should not need to change code when switching models.

## Quick start

```bash
git clone <your-repo-url>
cd lecture-study-coach
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

1. Click **Model** → pick a provider → paste **your** API key → **Test connection**.
2. Upload a lecture PDF → **Extract outline**.

Or skip keys entirely: **Load demo lecture** runs the full workflow on sample STA 621 notes.

## Sharing with classmates

See **[SHARING.md](SHARING.md)** for a checklist before you send the repo or zip.

**Never share** `.env.local` — that file may contain your personal API keys.

## Optional `.env.local`

Power users can put keys in `.env.local` instead of the UI (still gitignored). Copy `.env.example` as a template. The in-app key takes precedence when both are set.

## Test connection

In the app: **Model → Test connection**.

Or:

```bash
curl -s -X POST http://127.0.0.1:43127/api/llm/test \
  -H 'Content-Type: application/json' \
  -d '{"settings":{"preset":"groq","baseUrl":"https://api.groq.com/openai/v1","model":"qwen/qwen3.8-27b","apiKey":"YOUR_KEY","temperature":0.2}}'
```

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · pdfjs-dist · Zod · provider-agnostic JSON normalization

## Hydration warning (Monica extension)

If you see `monica-id` / `monica-version` hydration warnings, that is from the Monica browser extension, not this app.
