/** Normalize heterogeneous LLM JSON into the outline shape expected by Zod. */

type JsonRecord = Record<string, unknown>;

const OUTLINE_WRAPPER_KEYS = [
  "outline",
  "merged_outline",
  "lecture_outline",
  "study_outline",
  "data",
  "result",
  "output",
  "lecture",
  "response",
] as const;

const SECTION_LIST_KEYS = ["sections", "outline_sections", "topics", "structure", "parts"] as const;
const CONCEPT_LIST_KEYS = ["concepts", "key_concepts", "terms", "vocabulary", "definitions"] as const;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(record: JsonRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickArray(record: JsonRecord, keys: readonly string[]): unknown[] | undefined {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return undefined;
}

function unwrapOutline(raw: unknown, depth = 0): JsonRecord | null {
  if (!isRecord(raw) || depth > 4) return null;

  const hasDirect =
    pickString(raw, ["title"]) ||
    pickArray(raw, SECTION_LIST_KEYS) ||
    pickArray(raw, CONCEPT_LIST_KEYS);

  if (hasDirect) return raw;

  for (const key of OUTLINE_WRAPPER_KEYS) {
    const nested = raw[key];
    if (isRecord(nested)) {
      const unwrapped = unwrapOutline(nested, depth + 1);
      if (unwrapped) return unwrapped;
    }
  }

  for (const value of Object.values(raw)) {
    if (isRecord(value)) {
      const unwrapped = unwrapOutline(value, depth + 1);
      if (unwrapped) return unwrapped;
    }
  }

  return raw;
}

function normalizeLevel(value: unknown): 1 | 2 {
  if (value === 1 || value === "1" || value === 1.0) return 1;
  if (value === 2 || value === "2" || value === 2.0) return 2;
  return 1;
}

function normalizeBullets(section: JsonRecord): string[] {
  const raw = section.bullets ?? section.key_points ?? section.points ?? section.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isRecord(item)) {
        return pickString(item, ["text", "bullet", "point", "content"]) ?? "";
      }
      return String(item);
    })
    .filter(Boolean);
}

function normalizeChildren(section: JsonRecord): JsonRecord[] {
  const raw =
    section.children ??
    section.subsections ??
    section.sub_sections ??
    section.subSections ??
    section.nested;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecord);
}

function normalizeSection(raw: unknown, index: number, prefix: string): JsonRecord {
  const section = isRecord(raw) ? raw : {};
  const title =
    pickString(section, ["title", "heading", "name", "section", "topic"]) ??
    `Section ${index + 1}`;
  const id =
    pickString(section, ["id"]) ??
    `${prefix}-${index + 1}`;

  return {
    id,
    title,
    level: normalizeLevel(section.level),
    bullets: normalizeBullets(section),
    children: normalizeChildren(section).map((child, i) =>
      normalizeSection({ ...child, level: 2 }, i, id),
    ),
  };
}

function normalizeImportance(value: unknown): "core" | "supporting" {
  if (value === "supporting" || value === "secondary" || value === "optional") return "supporting";
  return "core";
}

function normalizeConcept(raw: unknown, index: number): JsonRecord {
  const concept = isRecord(raw) ? raw : {};
  const term =
    pickString(concept, ["term", "name", "concept", "title", "label"]) ??
    `Concept ${index + 1}`;
  const definition =
    pickString(concept, ["definition", "def", "meaning", "description"]) ??
    "Definition not provided by the model.";
  const whyItMatters =
    pickString(concept, ["whyItMatters", "why_it_matters", "why_it_is_important", "importance_note", "rationale"]) ??
    "";
  const relatedRaw = concept.relatedTerms ?? concept.related_terms ?? concept.related ?? [];
  const relatedTerms = Array.isArray(relatedRaw)
    ? relatedRaw.map(String).filter(Boolean)
    : typeof relatedRaw === "string"
      ? relatedRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    id: pickString(concept, ["id"]) ?? `concept-${index + 1}`,
    term,
    definition,
    whyItMatters: whyItMatters || "Important for exam-level understanding of this lecture.",
    relatedTerms,
    sourceHint: pickString(concept, ["sourceHint", "source_hint", "source", "section"]) ?? "",
    importance: normalizeImportance(concept.importance),
  };
}

export function coerceOutlinePayload(raw: unknown): JsonRecord {
  const record = unwrapOutline(raw);
  if (!record) {
    throw new Error("The model did not return a JSON object for the outline.");
  }

  const sectionsRaw = pickArray(record, SECTION_LIST_KEYS) ?? [];
  const conceptsRaw = pickArray(record, CONCEPT_LIST_KEYS) ?? [];

  if (sectionsRaw.length === 0 && conceptsRaw.length === 0) {
    throw new Error(
      "The model JSON did not contain sections or concepts. Try Extract outline again.",
    );
  }

  const title =
    pickString(record, ["title", "lecture_title", "name", "heading"]) ??
    "Lecture outline";
  const summary =
    pickString(record, ["summary", "overview", "abstract", "synopsis"]) ??
    "Summary unavailable — the model omitted a lecture summary.";

  return {
    title,
    summary,
    sections: sectionsRaw.map((section, i) => normalizeSection(section, i, "sec")),
    concepts: conceptsRaw.map((concept, i) => normalizeConcept(concept, i)),
  };
}

export function stripThinkingTags(text: string): string {
  return text
    .replace(/[\s\S]*?<\/think>/gi, "")
    .replace(/<\|im_start\|>[\s\S]*?<\|im_end\|>/gi, "")
    .trim();
}

export function extractJsonValue(raw: string): unknown {
  const cleaned = stripThinkingTags(raw.trim());
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : cleaned;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model did not return a JSON object.");
  }

  const jsonText = candidate.slice(start, end + 1);
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error("The model returned malformed JSON.");
  }
}
