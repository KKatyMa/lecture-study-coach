/** Server-only LLM credential resolution. Never import from client components. */

import { GROQ_BASE_URL, GROQ_MODEL, getGroqApiKey, isGroqConfigured } from "@/lib/groq-server";
import type { LlmSettings } from "@/lib/schema";

export type ResolvedLlmConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
};

export { isGroqConfigured };

export function resolveServerLlmConfig(settings: LlmSettings): ResolvedLlmConfig {
  if (settings.preset === "groq") {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local and restart the dev server.",
      );
    }
    return {
      baseUrl: GROQ_BASE_URL,
      model: GROQ_MODEL,
      apiKey,
      temperature: settings.temperature,
    };
  }

  return {
    baseUrl: process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434/v1",
    model: process.env.OLLAMA_MODEL?.trim() || "qwen2.5:14b",
    apiKey: "ollama",
    temperature: settings.temperature,
  };
}
