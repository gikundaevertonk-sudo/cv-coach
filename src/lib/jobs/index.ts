import { createAdzunaSource } from "./adzuna";
import { createJSearchSource } from "./jsearch";
import { JobsConfigError, type JobSource } from "./types";

export { JobsConfigError, JobSearchError } from "./types";
export type { JobListing, JobQuery, JobSource } from "./types";

type SourceName = "adzuna" | "jsearch";

const SOURCE_NAMES: readonly SourceName[] = ["adzuna", "jsearch"];

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

  if (process.env.RAPIDAPI_KEY) return "jsearch";
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) return "adzuna";

  throw new JobsConfigError(
    "No job source configured. Set ADZUNA_APP_ID + ADZUNA_APP_KEY, or RAPIDAPI_KEY, in .env.local.",
  );
}

/**
 * Returns the configured job source. Throws {@link JobsConfigError} when the
 * environment is missing the keys it needs.
 */
export function getJobSource(): JobSource {
  return resolveSourceName() === "jsearch"
    ? createJSearchSource()
    : createAdzunaSource();
}
