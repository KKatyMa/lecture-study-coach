import { z } from "zod";

export const ImportanceSchema = z.enum(["core", "supporting"]);
export type Importance = z.infer<typeof ImportanceSchema>;

export const ConceptSchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
  whyItMatters: z.string(),
  relatedTerms: z.array(z.string()).default([]),
  sourceHint: z.string().default(""),
  importance: ImportanceSchema.default("core"),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const OutlineSectionSchema: z.ZodType<OutlineSection> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    level: z.union([z.literal(1), z.literal(2)]),
    bullets: z.array(z.string()).default([]),
    children: z.array(OutlineSectionSchema).optional(),
  }),
);

export type OutlineSection = {
  id: string;
  title: string;
  level: 1 | 2;
  bullets: string[];
  children?: OutlineSection[];
};

export const OutlineSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(OutlineSectionSchema),
  concepts: z.array(ConceptSchema),
});
export type Outline = z.infer<typeof OutlineSchema>;

export const CardTypeSchema = z.enum(["term", "cloze", "contrast"]);
export type CardType = z.infer<typeof CardTypeSchema>;

export const DifficultySchema = z.enum(["core", "standard", "advanced"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const FlashcardSchema = z.object({
  id: z.string(),
  type: CardTypeSchema,
  front: z.string(),
  back: z.string(),
  difficulty: DifficultySchema.default("standard"),
  sourceHint: z.string().default(""),
  conceptIds: z.array(z.string()).default([]),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const QuestionChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "recall"]),
  prompt: z.string(),
  choices: z.array(QuestionChoiceSchema).optional(),
  correctChoiceId: z.string().optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  explanation: z.string(),
  sourceHint: z.string().default(""),
  cardId: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const LlmSettingsSchema = z.object({
  preset: z.enum(["ollama", "groq", "deepseek", "custom"]),
  baseUrl: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().default(""),
  temperature: z.number().min(0).max(2).default(0.2),
});
export type LlmSettings = z.infer<typeof LlmSettingsSchema>;

export const PdfPageSchema = z.object({
  pageNumber: z.number(),
  text: z.string(),
});
export type PdfPage = z.infer<typeof PdfPageSchema>;

export const ExtractedPdfSchema = z.object({
  fileName: z.string(),
  fileHash: z.string(),
  pageCount: z.number(),
  wordCount: z.number(),
  pages: z.array(PdfPageSchema),
  text: z.string(),
});
export type ExtractedPdf = z.infer<typeof ExtractedPdfSchema>;

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model did not return a JSON object.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function withId<T extends { id?: string }>(item: T, prefix: string, index: number): T & { id: string } {
  return {
    ...item,
    id: item.id && item.id.length > 0 ? item.id : `${prefix}-${index + 1}`,
  };
}

function normalizeSection(section: OutlineSection, index: number, prefix: string): OutlineSection {
  const id = section.id && section.id.length > 0 ? section.id : `${prefix}-${index + 1}`;
  return {
    ...section,
    id,
    bullets: section.bullets ?? [],
    children: section.children?.map((child, i) =>
      normalizeSection(child, i, `${id}`),
    ),
  };
}

export function parseOutline(raw: unknown): Outline {
  const parsed = OutlineSchema.parse(raw);
  return {
    ...parsed,
    sections: parsed.sections.map((section, i) => normalizeSection(section, i, "sec")),
    concepts: parsed.concepts.map((concept, i) => withId(concept, "concept", i)),
  };
}

export function parseFlashcards(raw: unknown): Flashcard[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "object" && raw && "cards" in raw
      ? (raw as { cards: unknown }).cards
      : null;
  if (!Array.isArray(list)) {
    throw new Error("The model did not return a flashcard list.");
  }
  return z.array(FlashcardSchema).parse(list.map((card, i) => withId(card as Flashcard, "card", i)));
}

export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
