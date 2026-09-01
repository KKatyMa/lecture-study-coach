"use client";

import { useMemo } from "react";
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
import { PROVIDER_PRESETS, settingsFromPreset } from "@/lib/providers";
import type { LlmSettings } from "@/lib/schema";
import { Settings2 } from "lucide-react";

type SettingsSheetProps = {
  settings: LlmSettings;
  onChange: (settings: LlmSettings) => void;
};

export function SettingsSheet({ settings, onChange }: SettingsSheetProps) {
  const presetMeta = useMemo(() => {
    if (settings.preset === "custom") {
      return {
        hint: "Any OpenAI-compatible endpoint: Together, Fireworks, vLLM, LM Studio, OpenRouter, siliconflow, and similar.",
        needsKey: true,
      };
    }
    return PROVIDER_PRESETS[settings.preset];
  }, [settings.preset]);

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        <Settings2 />
        Model
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Open-weight models</SheetTitle>
          <SheetDescription>
            Keys stay in this browser and are sent only to the endpoint you choose. Nothing is stored on a server.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="preset">Provider preset</Label>
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
                <SelectItem value="groq">Groq — Llama 3.3 70B</SelectItem>
                <SelectItem value="ollama">Ollama — local Qwen2.5</SelectItem>
                <SelectItem value="deepseek">DeepSeek-V3</SelectItem>
                <SelectItem value="custom">Custom OpenAI-compatible</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">{presetMeta.hint}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={settings.baseUrl}
              onChange={(event) => onChange({ ...settings, baseUrl: event.target.value })}
              placeholder="https://api.groq.com/openai/v1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model">Model name</Label>
            <Input
              id="model"
              value={settings.model}
              onChange={(event) => onChange({ ...settings, model: event.target.value })}
              placeholder="llama-3.3-70b-versatile"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="apiKey">API key</Label>
            <Input
              id="apiKey"
              type="password"
              autoComplete="off"
              value={settings.apiKey}
              onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
              placeholder={settings.preset === "ollama" ? "Not required for Ollama" : "Paste key"}
            />
          </div>

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
