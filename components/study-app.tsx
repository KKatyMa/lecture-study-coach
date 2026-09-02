"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CardsPanel } from "@/components/cards-panel";
import { OutlinePanel } from "@/components/outline-panel";
import { QuizPanel, type QuizAnswer } from "@/components/quiz-panel";
import { SettingsSheet } from "@/components/settings-sheet";
import { StepNav, type StepId } from "@/components/step-nav";
import { UploadPanel } from "@/components/upload-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_CARDS, DEMO_FILE_NAME, DEMO_HASH, DEMO_OUTLINE, DEMO_PAGE_COUNT, DEMO_WORD_COUNT } from "@/lib/demo";
import { LlmRequestError, requestCards, requestOutline } from "@/lib/llm-client";
import { chunkPages } from "@/lib/pdf";
import { canCallLlm } from "@/lib/providers";
import { buildQuiz } from "@/lib/quiz";
import type { Concept, ExtractedPdf, Flashcard, Outline, Question } from "@/lib/schema";
import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  loadSessionByHash,
  saveSession,
  subscribeSettings,
  writeSettings,
} from "@/lib/storage";
import { GraduationCap, Loader2 } from "lucide-react";

type SessionState = {
  fileName: string;
  fileHash: string;
  pageCount: number;
  wordCount: number;
  isDemo: boolean;
  extracted: ExtractedPdf | null;
  outline: Outline | null;
  selectedConceptIds: string[];
  cards: Flashcard[];
  selectedCardIds: string[];
};

const EMPTY_SESSION: SessionState = {
  fileName: "",
  fileHash: "",
  pageCount: 0,
  wordCount: 0,
  isDemo: false,
  extracted: null,
  outline: null,
  selectedConceptIds: [],
  cards: [],
  selectedCardIds: [],
};

function persist(session: SessionState) {
  if (!session.fileHash || !session.outline) return;
  saveSession({
    id: session.fileHash,
    fileName: session.fileName,
    fileHash: session.fileHash,
    pageCount: session.pageCount,
    wordCount: session.wordCount,
    isDemo: session.isDemo,
    outline: session.outline,
    selectedConceptIds: session.selectedConceptIds,
    cards: session.cards,
    selectedCardIds: session.selectedCardIds,
    updatedAt: Date.now(),
  });
}

export function StudyApp() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const [step, setStep] = useState<StepId>("upload");
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizKey, setQuizKey] = useState(0);

  useEffect(() => {
    persist(session);
  }, [session]);

  const llmReady = canCallLlm(settings);

  const enabled = useMemo(
    () => ({
      upload: true,
      outline: Boolean(session.outline),
      cards: session.cards.length > 0,
      quiz: questions.length > 0 || session.selectedCardIds.length > 0,
    }),
    [session.outline, session.cards.length, session.selectedCardIds.length, questions.length],
  );

  function applySettings(next: Parameters<typeof writeSettings>[0]) {
    writeSettings(next);
  }

  function loadDemo() {
    setError(null);
    setQuestions([]);
    setAnswers([]);
    setSession({
      fileName: DEMO_FILE_NAME,
      fileHash: DEMO_HASH,
      pageCount: DEMO_PAGE_COUNT,
      wordCount: DEMO_WORD_COUNT,
      isDemo: true,
      extracted: {
        fileName: DEMO_FILE_NAME,
        fileHash: DEMO_HASH,
        pageCount: DEMO_PAGE_COUNT,
        wordCount: DEMO_WORD_COUNT,
        pages: [],
        text: "",
      },
      outline: DEMO_OUTLINE,
      selectedConceptIds: DEMO_OUTLINE.concepts
        .filter((concept) => concept.importance === "core")
        .map((concept) => concept.id),
      cards: [],
      selectedCardIds: [],
    });
    setStep("outline");
  }

  function onExtracted(pdf: ExtractedPdf) {
    const cached = loadSessionByHash(pdf.fileHash);
    setError(null);
    setQuestions([]);
    setAnswers([]);
    if (cached?.outline) {
      setSession({
        fileName: pdf.fileName,
        fileHash: pdf.fileHash,
        pageCount: pdf.pageCount,
        wordCount: pdf.wordCount,
        isDemo: cached.isDemo,
        extracted: pdf,
        outline: cached.outline,
        selectedConceptIds: cached.selectedConceptIds,
        cards: cached.cards,
        selectedCardIds: cached.selectedCardIds,
      });
      setStep("outline");
      return;
    }
    setSession({
      ...EMPTY_SESSION,
      fileName: pdf.fileName,
      fileHash: pdf.fileHash,
      pageCount: pdf.pageCount,
      wordCount: pdf.wordCount,
      extracted: pdf,
    });
  }

  async function analyzePdf() {
    if (!session.extracted) return;
    if (!llmReady) {
      setError("Open Model, paste your API key, or load the demo lecture.");
      return;
    }
    setBusy(true);
    setError(null);
    setProgress("Reading lecture text…");
    try {
      const chunks = chunkPages(session.extracted.pages);
      const outline = await requestOutline({
        settings,
        fileName: session.fileName,
        chunks,
        onProgress: setProgress,
      });
      setSession((current) => ({
        ...current,
        outline,
        selectedConceptIds: outline.concepts
          .filter((concept) => concept.importance === "core")
          .map((concept) => concept.id),
        cards: [],
        selectedCardIds: [],
        isDemo: false,
      }));
      setStep("outline");
    } catch (caught) {
      const message =
        caught instanceof LlmRequestError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Outline generation failed.";
      setError(message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function generateCards() {
    if (!session.outline) return;
    const selected = session.outline.concepts.filter((concept) =>
      session.selectedConceptIds.includes(concept.id),
    );
    if (selected.length === 0) return;

    if (session.isDemo) {
      const demoCards = DEMO_CARDS.filter((card) =>
        card.conceptIds.some((id) => session.selectedConceptIds.includes(id)),
      );
      const cards = demoCards.length > 0 ? demoCards : DEMO_CARDS;
      setSession((current) => ({
        ...current,
        cards,
        selectedCardIds: cards.filter((card) => card.difficulty === "core").map((card) => card.id),
      }));
      setStep("cards");
      return;
    }

    if (!llmReady) {
      setError("Open Model and paste your API key, or use the demo lecture.");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress("Drafting term, cloze, and contrast cards…");
    try {
      const cards = await requestCards({
        settings: { ...settings, temperature: Math.min(0.5, settings.temperature + 0.2) },
        title: session.outline.title,
        concepts: selected,
      });
      setSession((current) => ({
        ...current,
        cards,
        selectedCardIds: cards.filter((card) => card.difficulty === "core").map((card) => card.id),
      }));
      setStep("cards");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Card generation failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function startQuiz(fromCards?: Flashcard[]) {
    if (!session.outline) return;
    const pool = fromCards ?? session.cards.filter((card) => session.selectedCardIds.includes(card.id));
    const nextQuestions = buildQuiz(pool, session.outline.concepts, Math.min(10, Math.max(6, pool.length)));
    setQuestions(nextQuestions);
    setAnswers([]);
    setQuizKey((value) => value + 1);
    setStep("quiz");
  }

  function retryMisses() {
    const missedIds = new Set(
      answers.filter((answer) => !answer.correct).map((answer) => answer.questionId),
    );
    const missedCards = session.cards.filter((card) =>
      questions.some((question) => missedIds.has(question.id) && question.cardId === card.id),
    );
    startQuiz(missedCards.length > 0 ? missedCards : undefined);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary p-2 text-primary-foreground">
                <GraduationCap className="size-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold leading-tight">Lecture Study Coach</p>
                <p className="text-sm text-muted-foreground">
                  Outline, cards, and retrieval practice for master&apos;s lectures
                </p>
              </div>
            </div>
            <SettingsSheet settings={settings} onChange={applySettings} />
          </div>
          <StepNav
            current={step}
            enabled={enabled}
            onSelect={(next) => {
              if (next === "quiz" && questions.length === 0 && session.selectedCardIds.length > 0) {
                startQuiz();
                return;
              }
              setStep(next);
            }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {busy ? (
          <Alert>
            <Loader2 className="animate-spin" />
            <AlertTitle>Working</AlertTitle>
            <AlertDescription>{progress ?? "Talking to the local or remote model…"}</AlertDescription>
          </Alert>
        ) : null}

        {error && step !== "upload" ? (
          <Alert variant="destructive">
            <AlertTitle>The model call failed</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error}</span>
              <span>
                Check your provider, model id, and API key in Model settings. You can still use the demo lecture.
              </span>
              <div>
                <Button size="sm" variant="outline" onClick={loadDemo}>
                  Load demo lecture
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        {step === "upload" ? (
          <UploadPanel
            settings={settings}
            busy={busy}
            error={error}
            extracted={session.extracted}
            onExtracted={onExtracted}
            onDemo={loadDemo}
            onAnalyze={() => void analyzePdf()}
          />
        ) : null}

        {step === "outline" && session.outline ? (
          <OutlinePanel
            outline={session.outline}
            selectedConceptIds={session.selectedConceptIds}
            busy={busy}
            onToggleConcept={(id, selected) =>
              setSession((current) => ({
                ...current,
                selectedConceptIds: selected
                  ? [...current.selectedConceptIds, id]
                  : current.selectedConceptIds.filter((item) => item !== id),
              }))
            }
            onUpdateConcept={(id, patch: Partial<Concept>) =>
              setSession((current) => {
                if (!current.outline) return current;
                return {
                  ...current,
                  outline: {
                    ...current.outline,
                    concepts: current.outline.concepts.map((concept) =>
                      concept.id === id ? { ...concept, ...patch } : concept,
                    ),
                  },
                };
              })
            }
            onSelectCore={() =>
              setSession((current) => ({
                ...current,
                selectedConceptIds:
                  current.outline?.concepts
                    .filter((concept) => concept.importance === "core")
                    .map((concept) => concept.id) ?? [],
              }))
            }
            onSelectAll={(selected) =>
              setSession((current) => ({
                ...current,
                selectedConceptIds: selected
                  ? (current.outline?.concepts.map((concept) => concept.id) ?? [])
                  : [],
              }))
            }
            onGenerateCards={() => void generateCards()}
          />
        ) : null}

        {step === "outline" && !session.outline && busy ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : null}

        {step === "cards" ? (
          <CardsPanel
            cards={session.cards}
            selectedCardIds={session.selectedCardIds}
            onToggle={(id, selected) =>
              setSession((current) => ({
                ...current,
                selectedCardIds: selected
                  ? [...current.selectedCardIds, id]
                  : current.selectedCardIds.filter((item) => item !== id),
              }))
            }
            onSelectAll={(selected) =>
              setSession((current) => ({
                ...current,
                selectedCardIds: selected ? current.cards.map((card) => card.id) : [],
              }))
            }
            onSelectCore={() =>
              setSession((current) => ({
                ...current,
                selectedCardIds: current.cards
                  .filter((card) => card.difficulty === "core")
                  .map((card) => card.id),
              }))
            }
            onStartQuiz={() => startQuiz()}
          />
        ) : null}

        {step === "quiz" ? (
          <QuizPanel
            key={quizKey}
            questions={questions}
            answers={answers}
            onAnswersChange={setAnswers}
            onRetryMisses={retryMisses}
            onRetryAll={() => startQuiz()}
          />
        ) : null}
      </main>
    </div>
  );
}
