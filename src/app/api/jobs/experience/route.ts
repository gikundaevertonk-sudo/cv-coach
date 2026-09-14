import type { NextRequest } from "next/server";
import { AIConfigError } from "@/lib/ai";
import { extractRoles } from "@/lib/jobs/run";
import { experienceRequestSchema } from "@/lib/jobs/schema";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = experienceRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json(
      { error: issue?.message || "Missing or invalid field: cv." },
      { status: 400 },
    );
  }

  try {
    const roles = await extractRoles(parsed.data);
    return Response.json({ roles });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    console.error("[jobs/experience] failed:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}
