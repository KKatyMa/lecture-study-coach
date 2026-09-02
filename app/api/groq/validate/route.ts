import { NextResponse } from "next/server";
import { z } from "zod";
import { validateGroqApiKey } from "@/lib/llm-server";

const BodySchema = z.object({
  apiKey: z.string().min(1, "Please enter your Groq API key."),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { apiKey } = BodySchema.parse(json);
    const result = await validateGroqApiKey(apiKey);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "That Groq API key could not be verified." },
        { status: result.status && result.status >= 400 ? result.status : 401 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not validate the Groq API key.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
