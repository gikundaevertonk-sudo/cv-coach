"use client";

import { useState } from "react";
import { AnalyseTab } from "@/components/AnalyseTab";
import { JobsTab } from "@/components/JobsTab";
import { Briefcase, Target } from "@/components/icons";

type Tab = "analyse" | "jobs";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "analyse", label: "Analyse fit", icon: <Target className="h-4 w-4" /> },
  { id: "jobs", label: "Find jobs", icon: <Briefcase className="h-4 w-4" /> },
];

const COPY: Record<Tab, string> = {
  analyse:
    "Paste your CV and a job description. Get an honest fit analysis, a phased prep plan, and practice questions tailored to both.",
  jobs: "Paste your CV. We turn it into a search, pull live vacancies from a job board, and score each one against your background.",
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("analyse");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-6">
      <header className="mb-8">
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
          {COPY[tab]}
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Mode"
        className="mb-6 inline-flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analyse" ? <AnalyseTab /> : <JobsTab />}
    </main>
  );
}
