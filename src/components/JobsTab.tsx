"use client";

import { useEffect, useState } from "react";
import { PdfCvInput } from "@/components/PdfCvInput";
import { JobResults } from "@/components/JobResults";
import { ArrowRight, Search, Spinner, Warning } from "@/components/icons";
import type { JobSearchResponse } from "@/lib/jobs/schema";

type ApiResponse = JobSearchResponse | { error: string };

const SAMPLE_CV = `Jordan Lee — Frontend Developer
3 years building React apps at a fintech startup. Shipped a customer dashboard
used by 40k users, led migration from CRA to Vite, mentored two juniors.
Skills: React, TypeScript, Redux, Jest, REST APIs, Figma. BSc Computer Science.
Based in Manchester, UK. Open to remote.`;

const COUNTRIES: [string, string][] = [
  ["", "Any / board default"],
  ["us", "United States"],
  ["gb", "United Kingdom"],
  ["ca", "Canada"],
  ["au", "Australia"],
  ["de", "Germany"],
  ["fr", "France"],
  ["nl", "Netherlands"],
  ["in", "India"],
  ["sg", "Singapore"],
  ["za", "South Africa"],
];

const LOADING_STEPS = [
  "Reading your CV…",
  "Working out what to search for…",
  "Searching job boards…",
  "Scoring each listing against your CV…",
];

export function JobsTab() {
  const [cv, setCv] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JobSearchResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cv.trim()) {
      setError("Add your CV first — upload a PDF or paste the text.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, location, country, remoteOnly }),
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

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <div className="flex flex-col gap-5">
          <PdfCvInput value={cv} onChange={setCv} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="loc" className="text-sm font-medium">
                Location{" "}
                <span className="font-normal text-zinc-400">— optional</span>
              </label>
              <input
                id="loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Berlin, or leave blank"
                className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-violet-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="country" className="text-sm font-medium">
                Country{" "}
                <span className="font-normal text-zinc-400">— job board</span>
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-violet-500"
              >
                {COUNTRIES.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600 accent-violet-600 dark:border-zinc-600"
            />
            Remote roles only
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !cv.trim()}
              className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition-all hover:bg-violet-500 hover:shadow-md hover:shadow-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find matching jobs
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCv(SAMPLE_CV)}
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

      {loading ? <SearchSkeleton /> : null}

      {data ? <JobResults data={data} cv={cv} /> : null}
    </>
  );
}

function SearchSkeleton() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((n) => Math.min(n + 1, LOADING_STEPS.length - 1)),
      2600,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-10 animate-rise">
      <div className="flex items-center gap-3">
        <Spinner className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {LOADING_STEPS[step]}
        </p>
      </div>
      <ul className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, k) => (
          <li
            key={k}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-1.5 h-3 w-5/6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-zinc-400">Usually 20–60 seconds.</p>
    </div>
  );
}
