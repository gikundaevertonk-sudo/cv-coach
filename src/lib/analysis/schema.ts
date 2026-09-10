import { z } from "zod";

export const MAX_FIELD_CHARS = 20000;

/** What the browser sends to /api/analyze. */
export const analyzeRequestSchema = z.object({
  roleTitle: z.string().trim().min(1, "Add the role title.").max(200),
  jobDescription: z
    .string()
    .trim()
    .min(50, "Paste the full job description (at least a few sentences).")
    .max(MAX_FIELD_CHARS),
  cv: z
    .string()
    .trim()
    .min(50, "Paste your CV text (at least a few sentences).")
    .max(MAX_FIELD_CHARS),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

const severity = z.enum(["critical", "important", "nice-to-have"]);
const questionType = z.enum(["behavioral", "technical", "role-specific"]);

const strength = z.object({
  title: z.string(),
  evidence: z.string().describe("Where in the CV this shows up."),
});

const gap = z.object({
  title: z.string(),
  severity,
  why: z.string().describe("Why the role needs this."),
  howToClose: z.string().describe("A concrete, time-bound action."),
});

const prepPhase = z.object({
  phase: z.string().describe('e.g. "This week", "Weeks 2-3".'),
  focus: z.string(),
  actions: z.array(z.string()).min(1),
});

const practiceQuestion = z.object({
  question: z.string(),
  type: questionType,
  rationale: z.string().describe("Why an interviewer is likely to ask this."),
  answerFramework: z
    .string()
    .describe("How to structure a strong answer, tied to this candidate's CV."),
});

const cvImprovement = z.object({
  area: z.string(),
  suggestion: z.string(),
});

export const analysisResultSchema = z.object({
  roleTitle: z.string(),
  overallFit: z.object({
    score: z.number().min(0).max(100),
    verdict: z.string().describe("One short phrase, e.g. \"Strong match\"."),
    summary: z.string(),
  }),
  strengths: z.array(strength).min(1),
  gaps: z.array(gap),
  missingKeywords: z
    .array(z.string())
    .describe("ATS keywords from the JD absent from the CV."),
  prepPlan: z.array(prepPhase).min(1),
  practiceQuestions: z.array(practiceQuestion).min(1),
  cvImprovements: z.array(cvImprovement),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type Gap = z.infer<typeof gap>;
export type PracticeQuestion = z.infer<typeof practiceQuestion>;
