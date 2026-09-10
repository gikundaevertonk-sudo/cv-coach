# CV Coach

An AI-powered web app with two modes. Paste (or upload as PDF) your **CV** —
plus a **job description** for the first mode:

**Analyse fit** — CV vs. one job description:

- an honest **fit score** and summary,
- **strengths** grounded in your CV,
- **gaps** ranked by severity, each with a concrete way to close it,
- **ATS keywords** from the posting that are missing from your CV,
- a phased **prep plan**,
- **practice questions** (behavioural / technical / role-specific) with an answer framework for each,
- **CV tweaks** targeted at this role.

**Find jobs** — CV vs. the open market: the model distills your CV into a
search, pulls live vacancies from a job board (Adzuna or JSearch), and scores
each listing against your background with a one-line reason it fits.

No accounts, no database — each request is self-contained.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **Configurable AI provider** — Anthropic (Claude), OpenAI, or DeepSeek, selected at runtime
- **Configurable job source** — Adzuna or JSearch (RapidAPI), for the *Find jobs* mode
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
| `DEEPSEEK_API_KEY`  | Required for the DeepSeek provider.                              |
| `DEEPSEEK_MODEL`    | Optional. Default `deepseek-chat` (use `deepseek-reasoner` for R1). |
| `DEEPSEEK_BASE_URL` | Optional. Default `https://api.deepseek.com`.                    |
| `JOBS_PROVIDER`     | *Find jobs* only. `adzuna` or `jsearch`. Blank = auto-detect (JSearch if `RAPIDAPI_KEY` set, else Adzuna). |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Free key pair from [developer.adzuna.com](https://developer.adzuna.com). |
| `ADZUNA_COUNTRY`    | Optional default country (ISO-2). Default `us`.                  |
| `RAPIDAPI_KEY`      | For JSearch — subscribe to [JSearch on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch). |

You only need the key(s) for the provider you intend to use. DeepSeek uses an
OpenAI-compatible API, so it runs through the OpenAI SDK with a different base
URL. The *Find jobs* tab needs one job source configured; the *Analyse fit* tab
does not.

## How it works

```
src/
  app/
    page.tsx                 # hero + tab switcher (client component)
    api/analyze/route.ts     # POST: validate → runAnalysis → JSON
    api/extract/route.ts     # POST multipart: PDF file → { text } (size/page guards)
    api/jobs/route.ts        # POST: validate → findJobs → ranked listings
  components/
    Field.tsx                # textarea + "Upload PDF" control (shared)
    AnalyseTab.tsx           # "Analyse fit" form + loading + results
    JobsTab.tsx              # "Find jobs" form + loading
    AnalysisView.tsx         # renders the fit analysis
    JobResults.tsx           # renders ranked job listings
    ScoreDial.tsx            # fit-score ring
    icons.tsx                # inline SVG icon set
  lib/
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
      adzuna.ts jsearch.ts   # JobSource implementations (normalised JobListing)
      types.ts schema.ts prompt.ts
      run.ts                 # distill CV → search → rank listings against the CV
```

**Analyse fit.** The model is asked for a single JSON object matching
`analysisResultSchema`; the reply is stripped of markdown fencing, `JSON.parse`d,
and validated with Zod. On failure the model is asked once to repair its output.

**Find jobs.** `findJobs()` runs three steps: (1) the model distills the CV into
job titles + keywords, (2) the configured `JobSource` queries the board and
normalises results into `JobListing`s, (3) the model scores each listing 0–100
against the CV and writes a one-line reason. Listings scoring ≥ 45 are returned,
best first. Both model steps have a repair retry; if ranking fails entirely the
board's top listings are shown unscored.

**PDF upload.** Each of the CV and job-description fields has an *Upload PDF*
control. The file is posted to `/api/extract`, which rejects non-PDFs, files
over 10 MB, and PDFs over 30 pages, then extracts text with `unpdf` and returns
it for the user to review and edit. Image-only scans (no text layer) are
rejected with a message to paste the text instead.

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
