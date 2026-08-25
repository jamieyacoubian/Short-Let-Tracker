# London Rental Command Centre

A private, mobile-friendly workspace for tracking a London short-let search — every property, enquiry, agent reply, viewing and draft in one organised place. Built for Jamie & Margaret's search, with the Google Sheet **"Jamie & Margaret — London Rental CRM"** as the persistent source of truth.

This is a working application, not a mock-up: the local database is seeded from a real snapshot of the CRM sheet (44 properties, 54 contact-log entries, 13 drafts, 41 agents/sources, 13 archived leads), and every page reads and writes real data through Prisma.

## What this is

- **Dashboard** — "where the search stands" at a glance: stat tiles, an auto-generated estate-agent-style assessment, upcoming viewings, a ranked "best options now" list, an urgency-ordered action list, and a pipeline chart.
- **Pipeline** — Kanban (13 stages) and sortable table views, with filters for area, price, bedrooms, bills, short-let confirmation, viewing status, agent, tier and WFH suitability, plus global search.
- **Property detail** — verified photo gallery (with provenance tracking), full facts sheet, structured evaluation with Poor/Fair/Good/Excellent ratings, transport links, an embedded map, a chronological contact/email timeline, drafts, viewings, and a "view original CRM row" panel.
- **Viewings** — agenda, calendar and map views; a viewing is only ever shown as confirmed when it carries an exact date and time.
- **Compare** — up to four properties side by side, with the strongest/weakest value highlighted per row.
- **Drafts** — prepared enquiry/reply text with a character count and one-click copy. The app can never send anything.
- **Settings & integrations** — live connection status for Sheets, Gmail, Calendar, the map provider and image verification, plus the Agents & Sources watchlist and a sync/audit log.

## Tech stack

Next.js 16 (App Router, TypeScript, Turbopack) · Tailwind CSS v4 · Radix-based component system · Prisma (SQLite locally, Postgres-ready) · Zod · Auth.js v5 · googleapis · Vitest · Playwright.

## Local setup

```bash
npm install
cp .env.example .env        # fill in at least ADMIN_PASSWORD to sign in locally
npx prisma migrate deploy   # or: npm run db:migrate
npm run db:seed             # imports prisma/seed-data/crm-snapshot.json
npm run dev
```

Open <http://localhost:3000> and sign in with the username/password you set in `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

### Data model & CRM mapping

`prisma/schema.prisma` mirrors the sheet's tabs:

| Sheet tab | Prisma model(s) |
|---|---|
| Property Pipeline | `Property`, `Agent`, `TransportLink` |
| Contact Log | `ContactLogEntry` |
| Drafts | `Draft` |
| Agents & Sources | `Source` |
| Archive & Leads | `ArchiveLead` |
| Criteria & Rules | not imported — this tab is Jamie's operating rules for briefing/drafting, not property data |

Every `Property`, `ContactLogEntry`, `Draft` and `ArchiveLead` row keeps a `sourceRow` field: the verbatim original sheet row as JSON, viewable from the property detail page ("View original Property Pipeline row"). Structured fields (price, bedrooms, status, etc.) are a best-effort *parsed* view of the sheet's free-text columns — when a column says "Not stated — confirm", the structured field is left `null` and the UI shows "Not stated — confirm with agent", never a guess.

`prisma/seed-data/crm-snapshot.json` is a point-in-time export of the real sheet, produced by `prisma/seed.ts`'s column mapping (mirrored in `src/server/integrations/sheets.ts` for live syncing). It is not fabricated demo data.

## Running tests

```bash
npm test              # unit tests: duplicate matching, status/urgency logic, price conversion
npm run test:e2e       # Playwright: open a property, compare properties, record a viewing note
```

The unit test file `prisma/import.test.ts` is an integration test for the CRM import pipeline — it runs against the real local SQLite database and checks the seeded data matches the sheet snapshot (run `npm run db:seed` first if `dev.db` is empty).

`npm run test:e2e` expects a server at `http://localhost:3100` (or set `E2E_BASE_URL`); it starts one automatically via `playwright.config.ts` if none is running.

## Connecting live integrations

The app runs fully useful with **zero external credentials** — local sign-in, all pages, the whole pipeline. Connecting real Google access is a separate, deliberate step:

1. **Google Cloud project**: enable the Sheets, Gmail and Calendar APIs, create an OAuth 2.0 **Web application** client, and add `<your-url>/api/auth/callback/google` as an authorised redirect URI.
2. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_GOOGLE_EMAILS` (comma-separated — Google sign-in is refused for anyone not listed, even if they complete Google's consent screen) and `CRM_SPREADSHEET_ID` in `.env`.
3. Sign in with **Continue with Google** on the login page instead of the local access code, and grant the requested scopes.
4. Go to **Settings & integrations** and click **Sync now from Google Sheets**.

Scopes requested are the minimum needed: `spreadsheets` (read/write, for the CRM), `gmail.readonly`, `calendar.readonly`. There is no send-mail, create-event, or Sheets-bulk-overwrite code path anywhere in the app — see "Guardrails" below.

For a map, set `NEXT_PUBLIC_MAP_PROVIDER` to `mapbox` or `google` plus the matching public token (`NEXT_PUBLIC_MAPBOX_TOKEN` / `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Property detail pages work without one too — a keyless Google Maps embed renders whenever a property has coordinates, and "Open in Google Maps" links always work.

## Guardrails (by design, not just by convention)

- **Never sends anything.** No Gmail send/modify scope, no send code path, no portal-form submission. Drafts are prepared text with a copy-to-clipboard button — nothing more.
- **Never writes to Google Calendar.** The Calendar adapter (`src/server/integrations/calendar.ts`) only calls `events.list`.
- **Never marks a viewing confirmed without an exact time.** Enforced in the Zod schema (`viewingConfirmedRequiresExactTime`) and in the "Add viewing" dialog.
- **Never shows an unverified photo as if it were real.** `src/server/integrations/images.ts` only marks an image `VERIFIED` when its source listing URL matches the property's own listing URL or portal reference; anything else renders as an explicit "Image not verified" placeholder, never a possibly-wrong photo.
- **Never invents a fact.** Structured fields are `null` (rendered "Not stated — confirm with agent") rather than guessed, and that state is styled distinctly from an explicit "No".
- **Sheets writes are targeted, not bulk.** `writeBackField` in `src/server/integrations/sheets.ts` updates one cell at a time by header name, so existing formulas/formatting/validation elsewhere in the sheet are never touched.

## Deployment (private)

### Vercel (recommended — this is what `vercel-build` is for)

Prisma's schema is written for SQLite (local dev), but a `vercel-build` script
(see `package.json`) generates a Postgres-flavoured copy of the same schema
at build time (`scripts/prepare-postgres-schema.mjs` swaps the datasource
provider — nothing is hand-duplicated), pushes it to whatever `DATABASE_URL`
is set on Vercel, seeds it from the CRM snapshot **only if it's empty** (so
redeploys never wipe real edits), then builds. Vercel auto-detects and runs
`vercel-build` in place of `build` when the script is present, so no extra
configuration is needed beyond env vars.

1. **Import the repo**: [vercel.com/new](https://vercel.com/new) → import
   `jamieyacoubian/Short-Let-Tracker` → select the branch you want to deploy.
2. **Add a database**: in the project's **Storage** tab, create a Postgres
   database (Vercel's own, or connect Neon/Supabase). Vercel will offer to
   link its connection string(s) to the project automatically — make sure
   one of them ends up set as the `DATABASE_URL` env var (rename it in
   **Settings → Environment Variables** if Vercel names it something else,
   e.g. `POSTGRES_PRISMA_URL`).
3. **Set the rest of the env vars** (Settings → Environment Variables) from
   `.env.example` — at minimum `AUTH_SECRET` (generate with
   `npx auth secret`), `AUTH_TRUST_HOST=true`, and `ADMIN_PASSWORD` (or the
   Google OAuth variables). `CRM_SPREADSHEET_ID` is already pinned in
   `.env.example` to the real sheet.
4. **Deploy**. Watch the build logs for the `prepare-postgres-schema` /
   `db push` / seed steps — that's where you'll see if the database
   connected correctly.
5. Sign in at the deployed URL with `ADMIN_USERNAME` / `ADMIN_PASSWORD` (or
   Google, once configured).

### Any other platform

1. Provision a Postgres database and set `DATABASE_URL` to it (SQLite is for local dev only).
2. Run `npx prisma db push --schema=prisma/schema.production.prisma` against it (generated by `node scripts/prepare-postgres-schema.mjs`), then `npm run db:seed` if you want to start from the sheet snapshot (or connect Google and run a live sync instead).
3. Set every variable from `.env.example`, generating a fresh `AUTH_SECRET` (`npx auth secret`).
4. Deploy behind authentication you control — this app has its own login, but there is no reason not to also put it behind your hosting platform's access controls if available. `robots.txt` blocks all crawlers and every page sets `noindex, nofollow`.
5. Build with `npm run build`, run with `npm run start`.

## Known limitations

- **No property photographs are seeded.** The sheet has no verifiably-linked image URLs, so galleries start empty by design; attach photos manually (with their source listing URL) once available, or wire up a portal-image adapter that calls `classifyProvenance`.
- **Transport times** are parsed heuristically from the sheet's free-text "Transport Summary" column where a "destination NN–NN min" pattern is present; anything else is left unrecorded rather than guessed.
- **Google token refresh** is minimal — the OAuth access token is stored on the session but there's no background refresh-token rotation loop; a long-lived session may need to re-consent.
- **No drag-and-drop on the Kanban board** — status changes use an inline dropdown on each card instead.
- **Coordinates aren't geocoded** from the sheet's address text — the map falls back to an "Open in Google Maps" search link until `latitude`/`longitude` are set on a property.
