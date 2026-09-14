import {
  JobSearchError,
  toSnippet,
  type JobListing,
  type JobQuery,
  type JobSource,
} from "./types";

// The Muse's public jobs API takes no key (an optional one raises rate limits).
// It filters by category / level / location rather than free text, so we map
// the distilled keywords onto its taxonomy and let the ranking step do the
// fine matching.
const CATEGORY_RULES: [RegExp, string[]][] = [
  [
    /\b(software|frontend|front-end|backend|back-end|full[- ]?stack|web|mobile|ios|android|devops|sre|platform|cloud|engineer|developer|programmer)\b/i,
    ["Software Engineering", "Engineering"],
  ],
  [
    /\b(data scien|machine learning|\bml\b|\bai\b|analytics|data engineer)\b/i,
    ["Data Science", "Data and Analytics"],
  ],
  [/\b(designer|\bux\b|\bui\b|product design|graphic|brand design)\b/i, ["Design", "UX"]],
  [/\b(product manager|product management|\bpm\b|product owner)\b/i, ["Product Management"]],
  [/\b(marketing|seo|growth|content|brand|social media|communications)\b/i, ["Marketing"]],
  [/\b(sales|account executive|business development|\bbdr\b|\bsdr\b)\b/i, ["Sales"]],
  [/\b(finance|accountant|accounting|financial analyst|fp&a)\b/i, ["Accounting and Finance"]],
  [/\b(hr|human resources|recruit|talent|people ops)\b/i, ["HR & Recruiting"]],
  [/\b(project manager|program manager|scrum master|delivery lead)\b/i, ["Project & Program Management"]],
];

const LEVEL_RULES: [RegExp, string][] = [
  [/\b(intern|internship)\b/i, "Internship"],
  [/\b(junior|entry[- ]level|graduate|associate)\b/i, "Entry Level"],
  [/\b(senior|sr\.?|lead|staff|principal)\b/i, "Senior Level"],
  [/\b(head of|director|\bvp\b|vice president|chief)\b/i, "Management"],
];

type MuseJob = {
  id?: number;
  name?: string;
  contents?: string;
  company?: { name?: string };
  locations?: { name?: string }[];
  publication_date?: string;
  refs?: { landing_page?: string };
};

export function createTheMuseSource(): JobSource {
  const apiKey = process.env.THEMUSE_API_KEY;

  return {
    name: "themuse",
    async search(query: JobQuery): Promise<JobListing[]> {
      const categories = new Set<string>();
      for (const [re, cats] of CATEGORY_RULES) {
        if (re.test(query.what)) cats.forEach((c) => categories.add(c));
      }
      const level = LEVEL_RULES.find(([re]) => re.test(query.what))?.[1];
      const limit = Math.min(query.limit ?? 25, 50);

      const build = (page: number) => {
        const p = new URLSearchParams({ page: String(page) });
        categories.forEach((c) => p.append("category", c));
        if (level) p.append("level", level);
        if (query.remoteOnly) p.append("location", "Flexible / Remote");
        else if (query.where) p.append("location", query.where);
        if (apiKey) p.set("api_key", apiKey);
        return `https://www.themuse.com/api/public/jobs?${p}`;
      };

      const pages = [0, 1, 2].slice(0, Math.ceil(limit / 20));
      let raw: MuseJob[];
      try {
        const responses = await Promise.all(
          pages.map((n) => fetch(build(n), { headers: { Accept: "application/json" } })),
        );
        const bad = responses.find((r) => !r.ok);
        if (bad) {
          throw new JobSearchError(
            bad.status === 429
              ? "The Muse rate limit hit. Wait a minute and try again."
              : `The Muse returned ${bad.status}.`,
          );
        }
        const bodies = (await Promise.all(responses.map((r) => r.json()))) as {
          results?: MuseJob[];
        }[];
        raw = bodies.flatMap((b) => (Array.isArray(b.results) ? b.results : []));
      } catch (err) {
        if (err instanceof JobSearchError) throw err;
        throw new JobSearchError("Could not reach The Muse. Try again shortly.");
      }

      const seen = new Set<string>();
      return raw
        .filter((j) => j.name && j.refs?.landing_page)
        .map((j): JobListing => {
          const locs = (j.locations ?? [])
            .map((l) => l.name)
            .filter(Boolean) as string[];
          const isRemoteLoc = (l: string) => /flexible|remote/i.test(l);
          return {
            id: `themuse:${j.id}`,
            title: j.name!.trim(),
            company: j.company?.name?.trim() || null,
            location: locs.join(" / ") || null,
            remote: locs.some(isRemoteLoc),
            // Many Muse listings post several offices *and* "Flexible /
            // Remote" side by side — that's hybrid, not remote-only. Only
            // count it fully remote when every listed location is.
            fullyRemote: locs.length > 0 && locs.every(isRemoteLoc),
            salary: null,
            postedAt: j.publication_date ?? null,
            snippet: toSnippet(j.contents ?? ""),
            url: j.refs!.landing_page!,
            source: "themuse",
            publisher: null,
          };
        })
        .filter((j) => {
          if (seen.has(j.id)) return false;
          seen.add(j.id);
          return !query.remoteOnly || j.remote;
        })
        .slice(0, limit);
    },
  };
}
