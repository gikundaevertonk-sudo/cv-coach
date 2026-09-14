# CV Coach

An AI-powered web app. The primary flow: **upload your CV as a PDF** and find
live job vacancies that fit it. A secondary mode compares your CV against one
specific job description.

**Find jobs** (default, home tab) — CV vs. the open market: drop in a PDF (or
paste text), and the model distills your CV into a search, pulls live
vacancies from a job board (The Muse by default — no key — or Adzuna /
JSearch), and scores each listing against your background with a one-line
reason it fits. On any listing, click **Tailor CV & cover letter** and the
model rewrites your CV for that specific job and drafts a matching cover
letter — on demand, per job, never automatically.

**Analyse fit** — CV vs. one job description:

- an honest **fit score** and summary,
- **strengths** grounded in your CV,
- **gaps** ranked by severity, each with a concrete way to close it,
- **ATS keywords** from the posting that are missing from your CV,
- a phased **prep plan**,
- **practice questions** (behavioural / technical / role-specific) with an answer framework for each,
- **CV tweaks** targeted at this role.

No accounts, no database — each request is self-contained.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **Configurable AI provider** — Anthropic (Claude), OpenAI, or DeepSeek, selected at runtime
- **Configurable job source** — The Muse (keyless), Adzuna, or JSearch (RapidAPI), for the *Find jobs* mode
- **Zod** for request + model-output validation
- **unpdf** for server-side PDF text extraction (CV / job description upload)

## Setup

```bash
npm install
cp .env.example .env.local   # then edit .env.local
npm run dev                  # http://localhost:3000
```

### Environment (`.env.local`)

| Variable            | Purpose                                                              |
| ------------------- | ------------------------------------------------------------------ |
| `AI_PROVIDER`       | `anthropic`, `openai`, or `deepseek`. Blank = auto-detect from whichever key is set (prefers Anthropic, then OpenAI, then DeepSeek). |
| `ANTHROPIC_API_KEY` | Required for the Anthropic provider.                              |
| `ANTHROPIC_MODEL`   | Optional. Default `claude-opus-5`.                               |
| `OPENAI_API_KEY`    | Required for the OpenAI provider.                                |
| `OPENAI_MODEL`      | Optional. Default `gpt-4o`.                                      |
| `DEEPSEEK_API_KEY`  | Required for the DeepSeek provider. One key, or several comma-separated to round-robin requests across them. |
| `DEEPSEEK_MODEL`    | Optional. Default `deepseek-chat` (use `deepseek-reasoner` for R1). |
| `DEEPSEEK_BASE_URL` | Optional. Default `https://api.deepseek.com`.                    |
| `JOBS_PROVIDER`     | *Find jobs* only. `themuse`, `adzuna` or `jsearch`. Blank = auto-detect (JSearch if `RAPIDAPI_KEY` set, else Adzuna if its keys set, else The Muse). |
| `THEMUSE_API_KEY`   | Optional. The Muse works without it; a key just raises rate limits. |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Free key pair from [developer.adzuna.com](https://developer.adzuna.com). |
| `ADZUNA_COUNTRY`    | Optional default country (ISO-2). Default `us`.                  |
| `RAPIDAPI_KEY`      | For JSearch — subscribe to [JSearch on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch). |

You only need the key(s) for the AI provider you intend to use. DeepSeek uses an
OpenAI-compatible API, so it runs through the OpenAI SDK with a different base
URL. The *Find jobs* tab works with no job key (The Muse); Adzuna and JSearch
give broader coverage and salary data.

## How it works

```
src/
  app/
    page.tsx                 # hero + tab switcher (client component)
    api/analyze/route.ts     # POST: validate → runAnalysis → JSON
    api/extract/route.ts     # POST multipart: PDF file → { text } (size/page guards)
    api/jobs/route.ts        # POST: validate → findJobs → ranked listings
    api/jobs/experience/route.ts   # POST { cv } → distinct roles found in it
    api/tailor/route.ts      # POST: validate → runTailor → tailored CV + cover letter
  components/
    PdfCvInput.tsx           # primary CV input for "Find jobs": PDF dropzone first, paste as fallback
    CountrySelect.tsx        # searchable, scrollable country combobox (~200 countries)
    Field.tsx                # textarea + "Upload PDF" control, used by "Analyse fit"
    AnalyseTab.tsx           # "Analyse fit" form + loading + results
    JobsTab.tsx              # "Find jobs" form + loading
    AnalysisView.tsx         # renders the fit analysis
    JobResults.tsx           # renders ranked listings + per-job "Tailor CV & cover letter"
    ScoreDial.tsx            # fit-score ring
    icons.tsx                # inline SVG icon set
  lib/
    countries.ts             # WORLD_COUNTRIES — ISO-3166 codes + names for CountrySelect
    ai/
      index.ts               # getProvider() — picks provider from env
      anthropic.ts openai.ts deepseek.ts   # provider implementations
      json.ts                # extractJSON + parseModelJSON (shared)
      types.ts               # AIProvider interface
    analysis/
      schema.ts prompt.ts run.ts           # request/output schemas, prompt, orchestration
    extract/
      pdf.ts                 # extractPdfText() — unpdf, whitespace cleanup, guards
    jobs/
      index.ts               # getJobSource() — picks board from env
      themuse.ts adzuna.ts jsearch.ts   # JobSource implementations (normalised JobListing)
      types.ts schema.ts prompt.ts
      run.ts                 # distill CV → search → rank listings against the CV
    tailor/
      schema.ts prompt.ts run.ts           # tailor one CV + one job → { tailoredCv, coverLetter, notes }
```

**Find jobs.** `findJobs()` resolves what to search for, queries the
configured `JobSource`, then scores what comes back. The *Job title or
keywords* field is a direct search bar — when filled it's used verbatim as
the query, taking priority over the CV. Left blank, the model distills the
CV into titles + keywords instead; either way, a missing location also falls
back to the CV's own guess. The CV-distill call is skipped entirely when both
a keyword search and a location are given, since nothing would be left for it
to contribute. The job source then normalises results into `JobListing`s, and
the model scores every listing 0–100 against the CV with a one-line reason.
Listings above a floor score (30) are returned, best first. Short of that,
listings still above a minimum usable score (20) are shown as honest
stretch options, capped at 4 — a thin search still returns something
useful, e.g. searching a role that doesn't quite fit the CV correctly
returns real listings, scored low. Below 20 is not a recommendation, just
noise, so nothing is padded in to fill space: the response comes back with
`jobs: []`, `weakOnly: true`, and a notice explaining that listings existed
but none scored well, rather than silently forcing a handful of near-zero
matches into view. (Earlier versions padded results out to 5 regardless of
score — compounding filters like on-site-only + a narrow keyword search
against a thin free-tier board made that visibly worse over time; this
floor is the fix.) Both model steps have a repair retry; if ranking fails
entirely the board's top listings are shown unscored.
Every result is pulled from a verified job-board API — Adzuna, JSearch, or
The Muse — never scraped.

**Geographic radius.** When a location is known (typed or CV-guessed),
searches on Adzuna (`distance`) and JSearch (`radius`) are kept within 25 km
of it by default, so "on-site" results land nearby instead of scattered
across the whole country — both are real, documented parameters on those
APIs, confirmed against their docs/SDKs. The Muse has no radius concept (a
fixed vocabulary of location strings instead), so it's unaffected.

**Additional skills.** A free-text field for anything true that the CV
doesn't mention — self-reported, not extracted. It's folded into the CV
context for search-term distillation, ranking, and Tailor CV & cover letter,
explicitly labelled to the model as candidate-stated rather than part of the
CV, so it can be used without licence to invent *around* it.

**Work history as search options.** "Pick from your work history" calls
`extractRoles()`, a dedicated model step that lists every distinct position
literally described in the CV (title, company, period) — for a
career-changer's CV this surfaces each past line of work as its own option,
not just one blended AI guess. Click one to load it into the search bar. This
also caught a real bug worth naming: `PdfCvInput`'s paste box used to collapse
to a summary the instant its value went non-empty, which meant typing (not
pasting) a CV lost the textarea after the first keystroke. Paste mode now
keeps the textarea mounted for as long as it's active, regardless of content.

**Work mode.** *Any* (default) mixes remote and on-site/hybrid freely.
*Remote only* asks the board for remote listings. *On-site / hybrid only*
excludes a listing only when remote is its *sole* option (`fullyRemote` on
`JobListing`) — a hybrid listing offering both an office and remote still
counts as on-site, it isn't thrown out just because remote is also on the
table. This distinction matters: The Muse in particular returns many listings
with several offices *and* "Flexible / Remote" side by side, and naively
excluding anything remote-tagged left "On-site only" with nothing. Sources
that can't tell hybrid from fully-remote (a single location string, or a
plain boolean with no further signal) set `fullyRemote` equal to `remote`.

**LinkedIn / Indeed.** Neither site offers a public API for this kind of
integration, and scraping either one directly breaks their terms of service —
this app does neither. What it does instead: JSearch (RapidAPI) aggregates
Google for Jobs, which itself indexes postings originally published on
LinkedIn, Indeed, Glassdoor, and others, and returns which site each one came
from (`job_publisher`). The *Only from* toggles in "Find jobs" filter JSearch
results down to just those two publishers. This only works when the resolved
job source is JSearch (`RAPIDAPI_KEY` set); on any other source the response
carries a `notice` explaining that and falls back to unfiltered results —
never a silent no-op. Every listing also shows its originating publisher as a
badge when the source provides one.

**Tailor CV & cover letter.** Triggered per job, only when the user clicks it.
`runTailor()` sends the CV plus that one listing's title/company/location/
snippet and asks the model for a rewritten CV, a cover letter, and 2-5 notes on
what it changed and why. The prompt forbids inventing employers, titles,
dates, or skills — it may only reorder, re-emphasize, and tighten wording, and
must address a real gap honestly rather than paper over it. Results render
inline on the job card as read-only, copyable text blocks; nothing is saved
server-side.

**Analyse fit.** The model is asked for a single JSON object matching
`analysisResultSchema`; the reply is stripped of markdown fencing, `JSON.parse`d,
and validated with Zod. On failure the model is asked once to repair its output.

**PDF upload.** `PdfCvInput` (the "Find jobs" CV field) leads with a
drag-and-drop dropzone; "Analyse fit" uses `Field`, a textarea with an *Upload
PDF* button. Both post the file to `/api/extract`, which rejects non-PDFs,
files over 10 MB, and PDFs over 30 pages, then extracts text with `unpdf` and
hands it back for the user to review and edit. Image-only scans (no text
layer) are rejected with a message to paste the text instead.

## Scripts

| Command         | Description                    |
| --------------- | ---------------------------- |
| `npm run dev`   | Dev server                   |
| `npm run build` | Production build + typecheck |
| `npm start`     | Serve the production build   |
| `npm run lint`  | ESLint                       |

## Roadmap ideas

- Merge results from multiple job sources, de-duplicated
- Streaming responses for faster perceived latency
- Mock-interview loop: user answers a question, model critiques it
- Accounts + saved analyses
