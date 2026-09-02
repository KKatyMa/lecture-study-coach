import { NextResponse } from "next/server";
import { z } from "zod";
import {
  cardsPrompt,
  outlineMapPrompt,
  outlinePrompt,
  outlineReducePrompt,
  SYSTEM_PROMPT,
} from "@/lib/prompts";
import { resolveServerLlmConfig } from "@/lib/server-llm";
import { coerceOutlinePayload } from "@/lib/normalize-outline";
import { LlmSettingsSchema, extractJsonObject } from "@/lib/schema";

export const maxDuration = 120;

const RequestSchema = z.object({
  action: z.enum(["outline", "outline-map", "outline-reduce", "cards"]),
  settings: LlmSettingsSchema,
  fileName: z.string().optional(),
  text: z.string().optional(),
  chunkIndex: z.number().optional(),
  chunkCount: z.number().optional(),
  partials: z.array(z.unknown()).optional(),
  title: z.string().optional(),
  concepts: z.array(z.unknown()).optional(),
});

function userPrompt(body: z.infer<typeof RequestSchema>): string {
  const fileName = body.fileName ?? "lecture.pdf";
  switch (body.action) {
    case "outline":
      return outlinePrompt(body.text ?? "", fileName);
    case "outline-map":
      return outlineMapPrompt(
        body.text ?? "",
        fileName,
        body.chunkIndex ?? 0,
        body.chunkCount ?? 1,
      );
    case "outline-reduce":
      return outlineReducePrompt(JSON.stringify(body.partials ?? [], null, 2), fileName);
    case "cards":
      return cardsPrompt(body.title ?? fileName, JSON.stringify(body.concepts ?? [], null, 2));
    default:
      throw new Error("Unsupported action.");
  }
}

function shouldRequestJsonObject(baseUrl: string): boolean {
  const url = baseUrl.toLowerCase();
  if (url.includes("11434") || url.includes("localhost") || url.includes("127.0.0.1")) {
    return false;
  }
  return true;
}

async function callChat(
  config: ReturnType<typeof resolveServerLlmConfig>,
  prompt: string,
  jsonMode: boolean,
): Promise<{ ok: boolean; status: number; text: string }> {
  const payload: Record<string, unknown> = {
    model: config.model,
    temperature: config.temperature,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  };
  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await response.text();
    return { ok: response.ok, status: response.status, text: raw };
  } finally {
    clearTimeout(timeout);
  }
}

function readContent(raw: string): string {
  const parsed = JSON.parse(raw) as {
    choices?: {
      message?: {
        content?: string | Array<{ text?: string; type?: string }> | null;
        reasoning?: string | null;
      };
    }[];
    error?: { message?: string };
  };
  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }

  const message = parsed.choices?.[0]?.message;
  if (!message) {
    throw new Error("The model response did not include a message.");
  }

  let content = "";
  if (typeof message.content === "string") {
    content = message.content;
  } else if (Array.isArray(message.content)) {
    content = message.content.map((part) => part.text ?? "").join("");
  }

  content = content.trim();
  if (!content && typeof message.reasoning === "string" && message.reasoning.trim()) {
    content = message.reasoning.trim();
  }

  if (!content) {
    throw new Error("The model response did not include message content.");
  }
  return content;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = RequestSchema.parse(json);
    const config = resolveServerLlmConfig(body.settings);
    const prompt = userPrompt(body);
    const jsonMode = shouldRequestJsonObject(config.baseUrl);

    let result = await callChat(config, prompt, jsonMode);
    if (!result.ok && jsonMode && result.status === 400) {
      result = await callChat(config, prompt, false);
    }

    if (!result.ok) {
      let detail = result.text.slice(0, 400);
      try {
        const err = JSON.parse(result.text) as { error?: { message?: string } | string };
        if (typeof err.error === "string") detail = err.error;
        if (typeof err.error === "object" && err.error?.message) detail = err.error.message;
      } catch {
        /* keep slice */
      }
      return NextResponse.json(
        {
          error: `Model request failed (${result.status}): ${detail}`,
        },
        { status: 502 },
      );
    }

    const content = readContent(result.text);
    let data = extractJsonObject(content);

    if (body.action === "outline" || body.action === "outline-map" || body.action === "outline-reduce") {
      data = coerceOutlinePayload(data);
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    const status = message.includes("abort") ? 504 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
