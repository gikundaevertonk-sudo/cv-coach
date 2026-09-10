import { createAdzunaSource } from "./adzuna";
import { createJSearchSource } from "./jsearch";
import { createTheMuseSource } from "./themuse";
import { JobsConfigError, type JobSource } from "./types";

export { JobsConfigError, JobSearchError } from "./types";
export type { JobListing, JobQuery, JobSource } from "./types";

type SourceName = "themuse" | "adzuna" | "jsearch";

const SOURCE_NAMES: readonly SourceName[] = ["themuse", "adzuna", "jsearch"];

function resolveSourceName(): SourceName {
  const explicit = process.env.JOBS_PROVIDER?.trim().toLowerCase();
  if (explicit) {
    if ((SOURCE_NAMES as readonly string[]).includes(explicit)) {
      return explicit as SourceName;
    }
    throw new JobsConfigError(
      `Unknown JOBS_PROVIDER "${explicit}". Use ${SOURCE_NAMES.join(", ")}.`,
    );
  }

  // Prefer a keyed source when configured; otherwise fall back to the
  // keyless one so "Find jobs" works out of the box.
  if (process.env.RAPIDAPI_KEY) return "jsearch";
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) return "adzuna";
  return "themuse";
}

/** Returns the configured job source. */
export function getJobSource(): JobSource {
  switch (resolveSourceName()) {
    case "jsearch":
      return createJSearchSource();
    case "adzuna":
      return createAdzunaSource();
    case "themuse":
      return createTheMuseSource();
  }
}
