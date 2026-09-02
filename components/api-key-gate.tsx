"use client";

import { useState } from "react";
import { StudyApp } from "@/components/study-app";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearGroqApiKey,
  getGroqApiKeySnapshot,
  getServerGroqApiKeySnapshot,
  setGroqApiKey,
  subscribeGroqApiKey,
} from "@/lib/groq-session";
import { defaultGroqModel } from "@/lib/providers";
import { FlaskConical, GraduationCap, KeyRound, Loader2 } from "lucide-react";
import { useSyncExternalStore } from "react";

async function validateGroqKeyFromClient(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch("/api/groq/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null;
  return { ok: Boolean(payload?.ok), error: payload?.error };
}

function ApiKeyEntryScreen({
  onSuccess,
  onDemo,
}: {
  onSuccess: () => void;
  onDemo: () => void;
}) {
  const [apiKey, setApiKeyInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("Please paste your Groq API key.");
      return;
    }

    setBusy(true);
    setError(null);
    const result = await validateGroqKeyFromClient(trimmed);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "That Groq API key could not be verified.");
      return;
    }

    setGroqApiKey(trimmed);
    onSuccess();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground">
          <GraduationCap className="size-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold">Lecture Study Coach</h1>
          <p className="text-sm text-muted-foreground">
            Bring your own Groq API key to analyze lecture PDFs
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            Enter your Groq API key
          </CardTitle>
          <CardDescription>
            Your key stays in this browser tab only (<code className="text-xs">sessionStorage</code>
            ). It is sent to this app&apos;s server with each model request and is never saved on
            the server, in cookies, or in git.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="groqApiKey">Groq API key</Label>
              <Input
                id="groqApiKey"
                type="password"
                autoComplete="off"
                placeholder="gsk_…"
                value={apiKey}
                onChange={(event) => setApiKeyInput(event.target.value)}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                Get a free key at{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  console.groq.com
                </a>
                . Default model: <code className="text-xs">{defaultGroqModel()}</code>
              </p>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Key not accepted</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" size="lg" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              Continue to study tool
            </Button>
          </form>

          <div className="mt-6 border-t pt-6">
            <p className="mb-3 text-sm text-muted-foreground">
              No key yet? Try the bundled demo lecture — outline, cards, and quiz work without
              calling Groq.
            </p>
            <Button variant="secondary" className="w-full" onClick={onDemo} disabled={busy}>
              <FlaskConical />
              Load demo lecture (no key)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ApiKeyGate() {
  const groqApiKey = useSyncExternalStore(
    subscribeGroqApiKey,
    getGroqApiKeySnapshot,
    getServerGroqApiKeySnapshot,
  );
  const [demoBypass, setDemoBypass] = useState(false);

  function handleForgetKey() {
    clearGroqApiKey();
    setDemoBypass(false);
  }

  if (!groqApiKey && !demoBypass) {
    return (
      <ApiKeyEntryScreen
        onSuccess={() => {
          /* sessionStorage update re-renders via useSyncExternalStore */
        }}
        onDemo={() => setDemoBypass(true)}
      />
    );
  }

  return (
    <StudyApp
      groqApiKey={groqApiKey}
      demoOnly={demoBypass && !groqApiKey}
      onForgetGroqKey={groqApiKey ? handleForgetKey : undefined}
    />
  );
}
