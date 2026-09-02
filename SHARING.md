# Sharing Lecture Study Coach with classmates

## Before you share

1. **Do not include `.env.local`** in git, zip, or cloud drive uploads.
2. Confirm `.gitignore` lists `.env*` (except `.env.example`).
3. Run `git status` — no secret files should appear.
4. Optional: remove old API keys from browser localStorage on your machine (DevTools → Application → Local Storage).

## What each classmate does

```bash
git clone <repo-url>
cd lecture-study-coach
npm install
npm run dev
```

Then in the browser:

1. Open http://127.0.0.1:43127
2. **Model** → choose provider (Groq is a good free start)
3. Paste **their own** API key
4. **Test connection** → should show “Connected”
5. Upload a lecture PDF or **Load demo lecture**

## Recommended providers for students

| Situation | Provider | Notes |
| --- | --- | --- |
| Fast + free tier | Groq | `qwen/qwen3.8-27b` or `llama-3.3-70b-versatile` |
| Many models, one key | OpenRouter | Change model id without code changes |
| Long PDFs, cheap | DeepSeek | `deepseek-chat` |
| No cloud / privacy | Ollama | Needs local GPU or patience on CPU |

## Switching models

No code changes required:

1. Open **Model**
2. Change **Model id** (e.g. `meta-llama/llama-3.3-70b-instruct` on Groq)
3. **Test connection** → upload PDF again

The app normalizes different JSON shapes (nested `outline`, snake_case fields, etc.) before validation.

## Demo without any key

**Load demo lecture** — full outline → cards → quiz on STA 621 Bayesian inference notes.

## Phone / tablet

Same app, responsive layout. Run `npm run dev:lan`, then on your device (same Wi‑Fi) open `http://<your-computer-ip>:43127`. Each device keeps its own API key in the browser. PDF upload uses the file picker, not drag-and-drop.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| “No API key configured” | Paste key in Model settings |
| Zod / missing fields error | Click Extract outline again; try another model |
| Ollama fails | Run `ollama serve` and `ollama pull qwen2.5:14b` |
| Model not found | Check model id on provider’s model list |

## Deploying (optional)

Full guide: **[DEPLOY.md](DEPLOY.md)** (中文). Quick options:

| Platform | Best for |
| --- | --- |
| [Vercel](https://vercel.com) | Fastest public URL; watch serverless timeouts on long PDFs |
| [Railway](https://railway.app) | Longer LLM requests, `npm run start` |
| Docker / VPS | Full control, HTTPS via Nginx |

Each user still pastes their own API key in the browser. Do not expose a shared key in `NEXT_PUBLIC_*` variables.
