import {
  JobSearchError,
  JobsConfigError,
  formatSalary,
  toSnippet,
  type JobListing,
  type JobQuery,
  type JobSource,
} from "./types";

const HOST = "jsearch.p.rapidapi.com";

type ApplyOption = { publisher?: string; apply_link?: string };

type JSearchJob = {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
  job_posted_at_datetime_utc?: string;
  job_description?: string;
  job_apply_link?: string;
  job_google_link?: string;
  job_publisher?: string;
  apply_options?: ApplyOption[];
};

/** Where to apply, and which site the listing came from. */
function resolveApply(j: JSearchJob): { url: string; publisher: string | null } | null {
  const firstOption = j.apply_options?.find((o) => o.apply_link);
  const url = j.job_apply_link || firstOption?.apply_link || j.job_google_link;
  if (!url) return null;
  const publisher = (j.job_publisher || firstOption?.publisher || "").trim();
  return { url, publisher: publisher || null };
}

/** JSearch (RapidAPI) — aggregates Google for Jobs: LinkedIn, Indeed, etc. */
export function createJSearchSource(): JobSource {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new JobsConfigError(
      "RAPIDAPI_KEY is not set. Subscribe to JSearch on RapidAPI and add the key to .env.local, or switch JOBS_PROVIDER.",
    );
  }

  return {
    name: "jsearch",
    async search(query: JobQuery): Promise<JobListing[]> {
      const wantPublishers = (query.publishers ?? [])
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);

      const q = [query.what, query.where].filter(Boolean).join(" in ");
      const params = new URLSearchParams({
        query: q || "software engineer",
        page: "1",
        // Filtering to specific publishers thins the pool a lot, so pull
        // more pages up front when a publisher filter is requested.
        num_pages: wantPublishers.length > 0 ? "3" : "1",
      });
      if (query.remoteOnly) params.set("remote_jobs_only", "true");

      let res: Response;
      try {
        res = await fetch(`https://${HOST}/search?${params}`, {
          headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": HOST },
        });
      } catch {
        throw new JobSearchError("Could not reach JSearch. Try again shortly.");
      }
      if (!res.ok) {
        throw new JobSearchError(
          res.status === 401 || res.status === 403
            ? "JSearch rejected the RapidAPI key. Check RAPIDAPI_KEY and your subscription."
            : res.status === 429
              ? "JSearch rate limit hit. Wait a bit and try again."
              : `JSearch returned ${res.status}.`,
        );
      }

      const body = (await res.json()) as { data?: JSearchJob[] };
      const data = Array.isArray(body.data) ? body.data : [];
      const limit = Math.min(query.limit ?? 25, 50);

      const listings = data
        .map((j, i): JobListing | null => {
          if (!j.job_title) return null;
          const apply = resolveApply(j);
          if (!apply) return null;
          return {
            id: j.job_id ? `jsearch:${j.job_id}` : `jsearch:${i}`,
            title: j.job_title.trim(),
            company: j.employer_name?.trim() || null,
            location:
              [j.job_city, j.job_state, j.job_country]
                .filter(Boolean)
                .join(", ") || null,
            // JSearch's is_remote flag doesn't distinguish hybrid from
            // fully-remote, so both fields carry the same value here.
            remote: Boolean(j.job_is_remote),
            fullyRemote: Boolean(j.job_is_remote),
            salary: formatSalary(
              j.job_min_salary,
              j.job_max_salary,
              j.job_salary_period?.toLowerCase() ?? null,
            ),
            postedAt: j.job_posted_at_datetime_utc ?? null,
            snippet: toSnippet(j.job_description ?? ""),
            url: apply.url,
            source: "jsearch",
            publisher: apply.publisher,
          };
        })
        .filter((j): j is JobListing => j !== null);

      const filtered =
        wantPublishers.length > 0
          ? listings.filter((j) => {
              const p = j.publisher?.toLowerCase() ?? "";
              return wantPublishers.some((want) => p.includes(want));
            })
          : listings;

      return filtered.slice(0, limit);
    },
  };
}
