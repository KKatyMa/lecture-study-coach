import { NextResponse } from "next/server";
import { testLlmConnection } from "@/lib/llm-server";
import { LlmSettingsSchema } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const settings = LlmSettingsSchema.parse(json.settings ?? json);
    const result = await testLlmConnection(settings);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status && result.status >= 400 ? result.status : 503 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid test request.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
