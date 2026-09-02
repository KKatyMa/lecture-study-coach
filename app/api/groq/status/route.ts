import { NextResponse } from "next/server";
import { GROQ_MODEL, isGroqConfigured } from "@/lib/groq-server";

export async function GET() {
  return NextResponse.json({
    configured: isGroqConfigured(),
    model: GROQ_MODEL,
  });
}
