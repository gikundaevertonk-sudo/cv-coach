import { z } from "zod";
import { MAX_FIELD_CHARS } from "@/lib/analysis/schema";

/** What the browser sends to /api/tailor. */
export const tailorRequestSchema = z.object({
  cv: z
    .string()
    .trim()
    .min(50, "Paste your CV text (at least a few sentences).")
    .max(MAX_FIELD_CHARS),
  /** Skills the candidate has that the CV doesn't mention — usable, not invented. */
  additionalSkills: z.string().trim().max(500).optional().or(z.literal("")),
  job: z.object({
    title: z.string().trim().min(1, "The job needs a title.").max(200),
    company: z.string().trim().max(200).nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    snippet: z.string().trim().max(2000).optional().default(""),
  }),
});

export type TailorRequest = z.infer<typeof tailorRequestSchema>;

/** Model output — a rewritten CV, a cover letter, and a short changelog. */
export const tailorResultSchema = z.object({
  tailoredCv: z.string().min(1),
  coverLetter: z.string().min(1),
  notes: z.array(z.string()).max(6).default([]),
});

export type TailorResult = z.infer<typeof tailorResultSchema>;
