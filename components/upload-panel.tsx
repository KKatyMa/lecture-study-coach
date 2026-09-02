"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canCallLlm } from "@/lib/providers";
import type { ExtractedPdf, LlmSettings } from "@/lib/schema";
import { FileText, FlaskConical, Loader2, Upload } from "lucide-react";

type UploadPanelProps = {
  settings: LlmSettings;
  groqApiKey?: string | null;
  demoOnly?: boolean;
  busy: boolean;
  error: string | null;
  extracted: ExtractedPdf | null;
  onExtracted: (pdf: ExtractedPdf) => void;
  onDemo: () => void;
  onAnalyze: () => void;
};

export function UploadPanel({
  settings,
  groqApiKey = null,
  demoOnly = false,
  busy,
  error,
  extracted,
  onExtracted,
  onDemo,
  onAnalyze,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const ready = canCallLlm(settings, groqApiKey);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setLocalError("Please drop a PDF file.");
      return;
    }
    setLocalError(null);
    const { extractPdf } = await import("@/lib/pdf");
    try {
      const result = await extractPdf(file);
      onExtracted(result);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Could not read that PDF.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Lecture PDF</CardTitle>
          <CardDescription>
            Text-based slides, notes, or a chapter. Scanned image PDFs are not supported yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              void handleFile(event.dataTransfer.files[0]);
            }}
            className={`flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
              dragOver ? "border-primary bg-accent" : "border-border bg-muted/40 hover:bg-muted/70"
            }`}
          >
            <Upload className="size-8 text-primary" />
            <div>
              <p className="font-medium">Drop a lecture PDF here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {extracted ? (
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{extracted.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {extracted.pageCount} pages · {extracted.wordCount.toLocaleString()} words ·{" "}
                    {extracted.fileHash.slice(0, 10)}
                  </p>
                </div>
              </div>
              <Button onClick={onAnalyze} disabled={busy || !ready} size="lg">
                {busy ? <Loader2 className="animate-spin" /> : null}
                Extract outline
              </Button>
            </div>
          ) : null}

          {!ready ? (
            <Alert>
              <AlertTitle>{demoOnly ? "Demo mode — no Groq key" : "Groq API key required"}</AlertTitle>
              <AlertDescription>
                {demoOnly ? (
                  <>
                    You opened the demo without a key. Upload your own PDF after entering a Groq key
                    on the welcome screen.
                  </>
                ) : (
                  <>
                    Enter your Groq API key on the welcome screen before extracting outlines. Or use{" "}
                    <strong>Load demo lecture</strong> below without any key.
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : null}

          {localError || error ? (
            <Alert variant="destructive">
              <AlertTitle>Could not continue</AlertTitle>
              <AlertDescription>{localError ?? error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Try the demo lecture</CardTitle>
            <CardDescription>
              STA 621 — Maximum Likelihood and Bayesian Inference. Pre-extracted outline, cards, and
              quiz so you can learn the workflow without an API key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" className="w-full" onClick={onDemo} disabled={busy} size="lg">
                <FlaskConical />
                Load demo lecture
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  const response = await fetch("/sample-lecture.pdf");
                  const blob = await response.blob();
                  const file = new File([blob], "STA621-sample-lecture.pdf", {
                    type: "application/pdf",
                  });
                  await handleFile(file);
                }}
              >
                Extract bundled sample PDF
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>A hierarchical outline and a concept table are generated from the PDF.</li>
              <li>You tick the concepts you actually want to memorise.</li>
              <li>Candidate flashcards appear; keep only the ones worth drilling.</li>
              <li>A short quiz mixes multiple-choice and recall items from your deck.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
