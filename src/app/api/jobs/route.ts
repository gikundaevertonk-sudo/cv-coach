import type { NextRequest } from "next/server";
import { AIConfigError } from "@/lib/ai";
import { JobSearchError, JobsConfigError } from "@/lib/jobs";
import { findJobs } from "@/lib/jobs/run";
import { jobsRequestSchema } from "@/lib/jobs/schema";

// Two model calls plus an external search — give it room.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = jobsRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".") || "input";
    const message =
      issue && issue.code !== "invalid_type"
        ? issue.message
        : `Missing or invalid field: ${field}.`;
    return Response.json({ error: message }, { status: 400 });
  }

  const input = {
    ...parsed.data,
    location: parsed.data.location || undefined,
    country: parsed.data.country || undefined,
  };

  try {
    return Response.json(await findJobs(input));
  } catch (err) {
    if (err instanceof AIConfigError || err instanceof JobsConfigError) {
      return Response.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof JobSearchError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    console.error("[jobs] failed:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong. Try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}
