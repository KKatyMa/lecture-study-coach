/** Client-only Groq API key storage (sessionStorage). Never import from server code. */

const GROQ_KEY_STORAGE = "lsc.groq.apiKey.v1";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getGroqApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(GROQ_KEY_STORAGE);
  return value?.trim() ? value.trim() : null;
}

export function setGroqApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GROQ_KEY_STORAGE, apiKey.trim());
  emit();
}

export function clearGroqApiKey(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GROQ_KEY_STORAGE);
  emit();
}

export function subscribeGroqApiKey(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGroqApiKeySnapshot(): string | null {
  return getGroqApiKey();
}

export function getServerGroqApiKeySnapshot(): string | null {
  return null;
}
