"use client";

import { useRef, useState } from "react";
import { AnalysisView } from "@/components/AnalysisView";
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">CV Coach</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Paste your CV and a job description. Get an honest fit analysis, a prep
          plan, and practice questions tailored to both.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {loading ? "Analysing…" : "Analyse fit"}
          </button>
          <button
            type="button"
            onClick={loadSample}
            disabled={loading}
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-100"
          >
            Load sample
          </button>
          {loading ? (
            <span className="text-sm text-zinc-500">
              usually 20–60 seconds…
            </span>
          ) : null}
        </div>
      </form>

      {error ? (
        <p className="mt-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-10 flex items-center gap-3 text-sm text-zinc-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          Comparing your CV against the role…
        </div>
      ) : null}

      {data ? (
        <div className="mt-12">
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
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-baseline gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pdf.status === "reading"}
            className="text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-100"
          >
            {pdf.status === "reading" ? "Reading PDF…" : "Upload PDF"}
          </button>
          <span
            className={`text-xs tabular-nums ${
              value.length > MAX_FIELD_CHARS ? "text-rose-500" : "text-zinc-400"
            }`}
          >
            {value.length.toLocaleString()} / {MAX_FIELD_CHARS.toLocaleString()}
          </span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onPickFile}
      />
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        rows={8}
        className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
      />
      {pdf.status === "done" ? (
        <p className="text-xs text-zinc-500">
          Loaded text from <span className="font-medium">{pdf.name}</span> — check
          it and edit as needed.
        </p>
      ) : null}
      {pdf.status === "error" ? (
        <p className="text-xs text-rose-500">{pdf.message}</p>
      ) : null}
    </div>
  );
}
