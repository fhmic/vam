# VA Phase 1: Foundation

Production foundation for VA: authentication, database, and core UI shell.
Mentor chat, Groq integration, voice, assessments, and progress are **not**
implemented in this phase — see `docs/blueprint/` for the full roadmap.

> **Foundation Hardening pass applied.** Before Phase 1B, the Phase 1A
> foundation went through a hardening pass addressing CTO review
> findings — versioned legal acceptance, richer onboarding profile
> fields, soft delete, user preferences, a real CI/CD pipeline, a
> centralized auth-verification pattern, a testing foundation, and ADRs.
> See `docs/PHASE-1A-FOUNDATION-HARDENING.md` for the full change log
> and `docs/adr/` for the architectural decisions behind it.

## Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Supabase · Vercel

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Supabase locally** (requires the [Supabase CLI](https://supabase.com/docs/guides/cli))
   ```bash
   supabase start
   ```
   This applies everything in `supabase/migrations/` to a local Postgres instance,
   seeds it (`supabase/seed.sql`), and prints local API URL / anon key.

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` from `supabase start` output (local) or your
   Supabase project settings (staging/prod).

4. **Run the app**
   ```bash
   npm run dev
   ```

## Database migrations

Schema lives in `supabase/migrations/*.sql` — this is the single source of
truth for the database. Never edit the schema by hand in the Supabase
dashboard for anything beyond local experimentation.

- Add a new migration: `supabase migration new <name>`
- Apply migrations to the linked remote project: `supabase db push --linked`
  (or let `.github/workflows/deploy.yml` do it automatically on merge to
  `main` — see "CI/CD" below)
- Regenerate TypeScript types after a schema change:
  ```bash
  npm run db:types
  ```

### Schema

- `public.profiles` — one row per authenticated user, created automatically
  by the `handle_new_user()` trigger on `auth.users` insert. Includes
  identity fields (`display_name`, `avatar_url`, `timezone`), onboarding
  profile fields (`profession`, `experience_level`, `primary_goal`), plan/
  onboarding state, and a `deleted_at` soft-delete marker.
- `public.user_preferences` — one row per user (1:1 with `profiles`),
  auto-created by the same `handle_new_user()` trigger. Mentor/UX
  preferences (`theme`, `voice_enabled`, `tts_speed`, `mentor_style`,
  `coaching_intensity`) not yet read by any Phase 1A feature — exists now
  so Phase 1B (Mentor, Voice) ships without a schema migration.
- `public.legal_documents` / `public.legal_acceptances` — versioned legal
  document catalog and an immutable per-user acceptance ledger. See
  `docs/adr/ADR-004-legal-acceptance-audit-design.md`.
- RLS: owner-only select/update on `profiles` and `user_preferences`.
  Column grants restrict *which* profile columns a user can write directly
  (`display_name`, `avatar_url`, `timezone`, `profession`,
  `experience_level`, `primary_goal`) — `plan`, `onboarding_completed_at`,
  `terms_accepted_at`, and `deleted_at` are **not** client-writable; see
  migrations `0006_profiles_column_grants.sql` and
  `0008_profile_foundation_fields.sql`, and
  `docs/adr/ADR-001-column-level-grants.md`. `legal_acceptances` has no
  client insert policy at all — writes only happen through the
  service-role client, see `docs/adr/ADR-002-service-role-isolation.md`.

### Soft delete

`profiles.deleted_at` (migration `0009_profiles_soft_delete.sql`) exists so
account deletion can offer a recovery grace period instead of immediately,
irreversibly destroying data. **Not yet implemented** in this pass: the
deletion request route, the grace-period UI, and the cleanup job. Recommended
future workflow:

1. User requests deletion → route sets `profiles.deleted_at = now()` (via the
   service role) and signs the user out. Account stays fully intact.
2. Within the grace period (suggest 30 days), the user can sign back in and
   a "restore account" action clears `deleted_at`.
3. A scheduled job (Supabase cron / external scheduler) finds profiles where
   `deleted_at < now() - interval '30 days'` and calls
   `admin.auth.admin.deleteUser(id)` — the actual data purge, achieved via
   `on delete cascade` on every table referencing `profiles`/`auth.users`
   (already true for `user_preferences` and `legal_acceptances`).
4. Until step 1 ships, `deleted_at` should also be added to the `profiles`
   RLS select policy (`and deleted_at is null`) and to the `handle_new_user()`
   flow for re-signup edge cases — deferred because there's no way to *set*
   it yet, so it can't be exercised or tested meaningfully before then.

## Authentication

- Email/password + Google OAuth via Supabase Auth.
- Session refresh + route protection happens in `middleware.ts`:
  - Unauthenticated users on protected routes → `/sign-in`
  - Authenticated users without `onboarding_completed_at` → `/onboarding`
  - Authenticated + onboarded users with an outdated legal acceptance →
    `/legal/re-accept` (see `docs/adr/ADR-003-cookie-onboarding-optimization.md`)
- Three Supabase client variants (`src/lib/supabase/`):
  - `client.ts` — browser, anon key, RLS-scoped
  - `server.ts` — Server Components/Route Handlers, anon key, RLS-scoped, cookie-bound
  - `admin.ts` — service role, **server-only**, bypasses RLS, used sparingly
- **`src/lib/supabase/auth-guard.ts`** — `verifyAuthenticatedUser()` is the
  required first call in any Route Handler before touching `admin.ts`.
  Centralizes session validation so "did we check auth before using the
  privileged client" is a one-line greppable call, not an unenforced
  per-route convention. See `docs/adr/ADR-002-service-role-isolation.md`.

## Legal acceptance

`profiles.terms_accepted_at` is kept only as a cheap "accepted something,
ever" flag. The source of truth is `legal_documents` (versioned catalog) +
`legal_acceptances` (immutable per-user ledger) — see
`docs/adr/ADR-004-legal-acceptance-audit-design.md`. Required document slugs
live in `REQUIRED_LEGAL_SLUGS` (`src/lib/legal/acceptance.ts`); route mapping
for each slug's page lives in `src/lib/legal/routes.ts`.

To publish a new version of a document (forcing re-acceptance):
1. Update the document text at `src/app/legal/<slug>/page.tsx`.
2. Insert a new `legal_documents` row with the same `slug`, a new `version`,
   and `published_at = now()` (a new migration, or a direct service-role
   insert against the linked project).
3. Every user who only accepted the prior version will be routed through
   `/legal/re-accept` on their next request once the `va_legal_current`
   cookie's 24-hour freshness window elapses (see ADR-003).

## Testing

`npm test` (Vitest). See `tests/README.md` for the unit/integration split,
what's covered so far, and how to configure integration tests against a
disposable Supabase project (never production).

## CI/CD

- `.github/workflows/ci.yml` — lint, typecheck, unit tests, build. Required
  to pass on every PR and on every push to `main`.
- `.github/workflows/deploy.yml` — runs after CI succeeds on `main`, verifies
  migrations against the linked project with a dry run, then applies them
  (`supabase db push --linked`). This closes the gap where migrations had to
  be applied manually and could drift out of sync with what's on GitHub/
  Vercel.
- The app deploy itself is triggered separately by Vercel's own GitHub
  integration (see "Deployment" below) — `deploy.yml` only owns the database
  side, sequenced to land at/near the same time as the app deploy so the app
  is never running against an un-migrated schema.

**Required secrets** (repo → Settings → Secrets and variables → Actions):

| Secret | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `ci.yml` | Safe to expose; needed at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ci.yml` | Safe to expose; needed at build time |
| `SUPABASE_ACCESS_TOKEN` | `deploy.yml` | Personal/CI access token from `supabase login` — scopes CLI access to your Supabase account |
| `SUPABASE_PROJECT_REF` | `deploy.yml` | The linked project's ref (from its dashboard URL) |
| `SUPABASE_DB_PASSWORD` | `deploy.yml` | Database password for the linked project, used by `supabase db push` |

**Production-safe migration guidance:**
- Migrations are additive-by-default in this codebase (`add column if not
  exists`, `create table if not exists`) — safe to run against a live
  database with active traffic.
- Never edit a migration file that has already been applied to staging/prod;
  write a new migration instead, even to fix a typo — `supabase db push`
  tracks applied migrations by filename/checksum, and editing history causes
  drift between what CI thinks is applied and what actually is.
- The `deploy.yml` dry-run step (`supabase db push --linked --dry-run`) is
  the guard against exactly that: it fails the job before anything is
  applied if local migration history doesn't cleanly reconcile with the
  remote project.
- For a migration that isn't safely additive (renaming/dropping a column
  another part of the app still reads, changing a type in a way existing
  rows might violate), split it into two deploys: (1) a migration + code
  change that stops reading/writing the old shape while the old shape still
  exists, ship and verify; (2) a follow-up migration that actually removes
  it.

## Deployment (Vercel)

1. Import the GitHub repo into Vercel.
2. Set environment variables per environment (Production/Preview) in Vercel
   project settings — see `.env.example` for the full list.
3. Every PR gets a Preview deployment; CI (`.github/workflows/ci.yml`) must
   pass (lint, typecheck, unit tests, build) before merge.
4. On merge to `main`, `.github/workflows/deploy.yml` applies pending
   Supabase migrations once CI is green; Vercel's own GitHub integration
   deploys the app in parallel.

## What's next (Phase 1B)
Groq integration, Mentor Memory, Communication DNA, and Mentor Chat — see
`docs/blueprint/VA-Phase1-Technical-Blueprint.md`.
