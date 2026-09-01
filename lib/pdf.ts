import type { ExtractedPdf, PdfPage } from "@/lib/schema";

const TARGET_CHUNK_CHARS = 12000;
const MIN_TEXT_CHARS = 200;

export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function extractPdf(file: File): Promise<ExtractedPdf> {
  if (typeof window === "undefined") {
    throw new Error("PDF extraction runs in the browser.");
  }

  const buffer = await file.arrayBuffer();
  const fileHash = await hashArrayBuffer(buffer);

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  const pages: PdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
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
