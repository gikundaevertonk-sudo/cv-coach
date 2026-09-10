"use client";

import { useEffect, useRef, useState } from "react";
import { AnalysisView } from "@/components/AnalysisView";
import { ArrowRight, Check, Spinner, Upload, Warning } from "@/components/icons";
import { MAX_FIELD_CHARS, type AnalysisResult } from "@/lib/analysis/schema";

type ApiResponse =
  | { result: AnalysisResult; provider: string; model: string }
  | { error: string };

const SAMPLE_CV = `Jordan Lee — Frontend Developer
3 years building React apps at a fintech startup. Shipped a customer dashboard
used by 40k users, led migration from CRA to Vite, mentored two juniors.
Skills: React, TypeScript, Redux, Jest, REST APIs, Figma. BSc Computer Science.`;

const SAMPLE_JD = `Senior Frontend Engineer
We need someone strong in React and TypeScript to own our design system and
component library. You will drive accessibility (WCAG 2.1 AA), set up visual
regression testing, and work closely with design. Experience with Next.js,
GraphQL, and leading projects across teams is expected.`;

const HIGHLIGHTS = [
  "Fit score",
  "Strengths & gaps",
  "Prep plan",
  "Practice questions",
];

const LOADING_STEPS = [
  "Reading the job description…",
  "Scanning your CV for evidence…",
  "Scoring the overall fit…",
  "Ranking the gaps by severity…",
  "Drafting your prep plan…",
  "Writing practice questions…",
];

export default function Home() {
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cv, setCv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    { result: AnalysisResult; provider: string; model: string } | null
  >(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTitle, jobDescription, cv }),
      });
      const body: ApiResponse = await res.json();

      if (!res.ok || "error" in body) {
        setError("error" in body ? body.error : "Something went wrong.");
        return;
      }
      setData(body);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setRoleTitle("Senior Frontend Engineer");
    setJobDescription(SAMPLE_JD);
    setCv(SAMPLE_CV);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-6">
      <header className="mb-9">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-[13px] font-bold text-white shadow-sm shadow-violet-600/30">
            CV
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">
            CV Coach
          </span>
        </div>

        <h1 className="mt-7 text-[2.5rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          See how your CV
          <br className="hidden sm:block" /> stacks up.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Paste your CV and a job description. Get an honest fit analysis, a
          phased prep plan, and practice questions tailored to both.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {HIGHLIGHTS.map((h) => (
            <li
              key={h}
              className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
            >
              {h}
            </li>
          ))}
        </ul>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium">
              Role title
            </label>
            <input
              id="role"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              required
              className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-violet-500"
            />
          </div>

          <Field
            id="jd"
            label="Job description"
            value={jobDescription}
            onChange={setJobDescription}
            placeholder="Paste the full job posting, including requirements and responsibilities."
          />

          <Field
            id="cv"
            label="Your CV"
            value={cv}
            onChange={setCv}
            placeholder="Paste your CV as plain text."
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition-all hover:bg-violet-500 hover:shadow-md hover:shadow-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Analysing…
                </>
              ) : (
                <>
                  Analyse fit
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={loadSample}
              disabled={loading}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Load sample
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <Warning className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? <LoadingCard /> : null}

      {data ? (
        <div className="mt-12 animate-rise">
          <AnalysisView data={data.result} meta={data} />
        </div>
      ) : null}
    </main>
  );
}

type PdfState =
  | { status: "idle" }
  | { status: "reading"; name: string }
  | { status: "done"; name: string }
  | { status: "error"; message: string };

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<PdfState>({ status: "idle" });
  const over = value.length > MAX_FIELD_CHARS;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the user re-pick the same file after an edit
    if (!file) return;

    setPdf({ status: "reading", name: file.name });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const data: { text?: string; error?: string } = await res.json();

      if (!res.ok || typeof data.text !== "string") {
        setPdf({
          status: "error",
          message: data.error ?? "Could not read that PDF.",
        });
        return;
      }
      onChange(data.text);
      setPdf({ status: "done", name: file.name });
    } catch {
      setPdf({
        status: "error",
        message: "Upload failed. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pdf.status === "reading"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {pdf.status === "reading" ? (
            <>
              <Spinner className="h-3 w-3" />
              Reading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Upload PDF
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onPickFile}
      />

      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          rows={8}
          className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-violet-500"
        />
        <span
          className={`pointer-events-none absolute bottom-2.5 right-2.5 rounded bg-white/80 px-1 text-[11px] tabular-nums backdrop-blur dark:bg-zinc-950/80 ${
            over ? "text-rose-500" : "text-zinc-400"
          }`}
        >
          {value.length.toLocaleString()} / {MAX_FIELD_CHARS.toLocaleString()}
        </span>
      </div>

      {pdf.status === "done" ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>
            Loaded from <span className="font-medium">{pdf.name}</span> — review
            and edit below.
          </span>
        </p>
      ) : null}
      {pdf.status === "error" ? (
        <p className="text-xs text-rose-500">{pdf.message}</p>
      ) : null}
    </div>
  );
}

function LoadingCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((n) => (n + 1) % LOADING_STEPS.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-10 animate-rise rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-3">
        <Spinner className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {LOADING_STEPS[step]}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, k) => (
          <div
            key={k}
            className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>

      <p className="mt-5 text-xs text-zinc-400">Usually 15–60 seconds.</p>
    </div>
  );
}
