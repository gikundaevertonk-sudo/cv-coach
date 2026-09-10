import { ExternalLink, MapPin, Sparkles } from "./icons";
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

function scoreStyle(score: number): string {
  if (score >= 80)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (score >= 60)
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
}

export function JobResults({ data }: { data: JobSearchResponse }) {
  const { jobs, query } = data;
  const scored = jobs.some((j) => j.matchScore > 0);

  if (jobs.length === 0) {
    return (
      <div className="mt-10 animate-rise rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        No live vacancies came back for{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {query.what}
        </span>
        {query.where ? ` in ${query.where}` : ""}. Try widening the location or
        editing your CV to surface different roles.
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

      {!scored ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Couldn&apos;t score these against your CV — showing the board&apos;s top
          results.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
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

function JobCard({ job }: { job: RankedJob }) {
  const posted = ago(job.postedAt);

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

      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        View posting
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </li>
  );
}
