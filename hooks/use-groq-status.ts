"use client";

import { useEffect, useState } from "react";

type GroqStatus = {
  configured: boolean;
  model: string;
  loading: boolean;
};

export function useGroqStatus(): GroqStatus {
  const [status, setStatus] = useState<GroqStatus>({
    configured: false,
    model: "qwen/qwen3.8-27b",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/groq/status")
      .then((response) => response.json())
      .then((payload: { configured?: boolean; model?: string }) => {
        if (cancelled) return;
        setStatus({
          configured: Boolean(payload.configured),
          model: payload.model ?? "qwen/qwen3.8-27b",
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus((current) => ({ ...current, configured: false, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

export async function testGroqFromClient(): Promise<{
  ok: boolean;
  model?: string;
  reply?: string;
  error?: string;
  status?: number | null;
}> {
  const response = await fetch("/api/groq/test");
  const payload = (await response.json()) as {
    ok?: boolean;
    model?: string;
    reply?: string;
    error?: string;
    status?: number | null;
  };
  return {
    ok: Boolean(payload.ok),
    model: payload.model,
    reply: payload.reply,
    error: payload.error,
    status: payload.status ?? null,
  };
}
