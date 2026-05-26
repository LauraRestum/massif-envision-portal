# Massif Program Pipeline — Envision Portal

Next.js 15 (App Router) + TypeScript + Tailwind v4 dashboard portal for tracking
active program opportunities shared between Envision and Massif. Designed for
zero-cost deployment on Vercel.

## Stack

- **Next.js 15** with the App Router and React 19
- **TypeScript** for type safety
- **Tailwind v4** available for utility classes; existing custom design system
  preserved verbatim in `app/globals.css`
- **Static JSON** for pipeline data (`data/pipeline.json`) — no backend required

## Local development

```bash
npm install
npm run dev
```

Visit <http://localhost:3000>.

## Project layout

```
app/
├── layout.tsx              # Root layout + Montserrat font
├── page.tsx                # Dashboard composition
├── globals.css             # Full design system (lifted from original draft)
└── components/             # Nav, Hero, KpiStats, GanttCard, Pipeline, etc.
data/
└── pipeline.json           # 15-row pipeline data; edit directly to update
lib/
└── types.ts                # PipelineLine, PipelineStatus, STATUS_LABEL
```

## Editing the pipeline

Update `data/pipeline.json` and commit. The dashboard re-renders automatically
on next build. Each row matches the `PipelineLine` type in `lib/types.ts`.

## Submit Update modal

Currently a UI placeholder. When ready to wire submissions, replace the modal
body in `app/components/SubmitModal.tsx` with a form posting to Web3Forms (for
external Massif users) or a Vercel serverless route (for internal email).

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel (<https://vercel.com/new>).
3. Vercel auto-detects Next.js — no env vars required.
4. Deploy.

## Original draft

The original single-file HTML draft is preserved at the repo root as
`Massif_Pipeline_Dashboard_v3-4.html` for reference.
