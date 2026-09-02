/** Normalize heterogeneous LLM JSON into flashcard list shape. */

type JsonRecord = Record<string, unknown>;

const CARD_WRAPPER_KEYS = ["cards", "flashcards", "flash_cards", "items", "data", "result"] as const;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapCards(raw: unknown, depth = 0): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw) || depth > 3) return [];

  for (const key of CARD_WRAPPER_KEYS) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = unwrapCards(value, depth + 1);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function normalizeType(value: unknown): "term" | "cloze" | "contrast" {
  const text = String(value ?? "term").toLowerCase();
  if (text.includes("cloze") || text.includes("blank")) return "cloze";
  if (text.includes("contrast") || text.includes("compare") || text.includes("versus")) return "contrast";
  return "term";
}

function normalizeDifficulty(value: unknown): "core" | "standard" | "advanced" {
  const text = String(value ?? "standard").toLowerCase();
  if (text.includes("core") || text.includes("exam")) return "core";
  if (text.includes("advanced") || text.includes("hard")) return "advanced";
  return "standard";
}

function pickString(record: JsonRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function coerceFlashcardsPayload(raw: unknown): unknown[] {
  const list = unwrapCards(raw);
  if (list.length === 0) {
    throw new Error("The model JSON did not contain flashcards.");
  }

  return list.map((item, index) => {
    const card = isRecord(item) ? item : {};
    const conceptIdsRaw = card.conceptIds ?? card.concept_ids ?? card.concepts ?? [];
    const conceptIds = Array.isArray(conceptIdsRaw)
      ? conceptIdsRaw.map(String).filter(Boolean)
      : typeof conceptIdsRaw === "string"
        ? conceptIdsRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [];

    return {
      id: pickString(card, ["id"]) || `card-${index + 1}`,
      type: normalizeType(card.type ?? card.card_type ?? card.kind),
      front: pickString(card, ["front", "question", "prompt", "q"]) || `Card ${index + 1}`,
      back: pickString(card, ["back", "answer", "a", "response"]) || "Answer not provided.",
      difficulty: normalizeDifficulty(card.difficulty ?? card.level),
      sourceHint: pickString(card, ["sourceHint", "source_hint", "source", "section"]),
      conceptIds,
    };
  });
}
