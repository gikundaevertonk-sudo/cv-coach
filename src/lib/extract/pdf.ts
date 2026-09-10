import { extractText, getDocumentProxy } from "unpdf";

/** Upper bound on an uploaded PDF, enforced before we try to parse it. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
/** Refuse very long PDFs — a CV or a job posting is never this long. */
export const MAX_PDF_PAGES = 30;

export class PdfExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractError";
  }
}

/**
 * Pulls plain text out of a PDF. Throws {@link PdfExtractError} with a
 * user-facing message when the file is unreadable, too long, or has no
 * extractable text (e.g. a scan) — callers should surface that as a 4xx.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    pdf = await getDocumentProxy(bytes);
  } catch {
    throw new PdfExtractError("That file could not be read as a PDF.");
  }

  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new PdfExtractError(
      `That PDF has ${pdf.numPages} pages; the limit is ${MAX_PDF_PAGES}.`,
    );
  }

  const { text } = await extractText(pdf, { mergePages: true });
  const cleaned = normalizeWhitespace(text);

  if (cleaned.length < 30) {
    throw new PdfExtractError(
      "Couldn't pull readable text from that PDF — it may be a scan or image-only file. Paste the text instead.",
    );
  }
  return cleaned;
}

/** Collapse the ragged spacing PDF text extraction tends to produce. */
function normalizeWhitespace(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
