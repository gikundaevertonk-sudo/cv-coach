import type { JobListing } from "./types";

function withSkills(cv: string, additionalSkills?: string): string {
  const extra = additionalSkills?.trim();
  if (!extra) return `CANDIDATE CV:\n"""\n${cv}\n"""`;
  return `CANDIDATE CV:
"""
${cv}
"""

ADDITIONAL SKILLS THE CANDIDATE STATES THEY HAVE (real, provided directly by
the candidate — not necessarily written in the CV above, but not invented
either; weigh them the same as anything in the CV):
${extra}`;
}

export const DISTILL_SYSTEM = `You turn a candidate's CV into search terms for a job board.

Return a SINGLE JSON object, no markdown or commentary:
{
  "titles": [ string ],        // 2-5 realistic job titles this person should search for, best first
  "keywords": [ string ],      // up to 8 skills/tools/domains to narrow results
  "locationGuess": string      // a city or country if the CV clearly implies one, else omit
}

Base every term on what the CV (and any stated additional skills) actually shows. Prefer the seniority the CV supports — do not inflate a mid-level CV to "Head of".`;

export function buildDistillUser(cv: string, additionalSkills?: string): string {
  return `${withSkills(cv, additionalSkills)}

Produce the JSON object.`;
}

export const RANK_SYSTEM = `You are a recruiter matching a candidate to live job listings.

For each listing, decide how well it fits THIS candidate based on skills, seniority, and domain overlap — ignore location and salary. Score 0-100:
- 80-100: strong match, could apply today
- 60-79: worth applying with a tailored CV
- 40-59: a stretch or partial overlap
- below 40: not a real fit

Score EVERY listing you are given — do not drop any. Return a SINGLE JSON object, no markdown or commentary:
{
  "matches": [
    { "id": string, "matchScore": number, "whyItFits": string }
  ]
}

Use each listing's exact "id". "whyItFits" is one specific sentence — for a weak match, say plainly what is missing.`;

export function buildRankUser(
  cv: string,
  jobs: JobListing[],
  additionalSkills?: string,
): string {
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

  return `${withSkills(cv, additionalSkills)}

LISTINGS:
${lines}

Score every listing and produce the JSON object.`;
}

export const ROLES_SYSTEM = `You extract distinct work-experience entries from a CV.

List every distinct position the candidate has held — job, internship, or
substantial freelance/volunteer role — most recent first, exactly as the CV
describes it. Do not blend roles together or invent one that isn't there.

Return a SINGLE JSON object, no markdown or commentary:
{
  "roles": [
    { "title": string, "company": string, "period": string }
    // "company" and "period" are omitted only if the CV truly doesn't say
  ]
}`;

export function buildRolesUser(cv: string): string {
  return `CANDIDATE CV:
"""
${cv}
"""

List every distinct role and produce the JSON object.`;
}

export const REPAIR_PROMPT = `Your previous reply was not valid JSON matching the required shape. Reply again with ONLY the corrected JSON object — no fences, no commentary.`;
