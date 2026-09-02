import type { LlmSettings } from "@/lib/schema";

export type ProviderPreset = LlmSettings["preset"];

export type ProviderPresetMeta = {
  label: string;
  baseUrl: string;
  model: string;
  hint: string;
  needsKey: boolean;
  supportsJsonMode: boolean;
};

export const PROVIDER_PRESETS: Record<Exclude<ProviderPreset, "custom">, ProviderPresetMeta> = {
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "qwen/qwen3.8-27b",
    hint: "Free tier at console.groq.com. Also try llama-3.3-70b-versatile.",
    needsKey: true,
    supportsJsonMode: true,
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "qwen/qwen-2.5-72b-instruct",
    hint: "One key, many models. Paste any model id from openrouter.ai/models.",
    needsKey: true,
    supportsJsonMode: true,
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    hint: "Strong for long PDFs. Key from platform.deepseek.com.",
    needsKey: true,
    supportsJsonMode: true,
  },
  ollama: {
    label: "Ollama (local)",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:14b",
    hint: "Free on your machine: ollama serve && ollama pull qwen2.5:14b",
    needsKey: false,
    supportsJsonMode: false,
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

export function isLocalBaseUrl(baseUrl: string): boolean {
  const url = baseUrl.toLowerCase();
  return url.includes("localhost") || url.includes("127.0.0.1") || url.includes("0.0.0.0");
}

export function canCallLlm(settings: LlmSettings): boolean {
  if (!settings.baseUrl.trim() || !settings.model.trim()) return false;
  if (settings.preset === "ollama" || isLocalBaseUrl(settings.baseUrl)) return true;
  return settings.apiKey.trim().length > 0;
}

export function presetMeta(settings: LlmSettings): ProviderPresetMeta {
  if (settings.preset !== "custom") {
    return PROVIDER_PRESETS[settings.preset];
  }
  return {
    label: "Custom",
    baseUrl: settings.baseUrl,
    model: settings.model,
    hint: "Any OpenAI-compatible endpoint (Together, Fireworks, LM Studio, vLLM, …).",
    needsKey: !isLocalBaseUrl(settings.baseUrl),
    supportsJsonMode: !isLocalBaseUrl(settings.baseUrl),
  };
}
