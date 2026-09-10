import type { AnalysisResult, Gap, PracticeQuestion } from "@/lib/analysis/schema";
import { ScoreDial } from "./ScoreDial";
import { Chat, Hash, Pencil, Sparkles, Steps, Target } from "./icons";

const SEVERITY: Record<
  Gap["severity"],
  { label: string; bar: string; chip: string }
> = {
  critical: {
    label: "Critical",
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-400/20",
  },
  important: {
    label: "Important",
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20",
  },
  "nice-to-have": {
    label: "Nice to have",
    bar: "bg-zinc-300 dark:bg-zinc-600",
    chip: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/20",
  },
};

const QUESTION_STYLE: Record<PracticeQuestion["type"], string> = {
  behavioral:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  technical: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  "role-specific":
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
};

function fitTone(score: number) {
  if (score >= 75) {
    return {
      label: "Strong fit",
      card: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20",
      chip: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20",
    };
  }
  if (score >= 50) {
    return {
      label: "Partial fit",
      card: "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20",
      chip: "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-400/20",
    };
  }
  return {
    label: "Long shot",
    card: "border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20",
    chip: "bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-400/20",
  };
}

function Section({
  icon,
  title,
  count,
  hint,
  delay,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  hint?: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="animate-rise scroll-mt-6"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
          {icon}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {typeof count === "number" ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {count}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 pl-[2.375rem] text-sm text-zinc-500">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const card =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50";

export function AnalysisView({
  data,
  meta,
}: {
  data: AnalysisResult;
  meta: { provider: string; model: string };
}) {
  const tone = fitTone(data.overallFit.score);

  return (
    <div className="flex flex-col gap-10">
      <header
        className={`animate-rise rounded-2xl border p-6 ${tone.card}`}
        style={{ animationDelay: "0s" }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <ScoreDial score={data.overallFit.score} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {data.roleTitle}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone.chip}`}
              >
                {tone.label}
              </span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight">
              {data.overallFit.verdict}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {data.overallFit.summary}
            </p>
          </div>
        </div>
      </header>

      <Section
        icon={<Sparkles className="h-4 w-4" />}
        title="Strengths"
        count={data.strengths.length}
        hint="What already lines up with the role."
        delay={0.05}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.strengths.map((s, i) => (
            <li key={i} className={`relative overflow-hidden p-4 pl-5 ${card}`}>
              <span className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {s.evidence}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {data.gaps.length > 0 && (
        <Section
          icon={<Target className="h-4 w-4" />}
          title="Gaps to close"
          count={data.gaps.length}
          hint="Where the role asks for more than the CV shows."
          delay={0.1}
        >
          <ul className="flex flex-col gap-3">
            {data.gaps.map((g, i) => {
              const s = SEVERITY[g.severity];
              return (
                <li
                  key={i}
                  className={`relative overflow-hidden p-4 pl-5 ${card}`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1 ${s.bar}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{g.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.chip}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {g.why}
                  </p>
                  <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/50">
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      Do this —{" "}
                    </span>
                    {g.howToClose}
                  </p>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {data.missingKeywords.length > 0 && (
        <Section
          icon={<Hash className="h-4 w-4" />}
          title="Missing keywords"
          count={data.missingKeywords.length}
          hint="Terms in the job description a recruiter or ATS will scan for."
          delay={0.15}
        >
          <div className="flex flex-wrap gap-2">
            {data.missingKeywords.map((k, i) => (
              <span
                key={i}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 font-mono text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {k}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section
        icon={<Steps className="h-4 w-4" />}
        title="Prep plan"
        hint="Work through the phases in order."
        delay={0.2}
      >
        <ol className="flex flex-col gap-6">
          {data.prepPlan.map((p, i) => (
            <li key={i} className="relative pl-10">
              {i < data.prepPlan.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-3 top-7 h-[calc(100%+0.5rem)] w-px bg-zinc-200 dark:bg-zinc-800"
                />
              )}
              <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <p className="font-medium">
                {p.phase}{" "}
                <span className="font-normal text-zinc-500">— {p.focus}</span>
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                {p.actions.map((a, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-[0.4rem] h-1 w-1 shrink-0 rounded-full bg-zinc-400"
                    />
                    {a}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        icon={<Chat className="h-4 w-4" />}
        title="Practice questions"
        count={data.practiceQuestions.length}
        hint="Rehearse an answer out loud for each one."
        delay={0.25}
      >
        <ul className="flex flex-col gap-3">
          {data.practiceQuestions.map((q, i) => (
            <li key={i} className={`p-4 ${card}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{q.question}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${QUESTION_STYLE[q.type]}`}
                >
                  {q.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{q.rationale}</p>
              <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  How to answer
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {q.answerFramework}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {data.cvImprovements.length > 0 && (
        <Section
          icon={<Pencil className="h-4 w-4" />}
          title="CV tweaks for this role"
          count={data.cvImprovements.length}
          delay={0.3}
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.cvImprovements.map((c, i) => (
              <li key={i} className={`p-4 ${card}`}>
                <p className="font-medium">{c.area}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {c.suggestion}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        <span>Generated by</span>
        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {meta.provider} · {meta.model}
        </span>
        <span>· a starting point, not a guarantee — use your own judgement.</span>
      </p>
    </div>
  );
}
