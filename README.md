# CV Coach

An AI-powered web app: paste (or upload as PDF) your **CV** and a **job
description**, and get back

- an honest **fit score** and summary,
- **strengths** grounded in your CV,
- **gaps** ranked by severity, each with a concrete way to close it,
- **ATS keywords** from the posting that are missing from your CV,
- a phased **prep plan**,
- **practice questions** (behavioural / technical / role-specific) with an answer framework for each,
- **CV tweaks** targeted at this role.

No accounts, no database — each analysis is a single request.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **Configurable AI provider** — Anthropic (Claude) or OpenAI, selected at runtime
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
| `AI_PROVIDER`       | `anthropic` or `openai`. Blank = auto-detect from whichever key is set (prefers Anthropic). |
| `ANTHROPIC_API_KEY` | Required for the Anthropic provider.                              |
| `ANTHROPIC_MODEL`   | Optional. Default `claude-opus-5`.                               |
| `OPENAI_API_KEY`    | Required for the OpenAI provider.                                |
| `OPENAI_MODEL`      | Optional. Default `gpt-4o`.                                      |

You only need the key(s) for the provider you intend to use.

## How it works

```
src/
  app/
    page.tsx                 # form + results (client component)
    api/analyze/route.ts     # POST: validate → runAnalysis → JSON
    api/extract/route.ts     # POST multipart: PDF file → { text } (size/page guards)
  components/
    AnalysisView.tsx         # renders the analysis
    ScoreDial.tsx            # fit-score ring
  lib/
    ai/
      index.ts               # getProvider() — picks provider from env
      anthropic.ts           # Claude implementation
      openai.ts              # OpenAI implementation
      types.ts               # AIProvider interface
    analysis/
      schema.ts              # zod schemas: request + AnalysisResult
      prompt.ts              # system prompt + JSON contract
      run.ts                 # orchestration: call model, extract JSON, validate, one repair retry
    extract/
      pdf.ts                 # extractPdfText() — unpdf, whitespace cleanup, guards
```

The model is asked for a single JSON object matching `analysisResultSchema`. The
response is stripped of any markdown fencing, `JSON.parse`d, and validated with
Zod. If validation fails, the model is asked once to repair its output.

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

- Streaming responses for faster perceived latency
- Mock-interview loop: user answers a question, model critiques it
- Accounts + saved analyses
