"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Flashcard } from "@/lib/schema";
import { BookOpenCheck } from "lucide-react";

const TYPE_LABEL: Record<Flashcard["type"], string> = {
  term: "Term → definition",
  cloze: "Cloze",
  contrast: "Contrast",
};

type CardsPanelProps = {
  cards: Flashcard[];
  selectedCardIds: string[];
  onToggle: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onSelectCore: () => void;
  onStartQuiz: () => void;
};

export function CardsPanel({
  cards,
  selectedCardIds,
  onToggle,
  onSelectAll,
  onSelectCore,
  onStartQuiz,
}: CardsPanelProps) {
  const selectedCount = selectedCardIds.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Memory card candidates</h2>
          <p className="text-sm text-muted-foreground">
            Keep the cards you want in your deck. The quiz is built only from what you select.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onSelectAll(true)}>
            Select all
          </Button>
          <Button variant="outline" size="sm" onClick={onSelectCore}>
            Core only
          </Button>
          <Button onClick={onStartQuiz} disabled={selectedCount === 0} size="lg">
            <BookOpenCheck />
            Quiz {selectedCount} {selectedCount === 1 ? "card" : "cards"}
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No cards yet</CardTitle>
            <CardDescription>
              Go back to Outline, tick the concepts you care about, and generate a card set.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {cards.map((card) => {
            const checked = selectedCardIds.includes(card.id);
            return (
              <li key={card.id}>
                <label className="block cursor-pointer">
                  <Card className={checked ? "ring-2 ring-primary/40" : ""}>
                    <CardHeader className="flex flex-row items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => onToggle(card.id, value === true)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{TYPE_LABEL[card.type]}</Badge>
                          <Badge variant={card.difficulty === "core" ? "default" : "secondary"}>
                            {card.difficulty}
                          </Badge>
                          {card.sourceHint ? (
                            <span className="text-xs text-muted-foreground">{card.sourceHint}</span>
                          ) : null}
                        </div>
                        <CardTitle className="mt-2 text-sm leading-snug">{card.front}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">{card.back}</p>
                    </CardContent>
                  </Card>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
