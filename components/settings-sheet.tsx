"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { testGroqFromClient, useGroqStatus } from "@/hooks/use-groq-status";
import { PROVIDER_PRESETS, settingsFromPreset } from "@/lib/providers";
import type { LlmSettings } from "@/lib/schema";
import { CheckCircle2, Loader2, Settings2, XCircle } from "lucide-react";

type SettingsSheetProps = {
  settings: LlmSettings;
  onChange: (settings: LlmSettings) => void;
};

export function SettingsSheet({ settings, onChange }: SettingsSheetProps) {
  const groqStatus = useGroqStatus();
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const presetMeta = PROVIDER_PRESETS[settings.preset];

  async function runGroqTest() {
    setTesting(true);
    setTestMessage(null);
    setTestOk(null);
    const result = await testGroqFromClient();
    setTesting(false);
    setTestOk(result.ok);
    if (result.ok) {
      setTestMessage(`Groq replied: “${result.reply}” (${result.model})`);
      return;
    }
    setTestMessage(result.error ?? "Groq test failed.");
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        <Settings2 />
        Model
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Model settings</SheetTitle>
          <SheetDescription>
            Groq credentials live in <code className="text-xs">.env.local</code> on the server. The
            browser never sees your API key.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="preset">Provider</Label>
            <Select
              value={settings.preset}
              onValueChange={(value) => {
                if (!value) return;
                onChange(settingsFromPreset(value as LlmSettings["preset"], settings));
              }}
            >
              <SelectTrigger id="preset" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq">Groq — Qwen3.8 27B</SelectItem>
                <SelectItem value="ollama">Ollama — local Qwen2.5</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">{presetMeta.hint}</p>
          </div>

          {settings.preset === "groq" ? (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                {groqStatus.loading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : groqStatus.configured ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <XCircle className="size-4 text-destructive" />
                )}
                {groqStatus.loading
                  ? "Checking server…"
                  : groqStatus.configured
                    ? "GROQ_API_KEY is configured on the server"
                    : "GROQ_API_KEY is missing on the server"}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Model: <span className="font-mono">{groqStatus.model}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={testing || groqStatus.loading}
                onClick={() => void runGroqTest()}
              >
                {testing ? <Loader2 className="animate-spin" /> : null}
                Test Groq connection
              </Button>
              {testMessage ? (
                <Alert variant={testOk ? "default" : "destructive"} className="mt-3">
                  <AlertTitle>{testOk ? "Groq OK" : "Groq API error"}</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed">{testMessage}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              Ollama model: <span className="font-mono">{presetMeta.model}</span>. Override with{" "}
              <span className="font-mono">OLLAMA_MODEL</span> in <span className="font-mono">.env.local</span>.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="temperature">Temperature ({settings.temperature.toFixed(1)})</Label>
            <input
              id="temperature"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(event) =>
                onChange({ ...settings, temperature: Number(event.target.value) })
              }
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              Keep this low for outlines. 0.2 is a good default; raise it slightly if cards feel too stiff.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
