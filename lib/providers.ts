import type { LlmSettings } from "@/lib/schema";

export type ProviderPreset = LlmSettings["preset"];

export const PROVIDER_PRESETS: Record<
  Exclude<ProviderPreset, "custom">,
  { label: string; baseUrl: string; model: string; hint: string; needsKey: boolean }
> = {
  ollama: {
    label: "Ollama (local, free)",
    baseUrl: "http://localhost:11434/v1",
    model: "qwen2.5:14b",
    hint: "Run `ollama serve` and `ollama pull qwen2.5:14b`. No API key required. Prefer qwen2.5:32b if you have 16GB+ VRAM.",
    needsKey: false,
  },
  groq: {
    label: "Groq (Llama 3.3 70B)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    hint: "Fast and inexpensive open-weight Llama. Get a key at console.groq.com.",
    needsKey: true,
  },
  deepseek: {
    label: "DeepSeek-V3",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    hint: "Open-weight model with strong academic extraction. Get a key at platform.deepseek.com.",
    needsKey: true,
  },
};

export const DEFAULT_SETTINGS: LlmSettings = {
  preset: "groq",
  baseUrl: PROVIDER_PRESETS.groq.baseUrl,
  model: PROVIDER_PRESETS.groq.model,
  apiKey: "",
  temperature: 0.2,
};

export function settingsFromPreset(
  preset: ProviderPreset,
  current: LlmSettings,
): LlmSettings {
  if (preset === "custom") {
    return { ...current, preset: "custom" };
  }
  const next = PROVIDER_PRESETS[preset];
  return {
    ...current,
    preset,
    baseUrl: next.baseUrl,
    model: next.model,
  };
}

export function canCallLlm(settings: LlmSettings): boolean {
  if (!settings.baseUrl.trim() || !settings.model.trim()) return false;
  if (settings.preset === "ollama") return true;
  if (settings.preset === "custom") {
    const local =
      settings.baseUrl.includes("localhost") ||
      settings.baseUrl.includes("127.0.0.1");
    return local || settings.apiKey.trim().length > 0;
  }
  return settings.apiKey.trim().length > 0;
}

export function authHeaderValue(settings: LlmSettings): string {
  if (settings.apiKey.trim()) return settings.apiKey.trim();
  return "ollama";
}
