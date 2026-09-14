import { getProvider } from "@/lib/ai";
import { parseModelJSON } from "@/lib/ai/json";
import { getJobSource } from "./index";
import {
  DISTILL_SYSTEM,
  RANK_SYSTEM,
  REPAIR_PROMPT,
  ROLES_SYSTEM,
  buildDistillUser,
  buildRankUser,
  buildRolesUser,
} from "./prompt";
import {
  experienceSchema,
  rankingSchema,
  searchTermsSchema,
  type ExperienceRequest,
  type JobSearchResponse,
  type JobsRequest,
  type RankedJob,
  type WorkRole,
} from "./schema";

const MAX_LISTINGS_TO_RANK = 25;
const MAX_RESULTS = 12;
/** "Worth applying" bar — listings at or above this are shown normally. */
const SCORE_FLOOR = 30;
/**
 * Below the floor but at or above this, a listing is a real stretch but
 * still worth surfacing as the closest available option. Below THIS, it
 * isn't a recommendation at all — padding results out with a score of 5
 * just because nothing better came back does more harm than an honest
 * "nothing good matched" message.
 */
const MIN_USABLE_SCORE = 20;
const MIN_TO_SHOW = 4;
/** Keep on-site/board-side location results within this radius when a place is known. */
const DEFAULT_RADIUS_KM = 25;

/**
 * Work out what to search for. An explicit keyword search takes priority —
 * it's the user directly saying "find me this" — and skips the CV-distill
 * call entirely once nothing is left for it to contribute (a location was
 * also given). Otherwise the CV is distilled into titles + keywords, and,
 * when needed, a location guess.
 */
async function resolveQuery(
  provider: ReturnType<typeof getProvider>,
  input: JobsRequest,
): Promise<{ what: string; where: string }> {
  const manualQuery = (input.keywords || "").trim();
  if (manualQuery && input.location) {
    return { what: manualQuery, where: input.location.trim() };
  }

  const distillUser = buildDistillUser(input.cv, input.additionalSkills);
  const first = await provider.generateJSON({
    system: DISTILL_SYSTEM,
    user: distillUser,
    maxTokens: 500,
  });
  let terms = parseModelJSON(first, searchTermsSchema);
  if (!terms) {
    const retry = await provider.generateJSON({
      system: DISTILL_SYSTEM,
      user: `${distillUser}\n\n---\nYou previously replied:\n${first}\n\n${REPAIR_PROMPT}`,
      maxTokens: 500,
    });
    terms = parseModelJSON(retry, searchTermsSchema);
  }
  if (!terms) {
    throw new Error("Could not work out what to search for from that CV.");
  }

  const what =
    manualQuery ||
    [...terms.titles.slice(0, 3), ...terms.keywords.slice(0, 4)]
      .join(" ")
      .trim();
  const where = (input.location || terms.locationGuess || "").trim();

  return { what, where };
}

export async function findJobs(input: JobsRequest): Promise<JobSearchResponse> {
  const provider = getProvider();
  const source = getJobSource();

  // 1. Work out the search — an explicit keyword search, the CV distilled
  // into one, or both combined with an explicit location.
  const { what, where } = await resolveQuery(provider, input);

  // 2. Query the job board. "onsite" has no board-side param — most boards
  // only support asking for remote, not excluding it — so it's applied as a
  // filter on the normalised results below instead. A known location also
  // gets a radius, so on-site results land close by rather than scattered
  // across the whole country/region.
  const workMode = input.workMode ?? "any";
  const raw = await source.search({
    what,
    where: where || undefined,
    remoteOnly: workMode === "remote",
    country: input.country || undefined,
    publishers: input.publishers,
    radiusKm: where ? DEFAULT_RADIUS_KM : undefined,
    limit: MAX_LISTINGS_TO_RANK,
  });
  // Excludes only listings with no physical-location option — a hybrid
  // listing that offers both an office and remote still counts as on-site.
  const listings =
    workMode === "onsite" ? raw.filter((j) => !j.fullyRemote) : raw;

  const query = {
    what,
    where: workMode === "remote" ? "Remote" : where || null,
  };
  const meta = {
    source: source.name,
    provider: provider.name,
    model: provider.model,
  };
  const notices = [
    input.publishers && input.publishers.length > 0 && source.name !== "jsearch"
      ? `Filtering by job board (${input.publishers.join(", ")}) needs the JSearch source — set RAPIDAPI_KEY. Showing unfiltered results from ${source.name} instead.`
      : null,
    workMode === "onsite" && raw.length > 0 && listings.length === 0
      ? `Every result for this search was fully remote with no office option, so the on-site/hybrid filter left nothing. Try "Any" or a different search.`
      : null,
  ].filter((n): n is string => n !== null);
  const notice = notices.length > 0 ? notices.join(" ") : undefined;

  if (listings.length === 0) {
    return { jobs: [], query, notice, ...meta };
  }

  // 3. Score + explain each listing (one repair retry).
  const rankUser = buildRankUser(input.cv, listings, input.additionalSkills);
  const rankFirst = await provider.generateJSON({
    system: RANK_SYSTEM,
    user: rankUser,
  });
  let ranking = parseModelJSON(rankFirst, rankingSchema);
  if (!ranking) {
    const retry = await provider.generateJSON({
      system: RANK_SYSTEM,
      user: `${rankUser}\n\n---\nYou previously replied:\n${rankFirst}\n\n${REPAIR_PROMPT}`,
    });
    ranking = parseModelJSON(retry, rankingSchema);
  }

  const byId = new Map(listings.map((j) => [j.id, j]));
  const scored = (ranking?.matches ?? [])
    .filter((m) => byId.has(m.id))
    .map((m) => ({
      ...byId.get(m.id)!,
      matchScore: Math.max(0, Math.min(100, Math.round(m.matchScore))),
      whyItFits: m.whyItFits.trim(),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  let jobs: RankedJob[];
  let noGoodMatches = false;
  if (scored.length > 0) {
    // Prefer listings above the floor; short of that, still-usable stretch
    // matches; below MIN_USABLE_SCORE isn't a recommendation, it's noise —
    // don't pad the list out with it.
    const above = scored.filter((j) => j.matchScore >= SCORE_FLOOR);
    const usable = scored.filter((j) => j.matchScore >= MIN_USABLE_SCORE);
    if (above.length > 0) {
      jobs = above.slice(0, MAX_RESULTS);
    } else if (usable.length > 0) {
      jobs = usable.slice(0, MIN_TO_SHOW);
    } else {
      jobs = [];
      noGoodMatches = true;
    }
  } else {
    // Ranking failed entirely — show the board's top listings unscored.
    jobs = listings.slice(0, MAX_RESULTS).map((j) => ({
      ...j,
      matchScore: 0,
      whyItFits: "",
    }));
  }

  const finalNotice = noGoodMatches
    ? [
        notice,
        `Found ${listings.length} listing${listings.length === 1 ? "" : "s"} for this search, but none scored well enough against your CV to recommend. Try a broader search, a different work-mode or job-board filter, or editing your CV.`,
      ]
        .filter((n): n is string => Boolean(n))
        .join(" ")
    : notice;

  return {
    jobs,
    query,
    notice: finalNotice,
    weakOnly: noGoodMatches,
    ...meta,
  };
}

/**
 * Pulls every distinct role out of a CV so the user can pick one to search
 * against directly, instead of only getting one blended AI guess.
 */
export async function extractRoles(input: ExperienceRequest): Promise<WorkRole[]> {
  const provider = getProvider();
  const user = buildRolesUser(input.cv);

  const first = await provider.generateJSON({
    system: ROLES_SYSTEM,
    user,
    maxTokens: 800,
  });
  let result = parseModelJSON(first, experienceSchema);

  if (!result) {
    const retry = await provider.generateJSON({
      system: ROLES_SYSTEM,
      user: `${user}\n\n---\nYou previously replied:\n${first}\n\n${REPAIR_PROMPT}`,
      maxTokens: 800,
    });
    result = parseModelJSON(retry, experienceSchema);
  }

  if (!result) {
    throw new Error("Could not read distinct roles out of that CV.");
  }

  return result.roles;
}
