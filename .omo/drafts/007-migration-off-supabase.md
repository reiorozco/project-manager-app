# ulw-plan draft: 007-migration-off-supabase

---
slug: 007-migration-off-supabase
intent: clear
review_required: false
status: approved
approved_at: 2026-07-24
started_at: 2026-07-24
final_plan_path: /Users/reiorozco/Dev/project-manager-app/.omo/plans/007-migration-off-supabase.md
project_convention_copy: /Users/reiorozco/Dev/project-manager-app/specs/007-migration-off-supabase.md  # executor copies in Fase 0 todo 1
---

## Request summary

Migrate `project-manager-app` off Supabase (Postgres + Auth + Storage) to Vercel-native
services so a Supabase free-tier slot can be freed for `matchday-dev`. Three replacements
are locked by the user:

1. Postgres → Vercel Postgres (Neon-powered), free tier.
2. Auth → Better Auth (self-hosted, 3 roles: manager/client/designer), free.
3. Storage → Vercel Blob, free tier.

Six phases (0-5). Final action of Fase 5 = delete Supabase project + uninstall Supabase MCP.
Deploy on Vercel (project already linked: `prj_fucqpIJyAjFuMlHu2UHWggmKmpLh`).

## Exploration ledger

- Auth surface — full inventory of `@supabase/ssr` / `@supabase/supabase-js` usage
  (init, middleware, callback, roles via `user_metadata` + Prisma `User.role`,
  no RLS, no service-role key). 6 auth routes, 7 API routes with `auth.getUser()`.
- Storage surface — 6 direct API call sites for bucket `project-files`, private,
  path `projects/${userId}/${Date.now()}-${filename}`, download via authenticated
  `.download()`, `MAX_FILE_SIZE = 5 MB`, up to 5 files per project.
- Data model — `User (cuid, email, name, role: UserRole enum)`, `Project` (with
  `status: ProjectStatus`, `dueDate`), `File` (cascade delete). 2 migrations.
  No Account/Session/VerificationToken tables (external auth today).
- Repo state — `main` branch, clean tree except untracked `.omo/` and `specs/`.
  Prisma `7.8.0` with `PrismaPg` adapter (NOT Prisma 6 as originally noted in
  the request). `prisma.config.ts` already loads `DIRECT_URL`. `.mcp.json` does
  not exist.
- Supabase project ref (from `.env.local`): `hslsqmuhkctcjftwnive`.
- Demo users (README verbatim): `manager@demo.com`, `client@demo.com`,
  `designer@demo.com` — password `demo1234`.
- Better Auth docs (v1.6 July 2026) — Prisma adapter generates User/Session/
  Account/Verification, `emailAndPassword` plugin, `nextCookies()` for Server
  Actions, middleware pattern `auth.api.getSession({ headers })` with
  `runtime: "nodejs"`, `additionalFields` supports typed role column.
- Vercel/Neon docs — free tier 512 MB + 190 h compute + 10 databases. Env vars:
  `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct). Migration recipe:
  Prisma-first (`db push` empty schema, then `pg_dump --data-only
  --exclude-schema=auth --exclude-schema=storage` → `psql` restore).
- Vercel Blob docs — free tier 1 GB storage + 5 GB bandwidth. `@vercel/blob >=
  2.3.0` for private storage. Server upload capped at 4.5 MB by function body
  limit → client upload (`handleUpload`) required for the app's 5 MB max file
  size.

## Decisions adopted as defaults (announced — user can veto)

1. **Prisma DB adapter:** keep `@prisma/adapter-pg` (currently in use, works fine
   with Neon Postgres). Do NOT switch to `@prisma/adapter-neon` in this migration
   (reversible optimization for later).
2. **Env var names:** keep `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in
   code. When connecting the Neon store in Vercel, alias
   `DATABASE_URL_UNPOOLED` → `DIRECT_URL` in the project env config (zero
   code changes to `prisma.config.ts` and `lib/prisma.ts`).
3. **Better Auth role modeling:** use `additionalFields.role` with type union
   `["CLIENT", "PROJECT_MANAGER", "DESIGNER"]`, `input: false`, default
   `"CLIENT"`. Matches the existing Prisma `UserRole` enum exactly, keeps
   `project-service.ts` authorization untouched. Do NOT use the `admin` plugin
   (adds permission-matrix overhead we do not need).
4. **Data migration order:** Prisma-first — `prisma db push` empty Neon
   database, then `pg_dump --data-only --exclude-schema=auth
   --exclude-schema=storage --no-owner --no-privileges` from Supabase, then
   `psql --set ON_ERROR_STOP=1 -f data.sql` into Neon. Row-count verification
   per table on both sides.
5. **Demo user password strategy:** re-create the 3 demo users from scratch in
   Better Auth via a seed script (scrypt hashing). Do NOT try to import bcrypt
   hashes from Supabase — only 3 demo users, user pre-authorized changing
   passwords in the README. If passwords change, README table is updated in
   the same commit.
6. **Vercel Blob store access level:** private store. Matches current Supabase
   behavior (files served via authenticated `.download()`, not public URLs).
   Downloads go through an authenticated Route Handler that streams the blob.
7. **Vercel Blob upload strategy:** client-side upload via `@vercel/blob/client`
   `upload()` + `handleUpload` route handler. Required because
   `MAX_FILE_SIZE = 5 MB` exceeds the Vercel Functions 4.5 MB request body
   limit.
8. **Blob path convention:** `projects/${userId}/${fileId}-${sanitizedFilename}`
   with `addRandomSuffix: false, allowOverwrite: false`. `fileId` = the
   Prisma `File.id` (cuid), generated up-front so the blob path is stable and
   matches the DB record for backfill and delete flows.
9. **Backfill of existing Supabase Storage files:** included as a script in
   Fase 3 (`scripts/backfill-storage.ts`). Iterates `File` rows, downloads
   from Supabase via `supabaseAdmin.storage.from('project-files').download(path)`
   using the existing anon key + a temporary service role key, uploads to Blob
   via `put()`, updates `File.path` (or a new `File.blobUrl` column — see
   subquestion in Fase 3). Idempotent (skips already-migrated rows).
10. **Rollback posture during Fases 1-4:** Supabase project stays ACTIVE and
    untouched. Rollback = revert Vercel env vars + git revert. Supabase project
    deletion is the LAST step of Fase 5, only after production verification.
11. **Env var management:** Vercel-native — `vercel env pull` for local dev,
    Vercel Dashboard for prod/preview. `.env.example` updated in each fase.
    `.env.local` NEVER committed.
12. **MCP setup:** Supabase MCP (read-only, scoped to project `hslsqmuhkctcjftwnive`)
    written to `.mcp.json` in Fase 0 as a work-only tool. Removed in Fase 5.
13. **Neon region:** `us-east-1` (matches current Supabase pooler region
    `aws-1-us-east-2` — closest to existing traffic).
14. **Preview branching (Neon):** NOT enabled in this migration (extra
    complexity, project is a portfolio deploy). Preview and Production use
    the same Neon branch. Optional future work.
15. **Migration downtime:** brief cutover accepted. Existing Supabase sessions
    invalidate when demo users are re-created in Better Auth.
16. **Language:** all artifacts (spec, commits, code, PR, tests, branches) in
    English per user's convention. Chat with the user stays in Spanish.
17. **No auto-signatures** in commits/docs per user's global config.
18. **Spec file location:** `specs/007-migration-off-supabase.md` (next
    sequential number — only 005 and 006 exist in `specs/`).

## Open questions (all resolved)

- **Email verification in Better Auth** — RESOLVED 2026-07-24. User chose
  DISABLE. Plan: `emailAndPassword.requireEmailVerification: false`. Delete
  the routes `app/auth/register/confirm/page.tsx`, `app/auth/confirm/route.ts`,
  and `app/auth/callback/route.ts` (last one is replaced by Better Auth's
  own `[...all]` handler). Seed 3 demo users pre-verified
  (`emailVerified: true` in the User row) via a script. New sign-ups land
  authenticated immediately. No email provider added. Register page redirects
  to home on success instead of the confirm page.

## Approach

Six-fase migration, one commit per completed fase, explicit OK gate between
every fase (user contract). Fase 0 tools up. Fases 1-3 replace DB, Auth,
Storage independently (DB first because Better Auth needs its tables). Fase 4
verifies prod. Fase 5 deletes Supabase + MCP.

## Next workflow action

Awaiting user answer to the email-verification question + explicit approval
to write the plan at `specs/007-migration-off-supabase.md`. On approval:
1. Write the full plan to that path (English, decision-complete, agent-executed
   QA per todo, exact `pg_dump` / `psql` / Better Auth CLI invocations).
2. Do NOT begin execution. Execution starts in a separate `/start-work`
   session that the user launches.
