import type { LlmSettings } from "@/lib/schema";

export type ProviderPreset = LlmSettings["preset"];

export const PROVIDER_PRESETS: Record<
  ProviderPreset,
  { label: string; model: string; hint: string }
> = {
  groq: {
    label: "Groq — Qwen3.8 27B",
    model: "qwen/qwen3.8-27b",
    hint: "Groq runs on the server using GROQ_API_KEY from .env.local. The key is never sent to the browser.",
  },
  ollama: {
    label: "Ollama (local, free)",
    model: "qwen2.5:14b",
    hint: "Run `ollama serve` and `ollama pull qwen2.5:14b`. Requests go from the Next.js server to localhost.",
  },
};

export const DEFAULT_SETTINGS: LlmSettings = {
  preset: "groq",
  temperature: 0.2,
};

export function settingsFromPreset(
  preset: ProviderPreset,
  current: LlmSettings,
): LlmSettings {
  return { ...current, preset };
}

export function canCallLlm(settings: LlmSettings, groqConfigured: boolean): boolean {
  if (settings.preset === "ollama") return true;
  return groqConfigured;
}
