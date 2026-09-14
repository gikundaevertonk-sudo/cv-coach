import type { TailorRequest } from "./schema";

export const SYSTEM_PROMPT = `You are a career coach who tailors a candidate's CV and writes a cover letter for ONE specific job.

Ground rules:
- Use ONLY what is in the candidate's CV, plus any "additional skills" the candidate explicitly states below (those are real, self-reported — treat them the same as the CV, just don't invent employers, dates, or achievements around them that weren't given). Never invent anything beyond these two sources.
- Keep every fact unchanged (company names, job titles, dates, metrics). You may reorder sections/bullets, rewrite a summary line, tighten wording, and cut detail that is irrelevant to this job to make room for what matters.
- The cover letter is 3-4 short paragraphs: an opening naming the role and why the candidate is applying, 1-2 paragraphs connecting 2-3 concrete things from the CV to what the job actually asks for, and a short closing with a clear call to action. Professional but not stiff — no generic filler like "I am a hard worker".
- Sign the letter with the candidate's name if it appears in the CV, otherwise "[Your name]". Address it "Dear Hiring Manager," unless a specific name is given.
- If the job clearly wants something the CV does not show, do not paper over it — either leave it out or address it honestly in one line (e.g. "though new to X, I bring Y which transfers directly").

Respond with a SINGLE JSON object and nothing else — no markdown, no code fences, no commentary before or after:
{
  "tailoredCv": string,   // the full rewritten CV as plain text, ready to paste into a document
  "coverLetter": string,  // the full cover letter as plain text
  "notes": [ string ]     // 2-5 short bullets: what you emphasized, reordered, or cut, and why
}`;

export function buildUserMessage(input: TailorRequest): string {
  const { job } = input;
  const jobLines = [
    `Title: ${job.title}`,
    job.company ? `Company: ${job.company}` : null,
    job.location ? `Location: ${job.location}` : null,
    job.snippet ? `Description: ${job.snippet}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const skills = input.additionalSkills?.trim();

  return `CANDIDATE CV:
"""
${input.cv}
"""
${
    skills
      ? `\nADDITIONAL SKILLS THE CANDIDATE STATES THEY HAVE (not in the CV above, but real and self-reported):\n${skills}\n`
      : ""
  }
TARGET JOB:
${jobLines}

Tailor the CV and write the cover letter for this job. Produce the JSON object.`;
}

export const REPAIR_PROMPT = `Your previous reply was not valid JSON matching the required shape. Reply again with ONLY the corrected JSON object — no fences, no commentary.`;
