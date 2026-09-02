import { DEFAULT_SETTINGS } from "@/lib/providers";
import { LlmSettingsSchema, type Flashcard, type LlmSettings, type Outline } from "@/lib/schema";

const SETTINGS_KEY = "lsc.settings.v1";
const SESSION_INDEX_KEY = "lsc.sessions.v1";

const settingsListeners = new Set<() => void>();

function emitSettings() {
  settingsListeners.forEach((listener) => listener());
}

let cachedSettings: LlmSettings = DEFAULT_SETTINGS;
let cachedSettingsRaw: string | null = null;

export function getSettingsSnapshot(): LlmSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw === cachedSettingsRaw) return cachedSettings;
  cachedSettingsRaw = raw;
  cachedSettings = loadSettings();
  return cachedSettings;
}

export function getServerSettingsSnapshot(): LlmSettings {
  return DEFAULT_SETTINGS;
}

export function subscribeSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
}

export function writeSettings(settings: LlmSettings): void {
  saveSettings(settings);
  cachedSettings = settings;
  cachedSettingsRaw = typeof window === "undefined" ? null : localStorage.getItem(SETTINGS_KEY);
  emitSettings();
}

export type StoredSession = {
  id: string;
  fileName: string;
  fileHash: string;
  pageCount: number;
  wordCount: number;
  isDemo: boolean;
  outline: Outline | null;
  selectedConceptIds: string[];
  cards: Flashcard[];
  selectedCardIds: string[];
  updatedAt: number;
};

export function loadSettings(): LlmSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Drop legacy client-side fields (apiKey, baseUrl, model) from older builds.
    const preset = parsed.preset === "ollama" ? "ollama" : "groq";
    const temperature = parsed.temperature;
    return LlmSettingsSchema.parse({
      ...DEFAULT_SETTINGS,
      preset,
      ...(typeof temperature === "number" ? { temperature } : {}),
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: LlmSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadIndex(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listSessions(): StoredSession[] {
  return loadIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadSessionByHash(fileHash: string): StoredSession | null {
  return loadIndex().find((session) => session.fileHash === fileHash) ?? null;
}

export function saveSession(session: StoredSession): void {
  const index = loadIndex().filter((item) => item.fileHash !== session.fileHash);
  index.unshift(session);
  localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(index.slice(0, 12)));
}

export function clearSession(fileHash: string): void {
  const index = loadIndex().filter((item) => item.fileHash !== fileHash);
  localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(index));
}
