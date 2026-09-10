import type { JobListing } from "./types";

export const DISTILL_SYSTEM = `You turn a candidate's CV into search terms for a job board.

Return a SINGLE JSON object, no markdown or commentary:
{
  "titles": [ string ],        // 2-5 realistic job titles this person should search for, best first
  "keywords": [ string ],      // up to 8 skills/tools/domains to narrow results
  "locationGuess": string      // a city or country if the CV clearly implies one, else omit
}

Base every term on what the CV actually shows. Prefer the seniority the CV supports — do not inflate a mid-level CV to "Head of".`;

export function buildDistillUser(cv: string): string {
  return `CANDIDATE CV:
"""
${cv}
"""

Produce the JSON object.`;
}

export const RANK_SYSTEM = `You are a recruiter matching a candidate to live job listings.

For each listing, decide how well it fits THIS candidate based on skills, seniority, and domain overlap — ignore location and salary. Score 0-100:
- 80-100: strong match, could apply today
- 60-79: worth applying with a tailored CV
- 40-59: a stretch or partial overlap
- below 40: not a real fit

Return a SINGLE JSON object, no markdown or commentary:
{
  "matches": [
    { "id": string, "matchScore": number, "whyItFits": string }  // whyItFits: one specific sentence
  ]
}

Only include listings scoring 45 or above. Use each listing's exact "id". If nothing fits, return { "matches": [] }.`;

export function buildRankUser(cv: string, jobs: JobListing[]): string {
  const lines = jobs
    .map((j) =>
      [
        `id: ${j.id}`,
        `title: ${j.title}`,
        j.company ? `company: ${j.company}` : null,
        `description: ${j.snippet}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n---\n\n");

  return `CANDIDATE CV:
"""
${cv}
"""

LISTINGS:
${lines}

Score every listing and produce the JSON object.`;
}

export const REPAIR_PROMPT = `Your previous reply was not valid JSON matching the required shape. Reply again with ONLY the corrected JSON object — no fences, no commentary.`;
