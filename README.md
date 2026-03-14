# BurgerBot KDS

KDS rebuild bootstrap using:

- Next.js + React + Tailwind
- Tauri desktop shell
- Supabase

## Why this setup

This repo is configured for **Option A** integration:

- OrangePi runtime remains unchanged.
- Existing connector contract remains stable.
- KDS side is rebuilt on this stack and integrated through the existing event/contract boundary.

Reference: `docs/option-a-contract.md`

## Prerequisites

- Node.js 22+
- Rust toolchain (for Tauri)

## Environment

1. Copy `.env.example` to `.env.local`
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Run web app

```bash
npm install
npm run dev
```

## Run desktop app (Tauri)

```bash
npm run tauri:dev
```

## Build desktop app

```bash
npm run tauri:build
```

## Notes

- Next is configured with `output: "export"` for Tauri static bundling.
- If you need server-side APIs, run a separate backend/worker service (recommended for queue processing and idempotency).
