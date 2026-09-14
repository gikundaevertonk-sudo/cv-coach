import { z } from "zod";
import { MAX_FIELD_CHARS } from "@/lib/analysis/schema";
import type { JobListing } from "./types";

const cvField = z
  .string()
  .trim()
  .min(50, "Paste your CV text (at least a few sentences).")
  .max(MAX_FIELD_CHARS);

/** What the browser sends to /api/jobs. */
export const jobsRequestSchema = z.object({
  cv: cvField,
  /** Explicit job title / keywords search — overrides the CV-derived query. */
  keywords: z.string().trim().max(200).optional().or(z.literal("")),
  /** Skills the candidate has that the CV doesn't mention — used alongside it. */
  additionalSkills: z.string().trim().max(500).optional().or(z.literal("")),
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

/** What the browser sends to /api/jobs/experience. */
export const experienceRequestSchema = z.object({ cv: cvField });
export type ExperienceRequest = z.infer<typeof experienceRequestSchema>;

/** One distinct position lifted from the CV, in the candidate's own words. */
export const workRoleSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  period: z.string().optional(),
});
export type WorkRole = z.infer<typeof workRoleSchema>;

/** Model step — every distinct role found in the CV, most recent first. */
export const experienceSchema = z.object({
  roles: z.array(workRoleSchema).min(1).max(10),
});
export type Experience = z.infer<typeof experienceSchema>;

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
  /**
   * True when the board returned listings but none scored well enough to
   * recommend — distinct from a plain zero-listing search, so the UI can
   * say which actually happened instead of a generic "nothing found".
   */
  weakOnly?: boolean;
};
