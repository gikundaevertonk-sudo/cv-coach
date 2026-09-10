/** One vacancy, normalised across job-board sources. */
export type JobListing = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  /** Human-readable pay, e.g. "$120k–$150k / year". Null when the board omits it. */
  salary: string | null;
  /** ISO date string, or null. */
  postedAt: string | null;
  /** Plain-text excerpt of the description. */
  snippet: string;
  /** Where to view / apply. */
  url: string;
  /** Source board id, e.g. "adzuna". */
  source: string;
};

export type JobQuery = {
  /** Keywords or job titles. */
  what: string;
  /** Free-text location. */
  where?: string;
  remoteOnly?: boolean;
  /** ISO-2 country code (used by boards that need one, e.g. Adzuna). */
  country?: string;
  /** Max listings to return. */
  limit?: number;
};

export interface JobSource {
  /** Board id, e.g. "adzuna" / "jsearch". */
  readonly name: string;
  search(query: JobQuery): Promise<JobListing[]>;
}

/** The environment is missing keys the chosen job source needs. */
export class JobsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobsConfigError";
  }
}

/** A job board returned an error or unusable payload. */
export class JobSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobSearchError";
  }
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
};

/** Strip HTML, decode common entities, and truncate to a card-sized excerpt. */
export function toSnippet(raw: string, max = 320): string {
  const text = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Format a min/max pay range into one string. */
export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  period?: string | null,
  currency = "$",
): string | null {
  const fmt = (n: number) =>
    n >= 1000 ? `${currency}${Math.round(n / 1000)}k` : `${currency}${Math.round(n)}`;
  let body: string;
  if (min && max && min !== max) body = `${fmt(min)}–${fmt(max)}`;
  else if (min || max) body = fmt((min || max) as number);
  else return null;
  return period ? `${body} / ${period}` : body;
}
