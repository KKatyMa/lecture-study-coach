/** Server-only Groq configuration. Never import this module from client components. */

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const GROQ_MODEL = "qwen/qwen3.8-27b";

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey());
}

export type GroqTestResult =
  | { ok: true; model: string; reply: string }
  | { ok: false; error: string; status?: number };

export async function testGroqConnection(): Promise<GroqTestResult> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "GROQ_API_KEY is not set. Add it to .env.local and restart the dev server.",
    };
  }

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        max_tokens: 16,
        messages: [{ role: "user", content: "Reply with exactly: ok" }],
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      let detail = raw.slice(0, 400);
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string } };
        if (parsed.error?.message) detail = parsed.error.message;
      } catch {
        /* keep slice */
      }
      return { ok: false, error: detail, status: response.status };
    }

    const parsed = JSON.parse(raw) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = parsed.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return { ok: false, error: "Groq returned an empty message." };
    }

    return { ok: true, model: GROQ_MODEL, reply };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Groq request failed.";
    return { ok: false, error: message };
  }
}
