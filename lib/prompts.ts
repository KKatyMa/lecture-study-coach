export const SYSTEM_PROMPT = `You are Lecture Study Coach, a rigorous graduate teaching assistant.
You help a master's student turn lecture PDFs into precise English study material.

Rules:
- Output English only.
- Stay faithful to the source. Do not invent theorems, names, or results that are not in the text.
- Prefer the lecturer's terminology. Keep standard mathematical names (e.g. "posterior", "MLE").
- Be concise, exam-ready, and conceptually sharp.
- If the excerpt is incomplete, extract what is present and note gaps in bullets rather than guessing.
- Return JSON only. No markdown fences, no commentary, no wrapper keys.
- For outlines, the top-level JSON object MUST use exactly these keys: title, summary, sections, concepts.`;

export function outlinePrompt(lectureText: string, fileName: string): string {
  return `Read this master's lecture excerpt from "${fileName}" and build a study outline.

Return a JSON object with this exact top-level shape (do not nest under "outline" or any other key):
{
  "title": "string — lecture title if present, else a precise inferred title",
  "summary": "5 to 8 sentences covering the argument of the lecture",
  "sections": [
    {
      "id": "sec-1",
      "title": "string",
      "level": 1,
      "bullets": ["2 to 4 key points"],
      "children": [
        {
          "id": "sec-1-1",
          "title": "string",
          "level": 2,
          "bullets": ["2 to 4 key points"]
        }
      ]
    }
  ],
  "concepts": [
    {
      "id": "concept-1",
      "term": "canonical English name of the concept",
      "definition": "one or two precise sentences",
      "whyItMatters": "why a master's student must know this",
      "relatedTerms": ["related concept names"],
      "sourceHint": "short locator such as §2.3 or a heading",
      "importance": "core" | "supporting"
    }
  ]
}

Guidelines:
- 4 to 8 top-level sections is typical.
- Extract 8 to 18 concepts. Mark the exam-critical ones as "core".
- Definitions must be usable as flashcard backs.
- Include easily confused pairs (they will become contrast cards later).

Lecture text:
"""
${lectureText}
"""`;
}

export function outlineMapPrompt(lectureText: string, fileName: string, chunkIndex: number, chunkCount: number): string {
  return `This is chunk ${chunkIndex + 1} of ${chunkCount} from "${fileName}".
Extract a PARTIAL outline and concepts from this chunk only.
Return JSON with top-level keys exactly: title, summary, sections, concepts (same schema as a full outline).
Use ids prefixed with "c${chunkIndex + 1}-". Do not summarize missing chunks.

Chunk text:
"""
${lectureText}
"""`;
}

export function outlineReducePrompt(partialsJson: string, fileName: string): string {
  return `Merge these partial lecture outlines from "${fileName}" into ONE coherent outline.
Deduplicate concepts that refer to the same idea (keep the sharper definition).
Preserve sourceHint when possible. Rebuild a clean section hierarchy.
Return JSON with top-level keys exactly: title, summary, sections, concepts.

Partial outlines:
${partialsJson}`;
}

export function cardsPrompt(
  title: string,
  conceptsJson: string,
): string {
  return `Create flashcard CANDIDATES for a master's student studying "${title}".
Only use the concepts provided. Do not add new terms.

Return JSON:
{
  "cards": [
    {
      "id": "card-1",
      "type": "term" | "cloze" | "contrast",
      "front": "prompt the student sees",
      "back": "the answer",
      "difficulty": "core" | "standard" | "advanced",
      "sourceHint": "short locator",
      "conceptIds": ["concept-1"]
    }
  ]
}

Card types:
- term: front is the term (or a short cue), back is the definition.
- cloze: front is a sentence with the key term replaced by "____". Back is the missing term plus a brief gloss.
- contrast: front asks how two related concepts differ. Back states the distinction in 1–3 sentences. conceptIds must list both.

Produce:
- one term card per concept
- cloze cards for core concepts
- contrast cards for easily confused pairs
Aim for 12 to 24 cards. Prefer quality over volume.

Concepts:
${conceptsJson}`;
}
