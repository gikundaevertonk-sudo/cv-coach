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

**Find jobs.** `findJobs()` runs three steps: (1) the model distills the CV into
job titles + keywords, (2) the configured `JobSource` queries the board and
normalises results into `JobListing`s, (3) the model scores every listing
0–100 against the CV and writes a one-line reason. Listings above a floor
score are returned, best first; if none clear it, the best few are shown
anyway with their honest (low) score, so a thin search still returns
something useful. Both model steps have a repair retry; if ranking fails
entirely the board's top listings are shown unscored.

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
