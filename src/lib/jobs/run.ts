import { getProvider } from "@/lib/ai";
import { parseModelJSON } from "@/lib/ai/json";
import { getJobSource } from "./index";
import {
  DISTILL_SYSTEM,
  RANK_SYSTEM,
  REPAIR_PROMPT,
  buildDistillUser,
  buildRankUser,
} from "./prompt";
import {
  rankingSchema,
  searchTermsSchema,
  type JobSearchResponse,
  type JobsRequest,
  type RankedJob,
} from "./schema";

const MAX_LISTINGS_TO_RANK = 25;
const MAX_RESULTS = 12;
/** Drop listings the model scores below this; if that empties the list, keep the best few anyway. */
const SCORE_FLOOR = 30;
const MIN_TO_SHOW = 5;

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

  const distillUser = buildDistillUser(input.cv);
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
  // filter on the normalised results below instead.
  const workMode = input.workMode ?? "any";
  const raw = await source.search({
    what,
    where: where || undefined,
    remoteOnly: workMode === "remote",
    country: input.country || undefined,
    publishers: input.publishers,
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
  const rankUser = buildRankUser(input.cv, listings);
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
  if (scored.length > 0) {
    // Prefer listings above the floor; if none clear it, keep the best few so
    // the user still sees the model's honest take.
    const above = scored.filter((j) => j.matchScore >= SCORE_FLOOR);
    jobs = (above.length > 0 ? above : scored.slice(0, MIN_TO_SHOW)).slice(
      0,
      MAX_RESULTS,
    );
  } else {
    // Ranking failed entirely — show the board's top listings unscored.
    jobs = listings.slice(0, MAX_RESULTS).map((j) => ({
      ...j,
      matchScore: 0,
      whyItFits: "",
    }));
  }

  return { jobs, query, notice, ...meta };
}
