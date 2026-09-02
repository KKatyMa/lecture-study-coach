"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { canCallLlm, presetMeta, settingsFromPreset } from "@/lib/providers";
import type { LlmSettings } from "@/lib/schema";
import { Loader2, Settings2 } from "lucide-react";

type SettingsSheetProps = {
  settings: LlmSettings;
  onChange: (settings: LlmSettings) => void;
};

export async function testLlmFromClient(settings: LlmSettings) {
  const response = await fetch("/api/llm/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
  return (await response.json()) as {
    ok?: boolean;
    model?: string;
    reply?: string;
    error?: string;
    status?: number;
  };
}

export function SettingsSheet({ settings, onChange }: SettingsSheetProps) {
  const meta = presetMeta(settings);
  const ready = canCallLlm(settings);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  async function runTest() {
    setTesting(true);
    setTestMessage(null);
    setTestOk(null);
    const result = await testLlmFromClient(settings);
    setTesting(false);
    setTestOk(Boolean(result.ok));
    if (result.ok) {
      setTestMessage(`Connected. Model replied: “${result.reply}” (${result.model})`);
      return;
    }
    setTestMessage(result.error ?? "Connection test failed.");
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
            Your API key is saved only in this browser and sent to your local Next.js server when
            you extract outlines. It is never committed to git.
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
                <SelectItem value="groq">Groq</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="ollama">Ollama (local)</SelectItem>
                <SelectItem value="custom">Custom endpoint</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">{meta.hint}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={settings.baseUrl}
              onChange={(event) => onChange({ ...settings, baseUrl: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model">Model id</Label>
            <Input
              id="model"
              value={settings.model}
              onChange={(event) => onChange({ ...settings, model: event.target.value })}
              placeholder="e.g. qwen/qwen3.8-27b"
            />
          </div>

          {meta.needsKey ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">API key</Label>
              <Input
                id="apiKey"
                type="password"
                autoComplete="off"
                value={settings.apiKey}
                onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
                placeholder="Paste your key — stored locally only"
              />
            </div>
          ) : (
            <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              No API key needed for local Ollama.
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
          </div>

          <Button
            variant="outline"
            disabled={testing || !ready}
            onClick={() => void runTest()}
          >
            {testing ? <Loader2 className="animate-spin" /> : null}
            Test connection
          </Button>

          {testMessage ? (
            <Alert variant={testOk ? "default" : "destructive"}>
              <AlertTitle>{testOk ? "Connected" : "API error"}</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">{testMessage}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
