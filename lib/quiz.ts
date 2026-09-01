import type { Concept, Flashcard, Question } from "@/lib/schema";
import { newId } from "@/lib/schema";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function distractorsFrom(pool: string[], correct: string, n: number): string[] {
  const normalized = correct.trim().toLowerCase();
  const candidates = shuffle(
    unique(pool).filter((item) => item.trim().toLowerCase() !== normalized),
  );
  return candidates.slice(0, n);
}

const GENERIC_DISTRACTORS = [
  "the sampling distribution of the test statistic under the null",
  "a point estimate that ignores parameter uncertainty",
  "the frequentist coverage of a random interval before the data are seen",
  "a hyperparameter of the hierarchical model with no likelihood contribution",
  "the residual sum of squares after ordinary least squares",
];

function padDistractors(current: string[], correct: string, needed: number): string[] {
  if (current.length >= needed) return current.slice(0, needed);
  const extra = distractorsFrom(GENERIC_DISTRACTORS, correct, needed - current.length);
  return [...current, ...extra].slice(0, needed);
}

function mcq(
  prompt: string,
  correct: string,
  wrong: string[],
  explanation: string,
  card: Flashcard,
): Question {
  const choices = shuffle([
    { id: "a", text: correct },
    ...padDistractors(wrong, correct, 3).map((text, i) => ({
      id: String.fromCharCode(98 + i),
      text,
    })),
  ]).map((choice, i) => ({ ...choice, id: String.fromCharCode(97 + i) }));

  const correctChoice = choices.find((choice) => choice.text === correct) ?? choices[0];

  return {
    id: newId("q"),
    type: "mcq",
    prompt,
    choices,
    correctChoiceId: correctChoice.id,
    explanation,
    sourceHint: card.sourceHint,
    cardId: card.id,
  };
}

function recallQuestion(prompt: string, accepted: string[], explanation: string, card: Flashcard): Question {
  return {
    id: newId("q"),
    type: "recall",
    prompt,
    acceptedAnswers: unique(accepted),
    explanation,
    sourceHint: card.sourceHint,
    cardId: card.id,
  };
}

function conceptById(concepts: Concept[], id: string): Concept | undefined {
  return concepts.find((concept) => concept.id === id);
}

function clozeAnswer(card: Flashcard, concepts: Concept[]): string {
  const fromBack = card.back.split("—")[0]?.trim() || card.back.trim();
  const mentioned = card.conceptIds
    .map((id) => conceptById(concepts, id))
    .find((concept) => {
      if (!concept) return false;
      return fromBack.toLowerCase().includes(concept.term.toLowerCase());
    });
  return mentioned?.term ?? fromBack;
}

export function buildQuiz(cards: Flashcard[], concepts: Concept[], limit = 10): Question[] {
  if (cards.length === 0) return [];

  const termPool = concepts.map((concept) => concept.term);
  const definitionPool = concepts.map((concept) => concept.definition);
  const questions: Question[] = [];

  const ordered = [
    ...cards.filter((card) => card.difficulty === "core"),
    ...cards.filter((card) => card.difficulty !== "core"),
  ];

  for (const card of ordered) {
    if (questions.length >= limit) break;
    const primary = conceptById(concepts, card.conceptIds[0] ?? "");

    if (card.type === "term") {
      const useRecall = questions.filter((q) => q.type === "recall").length < Math.ceil(limit / 3);
      if (useRecall && primary) {
        questions.push(
          recallQuestion(
            `Name the term that matches this definition:\n\n${primary.definition}`,
            [primary.term, card.front],
            card.back,
            card,
          ),
        );
      } else {
        questions.push(
          mcq(
            `Which definition best matches “${card.front}”?`,
            card.back,
            distractorsFrom(definitionPool, card.back, 6),
            `${card.front}: ${card.back}`,
            card,
          ),
        );
      }
      continue;
    }

    if (card.type === "cloze") {
      const blank = clozeAnswer(card, concepts);
      questions.push(
        mcq(
          card.front,
          blank,
          distractorsFrom(termPool, blank, 6),
          card.back,
          card,
        ),
      );
      continue;
    }

    questions.push(
      mcq(
        card.front,
        card.back,
        distractorsFrom(
          cards.filter((item) => item.id !== card.id).map((item) => item.back),
          card.back,
          6,
        ),
        card.back,
        card,
      ),
    );
  }

  return shuffle(questions).slice(0, limit);
}

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function gradeRecall(given: string, accepted: string[]): boolean {
  const g = normalizeAnswer(given);
  if (!g) return false;
  return accepted.some((item) => {
    const n = normalizeAnswer(item);
    if (!n) return false;
    if (g === n) return true;
    if (n.length >= 4 && (g.includes(n) || n.includes(g))) return true;
    const gTokens = new Set(g.split(" "));
    const nTokens = n.split(" ").filter((t) => t.length > 2);
    if (nTokens.length === 0) return false;
    const overlap = nTokens.filter((t) => gTokens.has(t)).length;
    return overlap / nTokens.length >= 0.7;
  });
}
