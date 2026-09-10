import type { NextRequest } from "next/server";
import { AIConfigError } from "@/lib/ai";
import { analyzeRequestSchema } from "@/lib/analysis/schema";
import { runAnalysis } from "@/lib/analysis/run";

// LLM calls take a while — allow up to 5 minutes on platforms that honour this.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".") || "input";
    const message =
      issue && issue.code !== "invalid_type"
        ? issue.message
        : `Missing or invalid field: ${field}.`;
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const { result, provider, model } = await runAnalysis(parsed.data);
    return Response.json({ result, provider, model });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    console.error("[analyze] failed:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}
