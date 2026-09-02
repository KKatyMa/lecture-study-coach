/** Server-only LLM helpers. Never import from client components. */

import { isLocalBaseUrl, presetMeta } from "@/lib/providers";
import type { LlmSettings } from "@/lib/schema";
import { stripThinkingTags } from "@/lib/normalize-outline";

export type ResolvedLlmConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  supportsJsonMode: boolean;
};

function envFallbackKey(preset: LlmSettings["preset"]): string | undefined {
  switch (preset) {
    case "groq":
      return process.env.GROQ_API_KEY?.trim();
    case "openrouter":
      return process.env.OPENROUTER_API_KEY?.trim();
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY?.trim();
    default:
      return process.env.LLM_API_KEY?.trim();
  }
}

export function resolveLlmConfig(settings: LlmSettings): ResolvedLlmConfig {
  const meta = presetMeta(settings);
  const baseUrl = settings.baseUrl.trim() || meta.baseUrl;
  const model = settings.model.trim() || meta.model;
  const local = isLocalBaseUrl(baseUrl);

  let apiKey = settings.apiKey.trim() || envFallbackKey(settings.preset) || "";
  if (local) {
    apiKey = apiKey || "ollama";
  }

  if (!local && !apiKey) {
    throw new Error(
      "No API key configured. Open Model in the app and paste your key (it stays in your browser only).",
    );
  }

  return {
    baseUrl,
    model,
    apiKey,
    temperature: settings.temperature,
    supportsJsonMode: meta.supportsJsonMode && !local,
  };
}

export function readAssistantContent(raw: string): string {
  const parsed = JSON.parse(raw) as {
    choices?: {
      message?: {
        content?: string | Array<{ text?: string }> | null;
        reasoning?: string | null;
      };
    }[];
    error?: { message?: string };
  };

  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }

  const message = parsed.choices?.[0]?.message;
  if (!message) {
    throw new Error("The model response did not include a message.");
  }

  let content = "";
  if (typeof message.content === "string") {
    content = message.content;
  } else if (Array.isArray(message.content)) {
    content = message.content.map((part) => part.text ?? "").join("");
  }

  content = stripThinkingTags(content.trim());
  if (!content && typeof message.reasoning === "string") {
    content = stripThinkingTags(message.reasoning.trim());
  }

  if (!content) {
    throw new Error("The model response did not include message content.");
  }

  return content;
}

export async function callChatCompletion(
  config: ResolvedLlmConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  const payload: Record<string, unknown> = {
    model: config.model,
    temperature: config.temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (config.supportsJsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } finally {
    clearTimeout(timeout);
  }
}

export async function testLlmConnection(settings: LlmSettings): Promise<{
  ok: boolean;
  model: string;
  reply?: string;
  error?: string;
  status?: number;
}> {
  try {
    const config = resolveLlmConfig(settings);
    let result = await callChatCompletion(config, "You are a helpful assistant.", "Reply with exactly: ok");

    if (!result.ok && config.supportsJsonMode && result.status === 400) {
      result = await callChatCompletion(
        { ...config, supportsJsonMode: false },
        "You are a helpful assistant.",
        "Reply with exactly: ok",
      );
    }

    if (!result.ok) {
      let detail = result.text.slice(0, 400);
      try {
        const err = JSON.parse(result.text) as { error?: { message?: string } | string };
        if (typeof err.error === "string") detail = err.error;
        if (typeof err.error === "object" && err.error?.message) detail = err.error.message;
      } catch {
        /* keep slice */
      }
      return { ok: false, model: config.model, error: detail, status: result.status };
    }

    const reply = readAssistantContent(result.text).slice(0, 120);
    return { ok: true, model: config.model, reply };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed.";
    return { ok: false, model: settings.model, error: message };
  }
}
