import type { z } from "zod";

/** Pull a JSON object out of a model reply that may be fenced or padded. */
export function extractJSON(raw: string): unknown {
  let text = raw.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) text = fence[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  return JSON.parse(text);
}

/**
 * Parse and validate a model reply against a Zod schema. Returns `null` on any
 * failure (bad JSON, shape mismatch) so callers can trigger a repair retry.
 */
export function parseModelJSON<T>(raw: string, schema: z.ZodType<T>): T | null {
  try {
    return schema.parse(extractJSON(raw));
  } catch {
    return null;
  }
}
