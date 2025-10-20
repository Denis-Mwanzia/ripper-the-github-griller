# BillIntel – Smarter Billing. Faster Insights. Powered by AI

An open-source AI-powered billing intelligence system for ISPs and usage-based SaaS. BillIntel ingests billing/usage data (CSV/JSON/API), computes KPIs, detects anomalies, and generates natural-language insights using Google Genkit (Gemini).

## Stack

- Frontend: React + Vite + Tailwind (`apps/billintel-web`)
- Backend: Node.js + Google Genkit (Gemini) on Firebase Functions (`apps/genkit`)
- Monorepo: Nx + pnpm
- Deployment: Vercel (frontend) + Firebase Functions (backend)
- License: MIT

## Features

- Billing Data Input: Upload CSV/JSON or push via API
- AI Billing Insights: revenue, ARPC, monthly trends, anomalies, top customers, low-margin plans
- Automated Reports: weekly/monthly summaries + Bill Health Score (0–100)
- Dashboard UI: minimalist upload + insights + historical placeholder
- Modular Genkit Workflow: easy to extend with new tools/flows

## Quickstart

Prereqs: Node 20+, pnpm, Firebase CLI, Google Cloud project (for Gemini), set `GEMINI_API_KEY` secret.

1) Install deps

```bash
pnpm install
```

2) Configure Firebase

- Login: `firebase login`
- Select/Init a project if needed
- Set secrets (locally for emulator):

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

3) Start backend (emulators)

```bash
pnpm nx serve genkit
```

This runs the Firebase Functions emulator on port 5001.

4) Start frontend

```bash
# set your project id for the dev proxy
set VITE_FIREBASE_PROJECT_ID=your-project-id   # Windows
# export VITE_FIREBASE_PROJECT_ID=your-project-id  # macOS/Linux
pnpm nx serve billintel-web
```

Open `http://localhost:4200` or Vite default (printed in console). The dev server proxies `/api/billintel` to the callable function.

5) Try the example dataset

- CSV: `apps/genkit/src/example-billing.csv`
- Paste into the CSV box or upload the file, then click Analyze.
- Sample output shape: `apps/genkit/src/sample-billintel-output.json`.

## Backend: Genkit Workflow

- Entry: `apps/genkit/src/index.ts`
- Flow: `billIntelFlow`
- Callable function: `billIntelAnalyzeFunction`
- Input: JSON array of records, or CSV string

```json
{
  "data_json": [{"customer_id":"C001","plan":"Basic","data_used":45,"amount_billed":25,"billing_date":"2025-07-01"}],
  "period": "adhoc" | "weekly" | "monthly"
}
```

- Output: stats, anomalies, healthScore, and `insights` string

## Frontend

- App UI in `apps/billintel-web/src/modules/App.tsx`
- Dev proxy in `apps/billintel-web/vite.config.ts` using `VITE_FIREBASE_PROJECT_ID`
- POST `/api/billintel` with `{ data: <payload> }` and expect `{ result: <flow-output> }`

## Deployment

### Backend (Firebase Functions)

```bash
pnpm nx build genkit
pnpm nx deploy genkit
```

Ensure `GEMINI_API_KEY` is set as a secret in the target project.

Callable function URL (emulator proxy used in dev):

- v2 callable: `https://us-central1-<projectId>.cloudfunctions.net/billIntelAnalyzeFunction`

### Frontend (Vercel)

- Build command: `pnpm nx build billintel-web`
- Output dir: `dist/apps/billintel-web`
- Add a Vercel rewrite from `/api/billintel` to your Cloud Function URL above.

Example Vercel rewrite:

```json
{
  "rewrites": [
    { "source": "/api/billintel", "destination": "https://us-central1-<projectId>.cloudfunctions.net/billIntelAnalyzeFunction" }
  ]
}
```

## Extend Workflows

Add new analyses by extending `apps/genkit/src/index.ts`:

- Define new tools (e.g., fetch from Supabase, pricing catalogs)
- Add a new `ai.defineFlow` for fraud detection or predictive revenue
- Expose via `onCallGenkit`

Ideas:

- Fraud detection: unusual usage spikes vs historical percentiles
- Predictive revenue: ARIMA/Prophet precompute + LLM summary
- Margin analysis: cost model per-plan vs billed revenue

## Optional: Supabase

- Use Supabase to persist uploads and AI summaries
- Store: raw rows, computed stats, anomalies, and insights text
- Trigger re-analysis via webhook on new uploads

## Monorepo Commands

```bash
pnpm nx serve genkit           # Firebase emulators
pnpm nx serve billintel-web    # Frontend dev server
pnpm nx build genkit
pnpm nx build billintel-web
pnpm nx deploy genkit
```

## Tagline

BillIntel – Smarter Billing. Faster Insights. Powered by AI.
