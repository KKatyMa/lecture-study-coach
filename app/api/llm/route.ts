import { NextResponse } from "next/server";
import { z } from "zod";
import {
  cardsPrompt,
  outlineMapPrompt,
  outlinePrompt,
  outlineReducePrompt,
  SYSTEM_PROMPT,
} from "@/lib/prompts";
import {
  callChatCompletion,
  readAssistantContent,
  resolveLlmConfig,
} from "@/lib/llm-server";
import { coerceFlashcardsPayload } from "@/lib/normalize-flashcards";
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

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = RequestSchema.parse(json);
    const config = resolveLlmConfig(body.settings);
    const prompt = userPrompt(body);

    let result = await callChatCompletion(config, SYSTEM_PROMPT, prompt);
    if (!result.ok && config.supportsJsonMode && result.status === 400) {
      result = await callChatCompletion(
        { ...config, supportsJsonMode: false },
        SYSTEM_PROMPT,
        prompt,
      );
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
        { error: `Model request failed (${result.status}): ${detail}` },
        { status: 502 },
      );
    }

    const content = readAssistantContent(result.text);
    let data: unknown = extractJsonObject(content);

    if (body.action === "outline" || body.action === "outline-map" || body.action === "outline-reduce") {
      data = coerceOutlinePayload(data);
    } else if (body.action === "cards") {
      data = { cards: coerceFlashcardsPayload(data) };
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    const status = message.includes("abort") ? 504 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
