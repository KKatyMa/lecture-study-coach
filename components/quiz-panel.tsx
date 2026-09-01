"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { gradeRecall } from "@/lib/quiz";
import type { Question } from "@/lib/schema";
import { Check, RotateCcw, X } from "lucide-react";

export type QuizAnswer = {
  questionId: string;
  given: string;
  correct: boolean;
};

type QuizPanelProps = {
  questions: Question[];
  answers: QuizAnswer[];
  onAnswersChange: (answers: QuizAnswer[]) => void;
  onRetryMisses: () => void;
  onRetryAll: () => void;
};

export function QuizPanel({
  questions,
  answers,
  onAnswersChange,
  onRetryMisses,
  onRetryAll,
}: QuizPanelProps) {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const current = questions[index];
  const showRecap = questions.length > 0 && index >= questions.length;
  const score = answers.filter((answer) => answer.correct).length;
  const misses = answers.filter((answer) => !answer.correct);

  const existing = useMemo(
    () => answers.find((answer) => answer.questionId === current?.id),
    [answers, current],
  );

  function submit(given: string) {
    if (!current || revealed) return;
    const correct =
      current.type === "mcq"
        ? given === current.correctChoiceId
        : gradeRecall(given, current.acceptedAnswers ?? []);
    setLastCorrect(correct);
    setRevealed(true);
    setDraft(given);
    if (!existing) {
      onAnswersChange([...answers, { questionId: current.id, given, correct }]);
    }
  }

  function goNext() {
    setRevealed(false);
    setLastCorrect(null);
    setDraft("");
    setIndex((value) => Math.min(value + 1, questions.length));
  }

  if (questions.length === 0) {
    return (
      <Alert>
        <AlertTitle>No quiz yet</AlertTitle>
        <AlertDescription>Select memory cards first, then start a quiz from that deck.</AlertDescription>
      </Alert>
    );
  }

  if (showRecap) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Recap</CardTitle>
            <CardDescription>
              {score} of {questions.length} correct ({percent}%). Wrong items stay in the miss list so you
              can drill them immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={percent} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={onRetryAll}>
                <RotateCcw />
                Retake full quiz
              </Button>
              <Button variant="outline" onClick={onRetryMisses} disabled={misses.length === 0}>
                Retry {misses.length} {misses.length === 1 ? "miss" : "misses"}
              </Button>
            </div>
          </CardContent>
        </Card>
        {misses.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {misses.map((miss) => {
              const question = questions.find((item) => item.id === miss.questionId);
              if (!question) return null;
              const correctText =
                question.type === "mcq"
                  ? question.choices?.find((choice) => choice.id === question.correctChoiceId)?.text
                  : question.acceptedAnswers?.[0];
              return (
                <li key={miss.questionId}>
                  <Card>
                    <CardHeader>
                      <Badge variant="destructive">Missed</Badge>
                      <CardTitle className="text-sm leading-snug">{question.prompt}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Your answer: </span>
                        {question.type === "mcq"
                          ? question.choices?.find((choice) => choice.id === miss.given)?.text ?? miss.given
                          : miss.given}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Correct: </span>
                        {correctText}
                      </p>
                      <p className="leading-relaxed text-muted-foreground">{question.explanation}</p>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <Alert>
            <AlertTitle>Clean sweep</AlertTitle>
            <AlertDescription>
              Every selected card survived this pass. Cycle back to Outline if you want a wider concept set.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const progress = Math.round((answers.length / questions.length) * 100);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>
          {score} correct so far
        </span>
      </div>
      <Progress value={progress} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{current.type === "mcq" ? "Multiple choice" : "Short recall"}</Badge>
            {current.sourceHint ? (
              <span className="text-xs text-muted-foreground">{current.sourceHint}</span>
            ) : null}
          </div>
          <CardTitle className="font-heading text-lg leading-snug whitespace-pre-wrap">
            {current.prompt}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {current.type === "mcq" ? (
            <div className="flex flex-col gap-2">
              {current.choices?.map((choice) => {
                const selected = revealed && draft === choice.id;
                const isCorrect = choice.id === current.correctChoiceId;
                const showState = revealed && (selected || isCorrect);
                return (
                  <Button
                    key={choice.id}
                    variant="outline"
                    disabled={revealed}
                    onClick={() => submit(choice.id)}
                    className={`h-auto min-h-10 justify-start whitespace-normal px-3 py-3 text-left ${
                      showState && isCorrect ? "border-emerald-600 bg-emerald-50 text-emerald-950" : ""
                    } ${showState && selected && !isCorrect ? "border-destructive bg-destructive/10" : ""}`}
                  >
                    <span className="mr-2 font-mono text-xs uppercase text-muted-foreground">
                      {choice.id}
                    </span>
                    {choice.text}
                  </Button>
                );
              })}
            </div>
          ) : (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                submit(draft);
              }}
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type the term"
                disabled={revealed}
                autoFocus
              />
              <Button type="submit" disabled={revealed || draft.trim().length === 0}>
                Check
              </Button>
            </form>
          )}

          {revealed ? (
            <div
              className={`rounded-lg border p-3 text-sm leading-relaxed ${
                lastCorrect ? "border-emerald-600/40 bg-emerald-50" : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <p className="mb-1 flex items-center gap-2 font-medium">
                {lastCorrect ? <Check className="size-4" /> : <X className="size-4" />}
                {lastCorrect ? "Correct" : "Not quite"}
              </p>
              <p>{current.explanation}</p>
              {current.type === "recall" && current.acceptedAnswers?.[0] ? (
                <p className="mt-2 text-muted-foreground">Accepted: {current.acceptedAnswers[0]}</p>
              ) : null}
            </div>
          ) : null}

          {revealed ? (
            <Button onClick={goNext} size="lg">
              {index + 1 === questions.length ? "See recap" : "Next question"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
