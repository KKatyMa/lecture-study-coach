import type { ExtractedPdf, PdfPage } from "@/lib/schema";
import { ensurePdfPolyfills } from "@/lib/pdf-polyfills";

const TARGET_CHUNK_CHARS = 12000;
const MIN_TEXT_CHARS = 200;

export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fallbackHashArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hash = 0x811c9dc5;
  const step = Math.max(1, Math.floor(bytes.length / 65536));

  for (let index = 0; index < bytes.length; index += step) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv-${(hash >>> 0).toString(16)}-${bytes.length.toString(16)}`;
}

export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      /* fall through to non-crypto hash on insecure contexts (e.g. mobile over HTTP LAN) */
    }
  }

  return fallbackHashArrayBuffer(buffer);
}

function configurePdfWorker(GlobalWorkerOptions: { workerSrc: string }): void {
  GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
}

export async function extractPdf(file: File): Promise<ExtractedPdf> {
  if (typeof window === "undefined") {
    throw new Error("PDF extraction runs in the browser.");
  }

  ensurePdfPolyfills();

  const buffer = await file.arrayBuffer();
  const fileHash = await hashArrayBuffer(buffer);

  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  configurePdfWorker(GlobalWorkerOptions);

  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  const pages: PdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: { str?: string }) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ pageNumber, text });
  }

  const text = pages
    .map((page) => (page.text ? `\n\n--- Page ${page.pageNumber} ---\n${page.text}` : ""))
    .join("")
    .trim();

  if (text.replace(/\s/g, "").length < MIN_TEXT_CHARS) {
    throw new Error(
      "This PDF has almost no extractable text. It is probably a scan. This version does not run OCR — please upload a text-based lecture PDF.",
    );
  }

  return {
    fileName: file.name,
    fileHash,
    pageCount: doc.numPages,
    wordCount: wordCount(text),
    pages,
    text,
  };
}

export function chunkPages(pages: PdfPage[], maxChars = TARGET_CHUNK_CHARS): string[] {
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
    current = "";
  };

  for (const page of pages) {
    const block = `\n\n--- Page ${page.pageNumber} ---\n${page.text}`;
    if (current.length > 0 && current.length + block.length > maxChars) {
      push();
    }
    current += block;
  }
  push();
  return chunks.length > 0 ? chunks : [""];
}

export function needsMapReduce(pages: PdfPage[]): boolean {
  const total = pages.reduce((sum, page) => sum + page.text.length, 0);
  return total > TARGET_CHUNK_CHARS * 1.2;
}
