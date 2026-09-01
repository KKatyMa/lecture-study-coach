"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Concept, Outline } from "@/lib/schema";
import { Layers3 } from "lucide-react";

type OutlinePanelProps = {
  outline: Outline;
  selectedConceptIds: string[];
  onToggleConcept: (id: string, selected: boolean) => void;
  onUpdateConcept: (id: string, patch: Partial<Concept>) => void;
  onSelectCore: () => void;
  onSelectAll: (selected: boolean) => void;
  onGenerateCards: () => void;
  busy: boolean;
};

function SectionBlock({
  title,
  bullets,
  children,
}: {
  title: string;
  bullets: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-primary/30 pl-4">
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      {children ? <div className="mt-4 flex flex-col gap-4">{children}</div> : null}
    </div>
  );
}

export function OutlinePanel({
  outline,
  selectedConceptIds,
  onToggleConcept,
  onUpdateConcept,
  onSelectCore,
  onSelectAll,
  onGenerateCards,
  busy,
}: OutlinePanelProps) {
  const selectedCount = selectedConceptIds.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="min-h-[28rem]">
        <CardHeader>
          <CardTitle className="font-heading text-xl leading-snug">{outline.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">{outline.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[32rem] pr-3">
            <div className="flex flex-col gap-6 pb-4">
              {outline.sections.map((section) => (
                <SectionBlock key={section.id} title={section.title} bullets={section.bullets}>
                  {section.children?.map((child) => (
                    <SectionBlock key={child.id} title={child.title} bullets={child.bullets} />
                  ))}
                </SectionBlock>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="min-h-[28rem]">
        <CardHeader>
          <CardTitle>Concepts to learn</CardTitle>
          <CardDescription>
            Tick what you want to memorise. Edited definitions become the source of truth for cards and
            quiz items.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onSelectAll(true)}>
              Select all
            </Button>
            <Button variant="outline" size="sm" onClick={onSelectCore}>
              Core only
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onSelectAll(false)}>
              Clear
            </Button>
          </div>
          <ScrollArea className="h-[22rem] pr-3">
            <ul className="flex flex-col gap-3 pb-2">
              {outline.concepts.map((concept) => {
                const checked = selectedConceptIds.includes(concept.id);
                return (
                  <li key={concept.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => onToggleConcept(concept.id, value === true)}
                        className="mt-1"
                        aria-label={`Select ${concept.term}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{concept.term}</p>
                          <Badge variant={concept.importance === "core" ? "default" : "secondary"}>
                            {concept.importance}
                          </Badge>
                          {concept.sourceHint ? (
                            <span className="text-xs text-muted-foreground">{concept.sourceHint}</span>
                          ) : null}
                        </div>
                        <Textarea
                          value={concept.definition}
                          onChange={(event) =>
                            onUpdateConcept(concept.id, { definition: event.target.value })
                          }
                          className="mt-2 min-h-16"
                        />
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {concept.whyItMatters}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
          <Button onClick={onGenerateCards} disabled={busy || selectedCount === 0} size="lg">
            <Layers3 />
            Generate {selectedCount} concept {selectedCount === 1 ? "card set" : "card sets"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
