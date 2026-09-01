import type { Flashcard, LlmSettings, Outline } from "@/lib/schema";
import { parseFlashcards, parseOutline } from "@/lib/schema";

export class LlmRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmRequestError";
  }
}

async function postLlm(body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; data?: unknown }
    | null;

  if (!response.ok) {
    throw new LlmRequestError(payload?.error ?? `The model request failed (${response.status}).`);
  }
  if (!payload || payload.data === undefined) {
    throw new LlmRequestError("The model returned an empty response.");
  }
  return payload.data;
}

export async function requestOutline(options: {
  settings: LlmSettings;
  fileName: string;
  chunks: string[];
  onProgress?: (message: string) => void;
}): Promise<Outline> {
  const { settings, fileName, chunks, onProgress } = options;

  if (chunks.length === 1) {
    onProgress?.("Writing the outline and concept list…");
    const data = await postLlm({
      action: "outline",
      settings,
      fileName,
      text: chunks[0],
    });
    return parseOutline(data);
  }

  const partials: unknown[] = [];
  for (let i = 0; i < chunks.length; i += 1) {
    onProgress?.(`Extracting concepts from chunk ${i + 1} of ${chunks.length}…`);
    const data = await postLlm({
      action: "outline-map",
      settings,
      fileName,
      text: chunks[i],
      chunkIndex: i,
      chunkCount: chunks.length,
    });
    partials.push(data);
  }

  onProgress?.("Merging section outlines into one lecture map…");
  const merged = await postLlm({
    action: "outline-reduce",
    settings,
    fileName,
    partials,
  });
  return parseOutline(merged);
}

export async function requestCards(options: {
  settings: LlmSettings;
  title: string;
  concepts: Outline["concepts"];
}): Promise<Flashcard[]> {
  const data = await postLlm({
    action: "cards",
    settings: options.settings,
    title: options.title,
    concepts: options.concepts,
  });
  return parseFlashcards(data);
}
