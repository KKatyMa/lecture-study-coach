import { NextResponse } from "next/server";
import { GROQ_MODEL, testGroqConnection } from "@/lib/groq-server";

export async function GET() {
  const result = await testGroqConnection();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        model: GROQ_MODEL,
        error: result.error,
        status: result.status ?? null,
      },
      { status: result.status && result.status >= 400 && result.status < 600 ? result.status : 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    model: result.model,
    reply: result.reply,
  });
}
