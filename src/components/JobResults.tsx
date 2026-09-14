"use client";

import { useState } from "react";
import { Check, ExternalLink, MapPin, Pencil, Spinner, Sparkles, Warning } from "./icons";
import type { JobSearchResponse, RankedJob } from "@/lib/jobs/schema";

function ago(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.round(months / 12)}y ago`;
}

function Notice({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      {text}
    </p>
  );
}

function scoreStyle(score: number): string {
  if (score >= 80)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (score >= 60)
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
}

export function JobResults({ data, cv }: { data: JobSearchResponse; cv: string }) {
  const { jobs, query } = data;
  const scored = jobs.some((j) => j.matchScore > 0);

  if (jobs.length === 0) {
    return (
      <div className="mt-10 animate-rise flex flex-col gap-3">
        {data.notice ? <Notice text={data.notice} /> : null}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          No live vacancies came back for{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {query.what}
          </span>
          {query.where ? ` in ${query.where}` : ""}. Try widening the location,
          clearing the job-board filter, or editing your CV to surface
          different roles.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-4 animate-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">
          {jobs.length} match{jobs.length === 1 ? "" : "es"}
        </h2>
        <p className="text-xs text-zinc-500">
          searched <span className="font-mono">{query.what}</span>
          {query.where ? ` · ${query.where}` : ""} · via {data.source}
        </p>
      </div>

      {data.notice ? <Notice text={data.notice} /> : null}

      {!scored ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Couldn&apos;t score these against your CV — showing the board&apos;s top
          results.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} cv={cv} />
        ))}
      </ul>

      <p className="border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        Listings from {data.source}; scored by{" "}
        <span className="font-mono">{data.model}</span>. Always confirm details on
        the original posting.
      </p>
    </div>
  );
}

type TailorState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; tailoredCv: string; coverLetter: string; notes: string[] };

function JobCard({ job, cv }: { job: RankedJob; cv: string }) {
  const posted = ago(job.postedAt);
  const [tailor, setTailor] = useState<TailorState>({ status: "idle" });
  const [expanded, setExpanded] = useState(true);

  async function onTailor() {
    setTailor({ status: "loading" });
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv,
          job: {
            title: job.title,
            company: job.company,
            location: job.location,
            snippet: job.snippet,
          },
        }),
      });
      const body: {
        tailoredCv?: string;
        coverLetter?: string;
        notes?: string[];
        error?: string;
      } = await res.json();

      if (!res.ok || typeof body.tailoredCv !== "string") {
        setTailor({
          status: "error",
          message: body.error ?? "Something went wrong.",
        });
        return;
      }
      setTailor({
        status: "done",
        tailoredCv: body.tailoredCv,
        coverLetter: body.coverLetter ?? "",
        notes: body.notes ?? [],
      });
      setExpanded(true);
    } catch {
      setTailor({
        status: "error",
        message: "Could not reach the server. Check your connection and try again.",
      });
    }
  }

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{job.title}</p>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {job.company ?? "Company undisclosed"}
            {job.location ? (
              <span className="text-zinc-400 dark:text-zinc-500">
                {" "}
                · <MapPin className="mb-0.5 inline h-3.5 w-3.5" /> {job.location}
              </span>
            ) : null}
          </p>
        </div>
        {job.matchScore > 0 ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreStyle(job.matchScore)}`}
          >
            {job.matchScore}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        {job.publisher ? (
          <span className="rounded-md bg-sky-100 px-1.5 py-0.5 font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            {job.publisher}
          </span>
        ) : null}
        {job.remote ? (
          <span className="rounded-md bg-teal-100 px-1.5 py-0.5 font-medium text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
            Remote
          </span>
        ) : null}
        {job.salary ? (
          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {job.salary}
          </span>
        ) : null}
        {posted ? <span className="text-zinc-400">{posted}</span> : null}
      </div>

      {job.snippet ? (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {job.snippet}
        </p>
      ) : null}

      {job.whyItFits ? (
        <p className="mt-2 flex gap-1.5 text-sm text-violet-700 dark:text-violet-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{job.whyItFits}</span>
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          View posting
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {tailor.status !== "done" ? (
          <button
            type="button"
            onClick={onTailor}
            disabled={tailor.status === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/60"
          >
            {tailor.status === "loading" ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Tailoring…
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" />
                Tailor CV &amp; cover letter
              </>
            )}
          </button>
        ) : null}
      </div>

      {tailor.status === "error" ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-500">
          <Warning className="h-3.5 w-3.5 shrink-0" />
          {tailor.message}
        </p>
      ) : null}

      {tailor.status === "done" ? (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900/50 dark:bg-violet-950/10">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-violet-800 dark:text-violet-300">
              <Check className="h-4 w-4 shrink-0" />
              Tailored for this job
            </p>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-medium text-violet-700 underline underline-offset-4 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-100"
            >
              {expanded ? "Hide" : "Show"}
            </button>
          </div>

          {expanded ? (
            <div className="mt-3 flex flex-col gap-4">
              <p className="text-xs text-violet-700/80 dark:text-violet-300/70">
                AI-drafted from your CV — review facts and tone before sending.
              </p>

              {tailor.notes.length > 0 ? (
                <ul className="flex flex-col gap-1 text-xs text-violet-800 dark:text-violet-300">
                  {tailor.notes.map((n, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span aria-hidden>•</span>
                      {n}
                    </li>
                  ))}
                </ul>
              ) : null}

              <CopyableBlock label="Tailored CV" text={tailor.tailoredCv} rows={14} />
              <CopyableBlock label="Cover letter" text={tailor.coverLetter} rows={10} />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function CopyableBlock({
  label,
  text,
  rows,
}: {
  label: string;
  text: string;
  rows: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — the
      // textarea below still lets the user select-all and copy manually.
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-medium text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={rows}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-1.5 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-zinc-700 outline-none focus:border-violet-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
      />
    </div>
  );
}
