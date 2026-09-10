import {
  JobSearchError,
  JobsConfigError,
  formatSalary,
  toSnippet,
  type JobListing,
  type JobQuery,
  type JobSource,
} from "./types";

const DEFAULT_COUNTRY = "us";

type AdzunaJob = {
  id?: string;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  created?: string;
  description?: string;
  redirect_url?: string;
};

export function createAdzunaSource(): JobSource {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new JobsConfigError(
      "ADZUNA_APP_ID and ADZUNA_APP_KEY are not set. Add them to .env.local (free key at adzuna.com/api) or switch JOBS_PROVIDER.",
    );
  }
  const defaultCountry = (
    process.env.ADZUNA_COUNTRY || DEFAULT_COUNTRY
  ).toLowerCase();

  return {
    name: "adzuna",
    async search(query: JobQuery): Promise<JobListing[]> {
      const country = (query.country || defaultCountry).toLowerCase();
      const limit = Math.min(query.limit ?? 25, 50);

      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: String(limit),
        what: query.what,
        "content-type": "application/json",
      });
      if (query.where) params.set("where", query.where);

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;

      let res: Response;
      try {
        res = await fetch(url, { headers: { Accept: "application/json" } });
      } catch {
        throw new JobSearchError("Could not reach Adzuna. Try again shortly.");
      }
      if (!res.ok) {
        throw new JobSearchError(
          res.status === 401 || res.status === 403
            ? "Adzuna rejected the credentials. Check ADZUNA_APP_ID / ADZUNA_APP_KEY."
            : `Adzuna returned ${res.status}. Try a different country or query.`,
        );
      }

      const body = (await res.json()) as { results?: AdzunaJob[] };
      const results = Array.isArray(body.results) ? body.results : [];

      return results
        .filter((j) => j.title && j.redirect_url)
        .map((j, i): JobListing => {
          const text = `${j.title ?? ""} ${j.description ?? ""}`.toLowerCase();
          return {
            id: j.id ? `adzuna:${j.id}` : `adzuna:${i}`,
            title: j.title!.trim(),
            company: j.company?.display_name?.trim() || null,
            location: j.location?.display_name?.trim() || null,
            remote: /\bremote\b|work from home|\bwfh\b/.test(text),
            salary: formatSalary(j.salary_min, j.salary_max, "year"),
            postedAt: j.created ?? null,
            snippet: toSnippet(j.description ?? ""),
            url: j.redirect_url!,
            source: "adzuna",
          };
        })
        .filter((j) => !query.remoteOnly || j.remote);
    },
  };
}
