import type { NextRequest } from "next/server";
import { MAX_PDF_BYTES, PdfExtractError, extractPdfText } from "@/lib/extract/pdf";

// PDF parsing is CPU-bound but quick; give it headroom on slow platforms.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected a multipart form with a 'file' field." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was uploaded." }, { status: 400 });
  }

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) {
    return Response.json(
      { error: "Only PDF files are supported. Paste other formats as text." },
      { status: 415 },
    );
  }

  if (file.size === 0) {
    return Response.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    const mb = Math.round(MAX_PDF_BYTES / 1024 / 1024);
    return Response.json(
      { error: `That file is larger than ${mb} MB.` },
      { status: 413 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = await extractPdfText(bytes);
    return Response.json({ text, filename: file.name });
  } catch (err) {
    if (err instanceof PdfExtractError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    console.error("[extract] failed:", err);
    return Response.json(
      {
        error:
          "Could not read that PDF. Try a different file, or paste the text.",
      },
      { status: 500 },
    );
  }
}
