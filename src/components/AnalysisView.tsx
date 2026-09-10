import type { AnalysisResult, Gap, PracticeQuestion } from "@/lib/analysis/schema";
import { ScoreDial } from "./ScoreDial";

const SEVERITY_STYLE: Record<Gap["severity"], string> = {
  critical:
    "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-400/20",
  important:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20",
  "nice-to-have":
    "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/20",
};

const QUESTION_STYLE: Record<PracticeQuestion["type"], string> = {
  behavioral: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  technical: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  "role-specific": "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
};

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AnalysisView({
  data,
  meta,
}: {
  data: AnalysisResult;
  meta: { provider: string; model: string };
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ScoreDial score={data.overallFit.score} />
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            {data.roleTitle}
          </p>
          <p className="mt-1 text-xl font-semibold">{data.overallFit.verdict}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {data.overallFit.summary}
          </p>
        </div>
      </header>

      <Section title="Strengths" hint="What already lines up with the role.">
        <ul className="flex flex-col gap-3">
          {data.strengths.map((s, i) => (
            <li
              key={i}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {s.evidence}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {data.gaps.length > 0 && (
        <Section title="Gaps to close" hint="Where the role asks for more than the CV shows.">
          <ul className="flex flex-col gap-3">
            {data.gaps.map((g, i) => (
              <li
                key={i}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{g.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SEVERITY_STYLE[g.severity]}`}
                  >
                    {g.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {g.why}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium text-zinc-500">Do this: </span>
                  {g.howToClose}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {data.missingKeywords.length > 0 && (
        <Section
          title="Keywords missing from your CV"
          hint="Terms in the job description a recruiter or ATS will scan for."
        >
          <div className="flex flex-wrap gap-2">
            {data.missingKeywords.map((k, i) => (
              <span
                key={i}
                className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {k}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Prep plan" hint="Work through the phases in order.">
        <ol className="flex flex-col gap-4">
          {data.prepPlan.map((p, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">
                  {p.phase} <span className="text-zinc-500">— {p.focus}</span>
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {p.actions.map((a, j) => (
                    <li key={j} className="flex gap-2">
                      <span aria-hidden className="text-zinc-400">
                        •
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Practice questions"
        hint="Rehearse an answer out loud for each one."
      >
        <ul className="flex flex-col gap-3">
          {data.practiceQuestions.map((q, i) => (
            <li
              key={i}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{q.question}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${QUESTION_STYLE[q.type]}`}
                >
                  {q.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{q.rationale}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-500">How to answer: </span>
                {q.answerFramework}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {data.cvImprovements.length > 0 && (
        <Section title="CV tweaks for this role">
          <ul className="flex flex-col gap-3">
            {data.cvImprovements.map((c, i) => (
              <li
                key={i}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="font-medium">{c.area}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {c.suggestion}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        Generated by {meta.provider} · {meta.model}. Guidance is a starting point,
        not a guarantee — use your own judgement.
      </p>
    </div>
  );
}
