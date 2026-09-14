import { z } from "zod";
import { MAX_FIELD_CHARS } from "@/lib/analysis/schema";
import type { JobListing } from "./types";

/** What the browser sends to /api/jobs. */
export const jobsRequestSchema = z.object({
  cv: z
    .string()
    .trim()
    .min(50, "Paste your CV text (at least a few sentences).")
    .max(MAX_FIELD_CHARS),
  /** Explicit job title / keywords search — overrides the CV-derived query. */
  keywords: z.string().trim().max(200).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  /** "remote" and "onsite" are mutually exclusive; "any" (default) mixes both. */
  workMode: z.enum(["any", "remote", "onsite"]).optional().default("any"),
  country: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}$/, "Country must be a 2-letter code.")
    .optional()
    .or(z.literal("")),
  /** Restrict to listings originally posted on these sites (JSearch only). */
  publishers: z.array(z.enum(["linkedin", "indeed"])).max(2).optional(),
});

export type JobsRequest = z.infer<typeof jobsRequestSchema>;

/** Model step 1 — search terms distilled from the CV. */
export const searchTermsSchema = z.object({
  titles: z.array(z.string().min(1)).min(1).max(6),
  keywords: z.array(z.string().min(1)).max(12).default([]),
  locationGuess: z.string().optional(),
});

export type SearchTerms = z.infer<typeof searchTermsSchema>;

/** Model step 2 — a fit score + reason per listing. */
export const rankingSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      matchScore: z.number().min(0).max(100),
      whyItFits: z.string(),
    }),
  ),
});

export type Ranking = z.infer<typeof rankingSchema>;

/** A listing plus the model's verdict — what the client renders. */
export type RankedJob = JobListing & {
  matchScore: number;
  whyItFits: string;
};

export type JobSearchResponse = {
  jobs: RankedJob[];
  query: { what: string; where: string | null };
  source: string;
  provider: string;
  model: string;
  /** Set when a request couldn't be fully honoured, e.g. a publisher filter
   * that the active job source doesn't support. */
  notice?: string;
};
