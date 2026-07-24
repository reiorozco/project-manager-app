# 007 — Migration off Supabase to Vercel-native stack

**Author:** Rei Orozco (via Prometheus planning session)
**Date:** 2026-07-24
**Status:** Approved plan, execution pending in separate worker session
**Target repo:** `/Users/reiorozco/Dev/project-manager-app`
**Deployed at:** https://project-manager-app-cyan.vercel.app (Vercel, auto-deploy on push to `main`)
**Branch strategy:** `migration/007-off-supabase` → PR → merge to `main`
**Related specs:** 005 (flagship redesign), 006 (major dep bumps to Prisma 7 / Zod 4 / lucide 1)
**Draft resume point:** `.omo/drafts/007-migration-off-supabase.md`
**Project convention copy:** `specs/007-migration-off-supabase.md` (executor copies verbatim in Fase 0 todo 1)

## Motivation

Free one Supabase free-tier slot (2 active projects max per account) to make room for
`matchday-dev`, without downgrading the portfolio deployment. Replace the three Supabase
services with Vercel-native equivalents that fit the same free-tier envelope:

| Concern         | Current                       | Target                                       |
|-----------------|-------------------------------|----------------------------------------------|
| Postgres        | Supabase (`hslsqmuhkctcjftwnive`) | Vercel Postgres (Neon-powered), 512 MB free |
| Auth            | Supabase Auth (email/password) | Better Auth (self-hosted), gratis, unlimited MAU |
| Storage         | Supabase Storage (`project-files`) | Vercel Blob, 1 GB + 5 GB bandwidth free    |

## Goals (this plan delivers all of these)

1. Neon Postgres holds all existing `User`, `Project`, `File` rows with parity to Supabase.
2. Better Auth handles login / register / logout / session for all three roles
   (`CLIENT`, `PROJECT_MANAGER`, `DESIGNER`) with the seeded demo accounts working.
3. Vercel Blob holds every historical file previously stored in Supabase Storage,
   accessible only through an authenticated route (private).
4. `project-manager-app-cyan.vercel.app` is running entirely on the new stack, verified
   end-to-end with each demo role.
5. The Supabase project `hslsqmuhkctcjftwnive` is deleted and the Supabase MCP entry is
   removed, freeing the free-tier slot.

## Non-goals / Must-NOT-Have

The executor MUST NOT do any of the following, even if it seems useful:

1. Do NOT touch authorization logic in `lib/services/project-service.ts` (roles are
   already enforced application-level; migration keeps this untouched).
2. Do NOT enable Neon preview branching (out of scope for this portfolio deploy).
3. Do NOT import Supabase bcrypt password hashes into Better Auth. The 3 demo users are
   re-created from scratch with Better Auth's default scrypt hashing.
4. Do NOT add an email-sending provider (Resend / SendGrid / etc.). Email verification is
   disabled in Better Auth (`requireEmailVerification: false`); demos are seeded
   pre-verified.
5. Do NOT switch the Prisma driver adapter from `@prisma/adapter-pg` to
   `@prisma/adapter-neon`. Keep current adapter, reversible optimization for later.
6. Do NOT enable Better Auth's `admin` plugin. Roles are modeled with
   `additionalFields.role` only.
7. Do NOT rename or restructure existing tables (`User`, `Project`, `File`). Better Auth
   is configured to coexist with the current PascalCase table naming convention.
8. Do NOT enable Row-Level Security in Neon. Authorization stays application-level.
9. Do NOT change demo user emails. Passwords stay `demo1234` unless a security policy
   in Better Auth blocks that literal string (in which case, update README in the same
   commit).
10. Do NOT add auto-generated signatures to commits, docs, or PR descriptions
    (`Co-Authored-By: Claude`, "Generated with", emoji sign-offs, etc.).
11. Do NOT delete the Supabase project until every previous fase is verified in
    production. The delete happens only as the last todo of Fase 5.
12. Do NOT create any UI to manage roles or users. Role changes stay a DB-side operation.
13. Do NOT skip a phase gate. After every fase's last implementation todo, the executor
    STOPS, prints a summary + evidence paths, and waits for explicit user "OK" before
    starting the next fase.
14. Do NOT commit `.env.local` or `.env.local.supabase-backup` at any point.
15. Do NOT write Spanish anywhere in the codebase, commit messages, PR body, tests,
    branches, or documentation. Chat is Spanish; artifacts are English.

## Skills the executor loads for `/start-work`

Per user's tooling brief, the following skills are installed in Fase 0 and used throughout:

- `shadcn` (shadcn official) — component conventions for any UI touch-ups.
- `best-practices` + `emailAndPassword` (better-auth official) — Better Auth patterns.
- `prisma-database-setup` + `prisma-client-api` (prisma official) — schema + client.
- `next-best-practices` (vercel-labs) — Next.js 16 App Router patterns.

For every ambiguity, complement with Context7 lookups (Vercel Postgres, Vercel Blob,
Better Auth) and `librarian` subagent for external docs.

## Approach — six phases, hard gates

Every fase produces exactly ONE commit on `migration/007-off-supabase`, an explicit
summary printed to the user, and then STOPS awaiting user "OK". No auto-continuation.
Fase 5 is irreversible; do NOT enter it without explicit approval AFTER Fase 4 verification.

- **Fase 0** — Tooling: `.mcp.json`, Neon provisioning, Blob provisioning, deps,
  env vars, skills. No production code changes.
- **Fase 1** — DB: `prisma db push` to Neon, `pg_dump` + `psql` restore, row-count parity.
- **Fase 2** — Auth: extend schema, replace `lib/supabase/*` with Better Auth, seed demos.
- **Fase 3** — Storage: rewrite upload/download/delete against Vercel Blob, backfill script.
- **Fase 4** — Production cutover: swap Vercel prod env vars, deploy, verify.
- **Fase 5** — Teardown: uninstall Supabase deps, delete project, remove MCP, docs.

## Environment variables — before / during / after

### Before migration (currently in `.env.local` and Vercel envs)

```
DATABASE_URL              = postgres://postgres.hslsqmuhkctcjftwnive:...@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL                = postgres://postgres.hslsqmuhkctcjftwnive:...@aws-1-us-east-2.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL  = https://hslsqmuhkctcjftwnive.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
VERCEL_OIDC_TOKEN         = (Vercel-managed, ignore)
```

### After migration (final state)

```
DATABASE_URL              = postgres://<user>:<pass>@ep-<...>.us-east-1.aws.neon.tech/neondb?sslmode=require   # pooled
DIRECT_URL                = postgres://<user>:<pass>@ep-<...>.us-east-1.aws.neon.tech/neondb?sslmode=require   # direct
BLOB_READ_WRITE_TOKEN     = vercel_blob_rw_<store-id>_<secret>
BETTER_AUTH_SECRET        = <openssl rand -base64 32 output>
BETTER_AUTH_URL           = https://project-manager-app-cyan.vercel.app  # prod / preview override
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used ONLY during
Fase 3's backfill script, then removed in Fase 5.

## Files that will change (map)

**Created:**
- `.mcp.json` (Fase 0, deleted in Fase 5)
- `specs/007-migration-off-supabase.md` (Fase 0 todo 1 — verbatim copy of this plan file so the project's `specs/` convention is preserved)
- `lib/auth.ts` (Fase 2)
- `lib/auth-client.ts` (Fase 2)
- `app/api/auth/[...all]/route.ts` (Fase 2)
- `app/api/upload/route.ts` (Fase 3)
- `app/api/files/[...path]/route.ts` (Fase 3)
- `scripts/seed-demo-users.ts` (Fase 2)
- `scripts/backfill-storage.ts` (Fase 3)
- `.env.local.supabase-backup` (Fase 0, deleted in Fase 5, never committed)

**Modified:**
- `prisma/schema.prisma` (Fase 2 — add Session/Account/Verification + user fields)
- `middleware.ts` (Fase 2)
- `app/auth/auth-context.tsx` (Fase 2)
- `app/auth/login/page.tsx` (Fase 2)
- `app/auth/register/page.tsx` (Fase 2)
- `app/page.tsx` (Fase 2)
- `app/api/projects/route.ts` (Fase 2)
- `app/api/projects/[id]/route.ts` (Fase 2)
- `app/api/projects/[id]/status/route.ts` (Fase 2)
- `app/api/projects/[id]/files/route.ts` (Fase 2)
- `app/api/projects/[id]/files/[fileId]/route.ts` (Fase 2)
- `app/api/users/designers/route.ts` (Fase 2)
- `app/components/Navbar.tsx` (Fase 2)
- `app/projects/_hooks/useProjectDetails.ts` (Fase 3)
- `app/projects/_hooks/useProjectSubmission.ts` (Fase 3)
- `lib/services/fileUploadService.ts` (Fase 3)
- `lib/services/project-service.ts` (Fase 3 — only storage-call replacements)
- `next.config.ts` (Fase 3 — add `images.remotePatterns` for Blob)
- `.env.example` (Fase 0 add new vars; Fase 5 remove Supabase vars)
- `package.json` (Fase 0 install; Fase 5 uninstall)
- `README.md` (Fase 5 — swap Supabase for Vercel Blob/Postgres/Better Auth mentions)
- `PRODUCT.md` (Fase 5 — same)

**Deleted:**
- `lib/supabase/client.ts` (Fase 2)
- `lib/supabase/server.ts` (Fase 2)
- `lib/supabase/middleware.ts` (Fase 2)
- `app/auth/register/confirm/page.tsx` (Fase 2)
- `app/auth/confirm/route.ts` (Fase 2)
- `app/auth/callback/route.ts` (Fase 2)

## Todos

### Fase 0 — Setup and tooling

- [x] 1. `specs/007-migration-off-supabase.md`: Copy this plan file verbatim from `.omo/plans/007-migration-off-supabase.md` so the project's `specs/` convention is preserved and the plan is discoverable at the expected path - expect `diff .omo/plans/007-migration-off-supabase.md specs/007-migration-off-supabase.md` shows zero difference.
  - Files: `specs/007-migration-off-supabase.md` (new, verbatim copy)
  - Acceptance: The two files are byte-identical (`sha256sum` matches).
  - QA: `sha256sum .omo/plans/007-migration-off-supabase.md specs/007-migration-off-supabase.md | awk '{print $1}' | uniq | wc -l` returns `1`.
  - Commit strategy: Group with Fase 0 commit.

- [x] 2. `.mcp.json`: Create at repo root with Supabase MCP entry scoped read-only to project `hslsqmuhkctcjftwnive`, features `database,docs` - expect file exists and is valid JSON.
  - Files: `.mcp.json` (new)
  - Content: `{ "mcpServers": { "supabase": { "type": "http", "url": "https://mcp.supabase.com/mcp?project_ref=hslsqmuhkctcjftwnive&read_only=true&features=database,docs" } } }`
  - Acceptance: File parses as JSON (`node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8'))"` exits 0); project_ref matches the current Supabase ref extracted from `.env.local`.
  - QA: `cat .mcp.json | jq .mcpServers.supabase.url` returns the exact URL with `read_only=true` present.
  - Commit strategy: Group with Fase 0 commit.

- [x] 3. `git`: Create and check out the migration branch `migration/007-off-supabase` from a clean `main` - expect branch exists locally.
  - Files: none
  - Acceptance: `git branch --show-current` returns `migration/007-off-supabase`; `git status` shows working tree matches origin/main plus known untracked (`.omo/`, `specs/`, the new plan file).
  - QA: `git rev-parse --abbrev-ref HEAD` returns `migration/007-off-supabase`; `git log --oneline main..HEAD` is empty.
  - Commit strategy: n/a (branch creation only).

- [x] 4. Install `autoskills.sh` skills: shadcn (shadcn), best-practices + emailAndPassword (better-auth), prisma-database-setup + prisma-client-api (prisma), next-best-practices (vercel-labs) - expect all 6 skills invocable via `skill(name=...)` from the executor session.
  - Files: none in repo (skills install to global agent config).
  - Acceptance: Each skill responds to a probe `skill(name="<slug>")` without "not found" error.
  - QA: For each skill, run `skill(name="best-practices")` etc. and confirm the loaded content mentions the expected topic keywords (Better Auth, Prisma, shadcn, Next.js).
  - Commit strategy: n/a (no repo change).

- [x] 5. `.env.local`: Back up the current file to `.env.local.supabase-backup` so Supabase connection strings and anon key stay available for Fase 3 backfill and any rollback - expect backup file exists and contents match.
  - Files: `.env.local.supabase-backup` (new, gitignored)
  - Acceptance: `diff .env.local .env.local.supabase-backup` shows zero lines difference.
  - QA: `test -f .env.local.supabase-backup && diff -q .env.local .env.local.supabase-backup` prints "identical" or exits 0 with empty output.
  - Commit strategy: Never committed; add to `.gitignore` if not already covered (existing `.gitignore` already excludes `.env.local*`).

- [x] 6. Vercel Dashboard → Storage → Marketplace → Neon: Provision a new Neon database named `project-manager-db`, region `us-east-1`, free tier, connect it to the `project-manager-app` Vercel project but ONLY for the Development environment (do NOT connect to Preview or Production yet) - expect Neon database visible in Vercel Storage tab and Development env has new POSTGRES/DATABASE vars.
  - Files: none in repo.
  - Acceptance: `vercel storage ls` (or dashboard screenshot) lists the new Neon DB with a single Development link.
  - QA: `vercel env ls development` shows entries for `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (or `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`) with values that host-match `*.neon.tech`.
  - Commit strategy: n/a (external provisioning).

- [x] 7. Vercel Dashboard → Storage → Blob: Create a Blob store named `project-files-blob`, region `iad1`, access `private`, connect it to `project-manager-app` Vercel project for Development only - expect store visible and `BLOB_READ_WRITE_TOKEN` in Development env vars.
  - Files: none in repo.
  - Acceptance: `vercel storage ls` (or dashboard) shows the Blob store with a single Development link.
  - QA: `vercel env ls development` includes `BLOB_READ_WRITE_TOKEN`.
  - Commit strategy: n/a.

- [x] 8. `.env.local`: Overwrite `DATABASE_URL` and `DIRECT_URL` with the new Neon pooled and unpooled connection strings respectively; add `BLOB_READ_WRITE_TOKEN` from the Blob store; keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` unchanged (needed by Fase 3 backfill) - expect `psql "$DIRECT_URL" -c "SELECT 1"` returns 1.
  - Files: `.env.local` (modified, gitignored)
  - Acceptance: The four vars `DATABASE_URL`, `DIRECT_URL`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL` are all present with non-empty values; `DATABASE_URL` and `DIRECT_URL` host-match `*.neon.tech`; the Supabase URL still matches the current one.
  - QA: `set -a; source .env.local; set +a; psql "$DIRECT_URL" -c "SELECT current_database(), current_user"` returns `neondb` (or similar) as database name.
  - Commit strategy: n/a (never committed).

- [x] 9. Generate `BETTER_AUTH_SECRET`: `openssl rand -base64 32` and add to `.env.local` as `BETTER_AUTH_SECRET=<value>`; also add `BETTER_AUTH_URL=http://localhost:3000` - expect both vars present in `.env.local`.
  - Files: `.env.local` (modified)
  - Acceptance: `grep -c '^BETTER_AUTH_SECRET=' .env.local` returns 1; `grep -c '^BETTER_AUTH_URL=' .env.local` returns 1; the secret has length >= 32 chars.
  - QA: `set -a; source .env.local; set +a; [ ${#BETTER_AUTH_SECRET} -ge 32 ] && echo OK` prints `OK`.
  - Commit strategy: n/a.

- [x] 10. `npm install better-auth @vercel/blob@^2.3.0` (runtime deps) - expect both entries in `package.json` under `dependencies` and `node_modules` populated.
  - Files: `package.json`, `package-lock.json` (modified)
  - Acceptance: `jq -r '.dependencies["better-auth"]' package.json` and `jq -r '.dependencies["@vercel/blob"]' package.json` both return non-null version strings.
  - QA: `node -e "require('better-auth'); require('@vercel/blob')"` exits 0.
  - Commit strategy: Group with Fase 0 commit.

- [x] 11. `npm install --save-dev @better-auth/cli` - expect Better Auth CLI available.
  - Files: `package.json`, `package-lock.json` (modified)
  - Acceptance: `jq -r '.devDependencies["@better-auth/cli"]' package.json` returns non-null.
  - QA: `npx @better-auth/cli@latest --help` exits 0 and prints subcommand list.
  - Commit strategy: Group with Fase 0 commit.

- [x] 12. `.env.example`: Add new vars with descriptive comments (do NOT include actual secret values) — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BLOB_READ_WRITE_TOKEN` — while keeping existing `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` for now (Supabase vars removed in Fase 5) - expect example file lists all 7 vars.
  - Files: `.env.example` (modified)
  - Acceptance: `grep -c '^' .env.example` returns >= 15 (var lines + comments); every new var has a `# comment` line above explaining purpose.
  - QA: `grep -E '^(DATABASE_URL|DIRECT_URL|BLOB_READ_WRITE_TOKEN|BETTER_AUTH_SECRET|BETTER_AUTH_URL|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)=' .env.example | wc -l` returns 7.
  - Commit strategy: Group with Fase 0 commit.

- [x] 13. Commit Fase 0: `git add .mcp.json .env.example package.json package-lock.json specs/007-migration-off-supabase.md .omo/plans/007-migration-off-supabase.md .omo/drafts/007-migration-off-supabase.md && git commit -m "chore(fase-0/5): setup Neon + Blob + Better Auth deps + MCP + plan"` - expect one commit on `migration/007-off-supabase`.
  - Files: staged and committed.
  - Acceptance: `git log --oneline -1` matches `chore(fase-0/5): setup Neon + Blob + Better Auth deps + MCP + plan`; `git status` shows clean tree (aside from `.env.local` and backups which are gitignored).
  - QA: `git show --stat HEAD` lists at least: `.mcp.json`, `.env.example`, `package.json`, `package-lock.json`, `specs/007-migration-off-supabase.md`, `.omo/plans/007-migration-off-supabase.md`.
  - Commit strategy: This is the Fase 0 commit.

- [x] 14. GATE — Fase 0 complete. Print summary listing: (a) branch created, (b) plan copied to `specs/`, (c) skills installed, (d) Neon DB provisioned + connected to Dev, (e) Blob store provisioned + connected to Dev, (f) all 5 new env vars in `.env.local`, (g) commit SHA. Then PAUSE. Do NOT begin Fase 1 without explicit user "OK" reply.

### Fase 1 — Database migration (Supabase Postgres → Neon)

- [x] 15. `prisma db push --skip-generate`: Push the existing `prisma/schema.prisma` to the empty Neon database using `DIRECT_URL` - expect Neon has tables `User`, `Project`, `File` and enums `UserRole`, `ProjectStatus`.
  - Files: none modified.
  - Acceptance: `psql "$DIRECT_URL" -c "\dt"` shows exactly `User`, `Project`, `File` in schema `public`; `psql "$DIRECT_URL" -c "\dT"` shows both enums.
  - QA: `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"User\""` returns `0` (empty).
  - Commit strategy: No file change; grouped with Fase 1 commit.

- [x] 16. Dump data-only from Supabase using the backed-up direct URL: `SUPABASE_DIRECT_URL=$(grep '^DIRECT_URL=' .env.local.supabase-backup | cut -d= -f2- | tr -d '"') pg_dump "$SUPABASE_DIRECT_URL" --data-only --no-owner --no-privileges --exclude-schema=auth --exclude-schema=storage --exclude-schema=supabase_migrations --exclude-schema=extensions --exclude-schema=graphql --exclude-schema=graphql_public --exclude-schema=pgsodium --exclude-schema=pgsodium_masks --exclude-schema=realtime --exclude-schema=vault --exclude-schema=_analytics --exclude-schema=_realtime -f /tmp/supabase-data-dump.sql` - expect file exists with `COPY` statements for `public.User`, `public.Project`, `public.File`.
  - Files: `/tmp/supabase-data-dump.sql` (transient).
  - Acceptance: File size > 0; `grep -c '^COPY public\."\(User\|Project\|File\)"' /tmp/supabase-data-dump.sql` returns 3.
  - QA: `wc -l /tmp/supabase-data-dump.sql` returns > 20; `head -50 /tmp/supabase-data-dump.sql | grep -c '^COPY public\.'` returns >= 1.
  - Commit strategy: Dump file is transient, never committed.

- [x] 17. Restore data-only dump into Neon: `psql "$DIRECT_URL" --set ON_ERROR_STOP=1 --single-transaction -f /tmp/supabase-data-dump.sql` - expect command exits 0 with no ERROR lines in stderr.
  - Files: none modified.
  - Acceptance: Command exits 0; `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"User\""` returns > 0.
  - QA: Redirect stderr: `psql ... 2> /tmp/restore-stderr.log; grep -c ERROR /tmp/restore-stderr.log` returns 0.
  - Commit strategy: No file change.

- [x] 18. Row-count parity check per table: For each of `User`, `Project`, `File`, run `SELECT COUNT(*)` against both Supabase (`$SUPABASE_DIRECT_URL`) and Neon (`$DIRECT_URL`); write results to `/tmp/row-count-parity.txt` - expect counts match exactly for all three tables.
  - Files: `/tmp/row-count-parity.txt` (transient).
  - Acceptance: For each table row in the file, the Supabase count equals the Neon count. Any mismatch is a hard fail — investigate before proceeding.
  - QA: Write and run a small bash script that iterates the three tables, queries both DBs, and echoes `TABLE=X SUPABASE=Y NEON=Z MATCH=(yes/no)` per line. Assert every line ends in `MATCH=yes`.
  - Commit strategy: Parity file is transient.

- [x] 19. Sequence sanity: Prisma schema uses `cuid()` (no auto-increment sequences), so `information_schema.sequences` on Neon should be empty in `public` - expect zero user-owned sequences.
  - Files: none.
  - Acceptance: `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public'"` returns `0`.
  - QA: Same as acceptance.
  - Commit strategy: No file change.

- [x] 20. Local dev smoke test against Neon: `npm run dev`, navigate to `http://localhost:3000` unauthenticated, verify redirect to `/auth/login` (Supabase auth still active in this fase; only the DB backend changed) - expect page loads with no `P1001` Prisma connection error and login form renders.
  - Files: none modified.
  - Acceptance: Dev server output shows compilation succeeds; browser DevTools console shows zero errors; login form renders.
  - QA: `curl -sI http://localhost:3000` returns 200 or 307; `curl -sL http://localhost:3000 | grep -i "sign in\|log in\|login"` returns >= 1 match.
  - Commit strategy: No file change.

- [x] 21. Commit Fase 1: `git commit --allow-empty -m "feat(fase-1/5): migrate Postgres data from Supabase to Vercel Postgres (Neon)"` - expect one commit summarizing the DB migration (allow-empty because no files changed, the artifact IS the working Neon DB).
  - Files: none staged. Empty commit is intentional to mark the fase in git history.
  - Acceptance: `git log --oneline -1` matches the message; `git show --stat HEAD` shows no file diffs.
  - QA: `git log --grep='fase-1/5' --oneline | wc -l` returns 1.
  - Commit strategy: This is the Fase 1 commit.

- [x] 22. GATE — Fase 1 complete. Print summary: (a) Neon table list, (b) row counts for User/Project/File matching Supabase, (c) local dev server hits Neon successfully, (d) commit SHA. Then PAUSE. Do NOT begin Fase 2 without explicit user "OK" reply.

### Fase 2 — Auth migration (Supabase Auth → Better Auth)

- [x] 23. `prisma/schema.prisma`: Extend `User` model with Better Auth-required fields (`emailVerified Boolean @default(false)`, `image String?`) and add three new models `Session`, `Account`, `Verification` following Better Auth's Prisma adapter shape. Use PascalCase `@@map` on all four Better Auth models to match existing convention (`@@map("User")`, `@@map("Session")`, `@@map("Account")`, `@@map("Verification")`). Preserve existing `role: UserRole` field on `User` - expect `npx prisma format && npx prisma validate` both succeed.
  - Files: `prisma/schema.prisma` (modified)
  - Schema additions (hand-written per Better Auth docs — do NOT rely on CLI `generate` overwriting the existing User model):
    ```prisma
    model User {
      id               String   @id @default(cuid())
      email            String   @unique
      name             String?
      role             UserRole @default(CLIENT)
      emailVerified    Boolean  @default(false)
      image            String?
      createdAt        DateTime @default(now())
      updatedAt        DateTime @updatedAt
      // existing relations preserved
      createdProjects  Project[] @relation("CreatedBy")
      assignedProjects Project[] @relation("AssignedTo")
      // new Better Auth relations
      sessions         Session[]
      accounts         Account[]
      @@map("User")
    }

    model Session {
      id        String   @id @default(cuid())
      expiresAt DateTime
      token     String   @unique
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
      ipAddress String?
      userAgent String?
      userId    String
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      @@index([userId])
      @@map("Session")
    }

    model Account {
      id                    String    @id @default(cuid())
      accountId             String
      providerId            String
      userId                String
      user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
      accessToken           String?
      refreshToken          String?
      idToken               String?
      accessTokenExpiresAt  DateTime?
      refreshTokenExpiresAt DateTime?
      scope                 String?
      password              String?
      createdAt             DateTime  @default(now())
      updatedAt             DateTime  @updatedAt
      @@index([userId])
      @@map("Account")
    }

    model Verification {
      id         String   @id @default(cuid())
      identifier String
      value      String
      expiresAt  DateTime
      createdAt  DateTime @default(now())
      updatedAt  DateTime @updatedAt
      @@index([identifier])
      @@map("Verification")
    }
    ```
  - Acceptance: `npx prisma format` rewrites without diff surprises; `npx prisma validate` exits 0.
  - QA: `npx prisma validate 2>&1 | grep -c "The schema is valid"` returns 1.
  - Commit strategy: Group with Fase 2 commit.

- [x] 24. `prisma db push --skip-generate`: Sync the extended schema to Neon, creating `Session`, `Account`, `Verification` tables and adding `emailVerified`, `image` columns to `User` - expect Neon has 6 tables total.
  - Files: none.
  - Acceptance: `psql "$DIRECT_URL" -c "\dt"` shows `Account`, `File`, `Project`, `Session`, `User`, `Verification`; `psql "$DIRECT_URL" -c "\d \"User\"" | grep -c "emailVerified\|image"` returns 2.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit (schema file already staged from todo 23).

- [x] 25. `npx prisma generate`: Regenerate the Prisma client (output goes to `../generated/prisma` per `generator client` block) so TypeScript sees the new models - expect generated client contains `Session`, `Account`, `Verification` types.
  - Files: `generated/prisma/*` (regenerated, `.gitignore`d)
  - Acceptance: `test -d generated/prisma`; `grep -l "class Session" generated/prisma/index.d.ts` returns a match (or the equivalent for `prisma-client-js` v7 output).
  - QA: `node -e "const {PrismaClient}=require('./generated/prisma'); const p=new PrismaClient({adapter: new (require('@prisma/adapter-pg').PrismaPg)({connectionString: process.env.DATABASE_URL})}); p.session.findFirst().then(x=>console.log('ok', x)).catch(e=>{console.error(e); process.exit(1)})"` — after `set -a; source .env.local; set +a` — exits 0 with `ok null`.
  - Commit strategy: No file change committed (generated/ is gitignored).

- [x] 26. `lib/auth.ts`: Create Better Auth server singleton with `prismaAdapter(prisma, { provider: "postgresql" })`, `emailAndPassword` enabled with `requireEmailVerification: false`, `user.additionalFields.role` typed union of the three role strings with `input: false` and `defaultValue: "CLIENT"`, and `nextCookies()` plugin last - expect file compiles and exports `auth`.
  - Files: `lib/auth.ts` (new)
  - Content template:
    ```ts
    import { betterAuth } from "better-auth";
    import { prismaAdapter } from "better-auth/adapters/prisma";
    import { nextCookies } from "better-auth/next-js";
    import { prisma } from "@/lib/prisma";

    export const auth = betterAuth({
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
      },
      user: {
        additionalFields: {
          role: {
            type: ["CLIENT", "PROJECT_MANAGER", "DESIGNER"] as const,
            required: false,
            defaultValue: "CLIENT",
            input: false,
          },
        },
      },
      plugins: [nextCookies()],
    });
    ```
  - Acceptance: `npx tsc --noEmit` succeeds; file exists.
  - QA: `test -f lib/auth.ts && npx tsc --noEmit 2>&1 | tail -5` shows zero errors touching `lib/auth.ts`.
  - Commit strategy: Group with Fase 2 commit.

- [x] 27. `lib/auth-client.ts`: Create Better Auth React client via `createAuthClient` - expect file compiles and exports `authClient`.
  - Files: `lib/auth-client.ts` (new)
  - Content template:
    ```ts
    import { createAuthClient } from "better-auth/react";

    export const authClient = createAuthClient();

    export const { signIn, signUp, signOut, useSession } = authClient;
    ```
  - Acceptance: `npx tsc --noEmit` clean; file exists.
  - QA: `grep -c 'createAuthClient' lib/auth-client.ts` returns 1.
  - Commit strategy: Group with Fase 2 commit.

- [x] 28. `app/api/auth/[...all]/route.ts`: Create Next.js catch-all handler using `toNextJsHandler(auth)` - expect GET and POST exports.
  - Files: `app/api/auth/[...all]/route.ts` (new)
  - Content template:
    ```ts
    import { auth } from "@/lib/auth";
    import { toNextJsHandler } from "better-auth/next-js";

    export const { GET, POST } = toNextJsHandler(auth);
    ```
  - Acceptance: `npx tsc --noEmit` clean; hitting `curl -sI http://localhost:3000/api/auth/session` (after `npm run dev`) returns 200 or 401 (not 404).
  - QA: `npm run dev` in background; `curl -sI http://localhost:3000/api/auth/session | head -1` returns `HTTP/1.1 200 OK` (with empty session).
  - Commit strategy: Group with Fase 2 commit.

- [x] 29. `scripts/seed-demo-users.ts`: Create idempotent seed script that inserts the three demo users via Better Auth's server API (`auth.api.signUpEmail`), then updates each row via Prisma to set the correct `role` and `emailVerified: true` - expect script exists and is idempotent (running twice does not duplicate users).
  - Files: `scripts/seed-demo-users.ts` (new)
  - Behavior: For each of `{ email: "manager@demo.com", role: "PROJECT_MANAGER", name: "Manager Demo" }`, `{ email: "client@demo.com", role: "CLIENT", name: "Client Demo" }`, `{ email: "designer@demo.com", role: "DESIGNER", name: "Designer Demo" }`, password `"demo1234"`: check `prisma.user.findUnique({ where: { email } })`; if present, skip; else `await auth.api.signUpEmail({ body: { email, password, name } })`; then always `await prisma.user.update({ where: { email }, data: { role, emailVerified: true } })`.
  - Acceptance: `npx tsx scripts/seed-demo-users.ts` exits 0; running twice does not throw.
  - QA: After first run, `psql "$DIRECT_URL" -c "SELECT email, role, \"emailVerified\" FROM \"User\" WHERE email LIKE '%@demo.com' ORDER BY email"` returns 3 rows with the expected roles and `emailVerified = t`.
  - Commit strategy: Group with Fase 2 commit.

- [x] 30. Run the seed: `npx tsx scripts/seed-demo-users.ts` - expect 3 demo users present in Neon with correct roles and pre-verified.
  - Files: no repo change; DB rows added.
  - Acceptance: `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"User\" WHERE email LIKE '%@demo.com' AND \"emailVerified\" = TRUE"` returns 3.
  - QA: Same as acceptance; also `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"Account\" WHERE \"providerId\" = 'credential'"` returns >= 3 (Better Auth stores password in the `Account` table with `providerId = "credential"`).
  - Commit strategy: No file change.

- [x] 31. `middleware.ts`: Rewrite to use Better Auth. Replace `updateSession(request)` import with `auth.api.getSession({ headers: request.headers })`. Preserve current route-protection matrix minus the deleted routes: unauthenticated users redirected to `/auth/login` EXCEPT for `/api/projects/*`, `/api/users/designers`, `/auth/*`; authenticated users redirected away from `/auth/login`, `/auth/register` to `/`. Remove `/auth/confirm` and `/auth/register/confirm` from the auth-only matcher because those routes are deleted in todo 35. Add `runtime: "nodejs"` to the exported `config` to allow `auth.api.getSession` in middleware - expect `npx tsc --noEmit` clean.
  - Files: `middleware.ts` (modified)
  - Content sketch:
    ```ts
    import { type NextRequest, NextResponse } from "next/server";
    import { auth } from "@/lib/auth";

    const PUBLIC_API_PREFIXES = ["/api/projects", "/api/users/designers", "/api/auth"];
    const AUTH_PAGE_PREFIXES = ["/auth/login", "/auth/register"];

    export async function middleware(request: NextRequest) {
      const session = await auth.api.getSession({ headers: request.headers });
      const path = request.nextUrl.pathname;
      const isPublicApi = PUBLIC_API_PREFIXES.some(p => path.startsWith(p));
      const isAuthPage = AUTH_PAGE_PREFIXES.some(p => path.startsWith(p));

      if (!session && !isPublicApi && !path.startsWith("/auth")) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }
      if (session && isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    export const config = {
      runtime: "nodejs",
      matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      ],
    };
    ```
  - Acceptance: `npx tsc --noEmit` clean; middleware imports `auth` from `@/lib/auth` (no Supabase imports).
  - QA: `grep -c "supabase\|updateSession" middleware.ts` returns 0.
  - Commit strategy: Group with Fase 2 commit.

- [x] 32. `app/auth/auth-context.tsx`: Rewrite to use `authClient` from `@/lib/auth-client` instead of Supabase. Replace: `userQuery` uses `authClient.useSession()`; `userRoleQuery` reads `session.user.role` (from additionalFields) instead of querying Supabase PostgREST; `signIn` → `authClient.signIn.email`; `signUp` → `authClient.signUp.email`; `signOut` → `authClient.signOut`; REMOVE `resetPassword` and `updatePassword` mutations entirely (no email provider means no reset flow); remove `onAuthStateChange` listener (replaced by React Query invalidation on sign-in/out mutation success) - expect `npx tsc --noEmit` clean, `grep supabase app/auth/auth-context.tsx` returns 0.
  - Files: `app/auth/auth-context.tsx` (modified — major rewrite)
  - Acceptance: File no longer imports from `@supabase/*` or `@/lib/supabase/*`; all exported hook signatures the rest of the app depends on (`useAuth`, `signIn`, `signUp`, `signOut`) are preserved as callable async functions returning `{ error }` shape so caller sites in `login/page.tsx`, `register/page.tsx`, `Navbar.tsx` stay compilable.
  - QA: `grep -c "supabase\|@supabase" app/auth/auth-context.tsx` returns 0; `npx tsc --noEmit` clean.
  - Commit strategy: Group with Fase 2 commit.

- [x] 33. `app/auth/login/page.tsx`: Update to call the new `signIn` from `useAuth()` (backed by `authClient.signIn.email`). Preserve UI + error handling - expect page compiles and login works locally.
  - Files: `app/auth/login/page.tsx` (modified)
  - Acceptance: `npx tsc --noEmit` clean; a manual browser login with `manager@demo.com / demo1234` succeeds and lands on `/`.
  - QA: `grep -c "supabase" app/auth/login/page.tsx` returns 0.
  - Commit strategy: Group with Fase 2 commit.

- [x] 34. `app/auth/register/page.tsx`: Update `useAuth().signUp` call signature to match the new Better Auth shape (name, email, password — role is server-set via seed / additionalFields default, NOT client-passed). After successful signup, redirect to `/` instead of `/auth/register/confirm`. REMOVE the role selector UI (roles are not user-settable at signup; `input: false` on the additional field enforces this; new self-service signups default to `CLIENT`) - expect page compiles, signup works, no `/auth/register/confirm` navigation.
  - Files: `app/auth/register/page.tsx` (modified)
  - Acceptance: `npx tsc --noEmit` clean; `grep -c 'register/confirm' app/auth/register/page.tsx` returns 0; a manual signup with a fresh email succeeds and lands on `/`.
  - QA: `grep -c "supabase\|register/confirm" app/auth/register/page.tsx` returns 0.
  - Commit strategy: Group with Fase 2 commit.

- [x] 35. Delete `app/auth/register/confirm/page.tsx`, `app/auth/confirm/route.ts`, `app/auth/callback/route.ts` (all three Supabase-specific email OTP / callback routes replaced by Better Auth's `[...all]` handler) - expect files gone.
  - Files: three deletions.
  - Acceptance: `test ! -e app/auth/register/confirm/page.tsx && test ! -e app/auth/confirm/route.ts && test ! -e app/auth/callback/route.ts` exits 0.
  - QA: `find app/auth -name 'confirm*' -o -name 'callback*'` returns empty.
  - Commit strategy: Group with Fase 2 commit.

- [x] 36. Delete `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts` and remove the `lib/supabase/` directory - expect directory gone.
  - Files: three deletions + directory removal.
  - Acceptance: `test ! -d lib/supabase` exits 0; `grep -r "@/lib/supabase" app/ lib/ middleware.ts scripts/` returns 0 hits (any remaining hit is a bug — resolve before continuing).
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 37. `app/api/projects/route.ts`: Replace `const supabase = await createClient(request); const { data: { user } } = await supabase.auth.getUser()` with `const session = await auth.api.getSession({ headers: request.headers }); if (!session) return 401; const userId = session.user.id` in both GET and POST handlers. Preserve calls into `ProjectService.getProjectsByUserRole(userId)` and `createProject(...)`. Do NOT change response shapes - expect `npx tsc --noEmit` clean, no `supabase` imports.
  - Files: `app/api/projects/route.ts` (modified)
  - Acceptance: `grep -c "supabase\|@supabase" app/api/projects/route.ts` returns 0; `curl -sI -H "Cookie: better-auth.session_token=<valid>" http://localhost:3000/api/projects` returns 200 or JSON with expected shape.
  - QA: `grep -c "auth.api.getSession" app/api/projects/route.ts` returns >= 2 (GET + POST).
  - Commit strategy: Group with Fase 2 commit.

- [x] 38. `app/api/projects/[id]/route.ts`: Same replacement as todo 37 for GET, PUT, DELETE handlers. Preserve `ProjectService.getProjectById`, `updateProject`, `deleteProject` calls - expect zero Supabase imports.
  - Files: `app/api/projects/[id]/route.ts` (modified)
  - Acceptance: `grep -c "supabase" app/api/projects/[id]/route.ts` returns 0; `npx tsc --noEmit` clean.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 39. `app/api/projects/[id]/status/route.ts`: Same replacement for the PATCH handler. Preserve `ProjectService.updateProjectStatus(userId, projectId, status)` call - expect zero Supabase imports.
  - Files: `app/api/projects/[id]/status/route.ts` (modified)
  - Acceptance: `grep -c "supabase" app/api/projects/[id]/status/route.ts` returns 0.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 40. `app/api/projects/[id]/files/route.ts`: Same replacement for the POST handler. Preserve `ProjectService.addFilesToProject(userId, projectId, files)` call - expect zero Supabase imports.
  - Files: `app/api/projects/[id]/files/route.ts` (modified)
  - Acceptance: `grep -c "supabase" app/api/projects/[id]/files/route.ts` returns 0.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 41. `app/api/projects/[id]/files/[fileId]/route.ts`: Same replacement for the DELETE handler. Note: this handler previously passed a Supabase admin client into `ProjectService.removeFileFromProject`; that signature will be adjusted in Fase 3 (todo 52). For this fase, temporarily pass `null` where the client was expected and add a TODO comment — Fase 3 removes the parameter entirely - expect zero Supabase imports in the ROUTE file.
  - Files: `app/api/projects/[id]/files/[fileId]/route.ts` (modified)
  - Acceptance: `grep -c "supabase\|@supabase" app/api/projects/[id]/files/[fileId]/route.ts` returns 0; `npx tsc --noEmit` shows expected temporary looseness on `removeFileFromProject` signature (resolved in Fase 3).
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 42. `app/api/users/designers/route.ts`: Same session replacement for the GET handler. Preserve `UserRole.PROJECT_MANAGER` role check - expect zero Supabase imports.
  - Files: `app/api/users/designers/route.ts` (modified)
  - Acceptance: `grep -c "supabase" app/api/users/designers/route.ts` returns 0.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 43. `app/page.tsx`: Replace `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()` with `const session = await auth.api.getSession({ headers: await headers() })`. Extract role from `session.user.role` (typed additional field) instead of `user.user_metadata.role`. Preserve redirect-to-login behavior when session is null - expect page renders for each authenticated demo user with the correct role.
  - Files: `app/page.tsx` (modified)
  - Acceptance: `grep -c "supabase\|user_metadata" app/page.tsx` returns 0; `npx tsc --noEmit` clean.
  - QA: Manual: login as `manager@demo.com` → dashboard shows PROJECT_MANAGER view. Repeat for client and designer.
  - Commit strategy: Group with Fase 2 commit.

- [x] 44. `app/components/Navbar.tsx`: Ensure `handleSignOut` calls `signOut()` from `useAuth()` (which now wraps `authClient.signOut`). No other change if the current call already goes through `useAuth()` - expect sign-out click clears the session cookie and reloads to `/auth/login`.
  - Files: `app/components/Navbar.tsx` (modified if needed)
  - Acceptance: `grep -c "supabase" app/components/Navbar.tsx` returns 0; manual sign-out from the UI returns the user to `/auth/login`.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 45. Local end-to-end auth verification: With `npm run dev` running, sign in as each of `manager@demo.com`, `client@demo.com`, `designer@demo.com` with password `demo1234`, verify dashboard loads with correct role-based content, sign out. Verify browser DevTools console shows zero errors. Verify `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"Session\" WHERE \"expiresAt\" > NOW()"` reflects active sessions after each login - expect all three role sign-ins succeed, no console errors.
  - Files: none.
  - Acceptance: Three successful role logins recorded in `Session` table; sign-out deletes the corresponding session row (or expires it).
  - QA: `psql "$DIRECT_URL" -c "SELECT u.email, s.\"expiresAt\" > NOW() as active FROM \"Session\" s JOIN \"User\" u ON u.id = s.\"userId\" ORDER BY s.\"createdAt\" DESC LIMIT 10"` shows recent sessions for the three demo emails.
  - Commit strategy: No file change.

- [x] 46. Commit Fase 2: `git add prisma/ lib/ app/ middleware.ts scripts/seed-demo-users.ts .env.example && git commit -m "feat(fase-2/5): migrate Auth from Supabase to Better Auth + seed demo users"` - expect one commit.
  - Files: all Fase 2 changes staged.
  - Acceptance: `git log --oneline -1` matches the message; `git show --stat HEAD` lists all expected paths (new/modified/deleted).
  - QA: `git show HEAD --stat | grep -cE 'lib/auth\.ts|lib/auth-client\.ts|api/auth/\[\.\.\.all\]|scripts/seed-demo-users'` returns >= 3.
  - Commit strategy: This is the Fase 2 commit.

- [x] 47. GATE — Fase 2 complete. Print summary: (a) six tables in Neon, (b) three demo users seeded pre-verified, (c) all API routes and UI use Better Auth, (d) `lib/supabase/` deleted, (e) confirm/callback routes deleted, (f) commit SHA. Then PAUSE. Do NOT begin Fase 3 without explicit user "OK" reply.

### Fase 3 — Storage migration (Supabase Storage → Vercel Blob)

- [x] 48. `next.config.ts`: Add `images.remotePatterns` allowing `*.public.blob.vercel-storage.com` (defensive — even though the store is private, next/image can still be pointed at Blob URLs in the future without a config change) - expect config compiles.
  - Files: `next.config.ts` (modified)
  - Content:
    ```ts
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "*.public.blob.vercel-storage.com",
            pathname: "/**",
          },
        ],
      },
    };

    export default nextConfig;
    ```
  - Acceptance: `npx tsc --noEmit` clean.
  - QA: `grep -c "blob.vercel-storage.com" next.config.ts` returns 1.
  - Commit strategy: Group with Fase 3 commit.

- [x] 49. `app/api/upload/route.ts`: Create client-upload handler using `handleUpload` from `@vercel/blob/client`. Authenticate via `auth.api.getSession({ headers: request.headers })`; on unauthenticated requests, throw before token generation. `onBeforeGenerateToken` returns `{ allowedContentTypes: [...current app types], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: false, tokenPayload: JSON.stringify({ userId, projectId }) }`. `onUploadCompleted` does not touch the DB (the caller updates `File` rows explicitly after client-side `upload()` resolves) - expect endpoint returns tokens for authenticated users and 401 otherwise.
  - Files: `app/api/upload/route.ts` (new)
  - Acceptance: `npx tsc --noEmit` clean; unauthenticated POST returns 401; authenticated POST returns a JSON token payload.
  - QA: `curl -X POST http://localhost:3000/api/upload -d '{}'` returns 401; with a valid session cookie, returns 200 or 400 (missing body) — NOT 500.
  - Commit strategy: Group with Fase 3 commit.

- [x] 50. `app/api/files/[...path]/route.ts`: Create authenticated file-read endpoint. Authenticate via `auth.api.getSession`; extract the pathname from `params.path.join("/")`; look up the `File` row via Prisma using the path; verify `ProjectService.canViewProject(userId, file.projectId)`; if authorized, call `get(pathname, { access: 'private' })` from `@vercel/blob` and return the stream with correct `Content-Type` and `Content-Disposition` headers - expect authenticated authorized user can download; unauthorized returns 403.
  - Files: `app/api/files/[...path]/route.ts` (new)
  - Acceptance: `npx tsc --noEmit` clean; unauthenticated request returns 401; authenticated but unauthorized request returns 403; authorized request returns 200 with the file bytes.
  - QA: With `curl -sI` and valid session, request to a known File.path returns 200 with `Content-Type` matching the file MIME.
  - Commit strategy: Group with Fase 3 commit.

- [x] 51. `lib/services/fileUploadService.ts`: Rewrite the class. `uploadFile(file, userId, projectId, fileId)` now calls the client-side `upload()` from `@vercel/blob/client` with pathname `projects/${userId}/${fileId}-${sanitize(file.name)}`, `access: 'private'`, `handleUploadUrl: '/api/upload'`, `multipart: file.size > 5_000_000 ? true : false` (defensive), and returns `{ filename: file.name, path: <returned pathname>, size: file.size }`. `deleteFile(path)` calls `del(path)` from `@vercel/blob`. Remove the `constructor(supabase)` — no client injection needed anymore - expect `grep supabase lib/services/fileUploadService.ts` returns 0.
  - Files: `lib/services/fileUploadService.ts` (modified — major rewrite)
  - Acceptance: `grep -c "supabase\|@supabase" lib/services/fileUploadService.ts` returns 0; `npx tsc --noEmit` clean.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 3 commit.

- [x] 52. `lib/services/project-service.ts`: Replace the two `supabaseAdmin.storage.from('project-files').remove([path])` call sites in `deleteFilesFromStorage` and `removeFileFromProject` with `del(path)` from `@vercel/blob`. Remove the `supabaseAdmin: SupabaseClient` parameter from `removeFileFromProject` and `deleteProject` (adjust their callers in `app/api/projects/[id]/route.ts` and `app/api/projects/[id]/files/[fileId]/route.ts` to drop the now-removed argument) - expect `grep supabase lib/services/project-service.ts` returns 0.
  - Files: `lib/services/project-service.ts`, `app/api/projects/[id]/route.ts`, `app/api/projects/[id]/files/[fileId]/route.ts` (modified)
  - Acceptance: `grep -c "supabase\|@supabase" lib/services/project-service.ts` returns 0; `npx tsc --noEmit` clean (this also resolves the temporary `null` from todo 41).
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 3 commit.

- [x] 53. `app/projects/_hooks/useProjectDetails.ts`: Rewrite the `downloadFileMutation` to fetch `/api/files/${encodeURIComponent(file.path)}` (the new authenticated file endpoint), read the response as a blob, and trigger a browser download exactly like today. Remove the `supabase.storage.from(BUCKET_NAME).download(file.path)` call - expect `grep supabase app/projects/_hooks/useProjectDetails.ts` returns 0.
  - Files: `app/projects/_hooks/useProjectDetails.ts` (modified)
  - Acceptance: `grep -c "supabase" app/projects/_hooks/useProjectDetails.ts` returns 0; `npx tsc --noEmit` clean; manual download from a project detail page succeeds.
  - QA: In the browser, on a project detail page with at least one file, click download → file downloads with correct filename and content.
  - Commit strategy: Group with Fase 3 commit.

- [x] 54. `app/projects/_hooks/useProjectSubmission.ts`: Update the upload orchestration to pass the pre-generated `fileId` (a cuid, generated client-side via `crypto.randomUUID()` or a lightweight cuid lib — use `@paralleldrive/cuid2` if not already installed, otherwise inline uuid; note: the resulting `path` field stored in `File` becomes `projects/${userId}/${fileId}-${filename}`) into `FileUploadService.uploadFile`. After all uploads complete, POST the resulting `{ filename, path, size }` array to `/api/projects` or `/api/projects/[id]/files` as before - expect `grep supabase app/projects/_hooks/useProjectSubmission.ts` returns 0.
  - Files: `app/projects/_hooks/useProjectSubmission.ts` (modified). If a cuid lib is missing, add via `npm install @paralleldrive/cuid2` (small dep, well-supported) as a follow-up task — otherwise use `crypto.randomUUID()` (browser + Node 19+).
  - Acceptance: `grep -c "supabase" app/projects/_hooks/useProjectSubmission.ts` returns 0; upload flow works locally end-to-end (drag PDF into new project form → project created → file appears with a downloadable path).
  - QA: Same as acceptance; verify `psql "$DIRECT_URL" -c "SELECT path FROM \"File\" ORDER BY \"createdAt\" DESC LIMIT 1"` shows a path starting with `projects/`.
  - Commit strategy: Group with Fase 3 commit.

- [x] 55. `app/projects/_utils/types.ts`: Remove or rename `BUCKET_NAME` constant if still exported (it referenced Supabase). Update any consumer to remove the import. Keep `MAX_FILE_SIZE`, `MAX_FILES`, allowed extensions unchanged - expect `grep BUCKET_NAME app/ lib/ scripts/` returns 0.
  - Files: `app/projects/_utils/types.ts` (modified), plus any importer.
  - Acceptance: `grep -rc "BUCKET_NAME" app/ lib/ scripts/` returns 0.
  - QA: `npx tsc --noEmit` clean.
  - Commit strategy: Group with Fase 3 commit.

- [x] 56. `scripts/backfill-storage.ts`: Create idempotent backfill that iterates every `File` row in Neon. For each row: (a) if `head(file.path, { access: 'private' })` succeeds (blob already present), log SKIP; (b) else download bytes from Supabase Storage via `fetch("https://hslsqmuhkctcjftwnive.supabase.co/storage/v1/object/authenticated/project-files/" + file.path, { headers: { Authorization: "Bearer " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY } })` — if 404, log MISSING and continue; else (c) `put(file.path, buffer, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: mimeFromExt(file.filename) })`; (d) log OK. Write progress to `/tmp/backfill-log.txt`. Support `--dry-run` flag - expect script exists, dry-run reports counts.
  - Files: `scripts/backfill-storage.ts` (new)
  - Acceptance: `npx tsx scripts/backfill-storage.ts --dry-run` prints per-file status; `wc -l /tmp/backfill-log.txt` equals the count of `File` rows in Neon.
  - QA: `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"File\""` equals `grep -c '^' /tmp/backfill-log.txt`.
  - Commit strategy: Group with Fase 3 commit.

- [x] 57. Run backfill live: `npx tsx scripts/backfill-storage.ts` (without --dry-run). For each `File`, HEAD the resulting Blob URL to confirm presence - expect every file row has a corresponding Blob entry.
  - Files: no repo change; Blob store populated.
  - Acceptance: For every `File.path` in Neon, `head(path, { access: 'private' })` from a small verifier script returns metadata (not 404). Log a per-file pass/fail summary to `/tmp/backfill-verify.txt`.
  - QA: `grep -c "MISSING" /tmp/backfill-verify.txt` returns 0 (or, if any legitimately missing due to prior Supabase Storage issues, document exactly which files in the summary — do not silently ignore).
  - Commit strategy: No file change.

- [x] 58. Local end-to-end storage verification: With `npm run dev`, sign in as `manager@demo.com`, open an existing project with at least one file, click download → file downloads with correct bytes; upload a new PDF file (< 5 MB), verify it appears in the file list and downloads correctly; delete the new file, verify it disappears from UI AND `vercel blob list` (or Vercel Dashboard → Storage → blob) no longer shows it - expect full CRUD works.
  - Files: none.
  - Acceptance: All three operations (download existing, upload new, delete new) succeed with zero console errors.
  - QA: Manual verification per acceptance.
  - Commit strategy: No file change.

- [x] 59. Commit Fase 3: `git add . && git commit -m "feat(fase-3/5): migrate Storage from Supabase to Vercel Blob + backfill existing files"` - expect one commit.
  - Files: all Fase 3 changes staged.
  - Acceptance: `git log --oneline -1` matches; `git show --stat HEAD` lists new `app/api/upload/route.ts`, `app/api/files/[...path]/route.ts`, `scripts/backfill-storage.ts` and modifications.
  - QA: Same as acceptance.
  - Commit strategy: This is the Fase 3 commit.

- [x] 60. GATE — Fase 3 complete. Print summary: (a) upload works via new client-upload flow, (b) download works via new authenticated file endpoint, (c) delete works via `del()`, (d) backfill verified for every historical `File` row, (e) commit SHA. Then PAUSE. Do NOT begin Fase 4 without explicit user "OK" reply.

### Fase 4 — Production cutover and verification

- [x] 61. Vercel Dashboard → Environment Variables → Production: Add `DATABASE_URL` (Neon pooled), `DIRECT_URL` (Neon direct), `BLOB_READ_WRITE_TOKEN` (Blob store), `BETTER_AUTH_SECRET` (same value as local `.env.local`), `BETTER_AUTH_URL=https://project-manager-app-cyan.vercel.app` for the Production environment. Do NOT delete existing Supabase env vars yet — they stay as inert fallback until Fase 5 - expect `vercel env ls production` shows all 5 new vars.
  - Files: none in repo.
  - Acceptance: `vercel env ls production | grep -cE "^(DATABASE_URL|DIRECT_URL|BLOB_READ_WRITE_TOKEN|BETTER_AUTH_SECRET|BETTER_AUTH_URL)\b"` returns 5.
  - QA: Same as acceptance.
  - Commit strategy: n/a (external config).

- [x] 62. Same as todo 61 for the Preview environment (so preview deploys of the migration branch can be tested against the same stack) - expect `vercel env ls preview` shows the 5 new vars.
  - Files: none.
  - Acceptance: `vercel env ls preview | grep -cE "^(DATABASE_URL|DIRECT_URL|BLOB_READ_WRITE_TOKEN|BETTER_AUTH_SECRET|BETTER_AUTH_URL)\b"` returns 5.
  - QA: Same as acceptance.
  - Commit strategy: n/a.

- [x] 63. Also connect the existing Neon DB and Blob store to Preview and Production environments in Vercel Dashboard → Storage → each store → Connect → check Preview + Production - expect env vars auto-populated from the store link match those set manually in todos 61-62 (or Vercel merges without conflict).
  - Files: none.
  - Acceptance: `vercel env ls production` and `vercel env ls preview` show DB and Blob vars sourced from the store connection (integration-managed).
  - QA: Same as acceptance.
  - Commit strategy: n/a.

- [x] 64. Push migration branch: `git push -u origin migration/007-off-supabase` - expect branch visible on GitHub, Vercel Preview build starts automatically.
  - Files: none in repo (git push only).
  - Acceptance: `git branch -r | grep -c 'origin/migration/007-off-supabase'` returns 1; Vercel dashboard shows a new deployment building.
  - QA: Same as acceptance.
  - Commit strategy: n/a.

- [x] 65. Wait for Vercel Preview deploy to complete (status READY). Copy the preview URL - expect deploy status is READY and preview URL is reachable.
  - Files: none.
  - Acceptance: Vercel Dashboard → Deployments shows READY for the branch's latest deploy; `curl -sI <preview-url>` returns 200 or 307.
  - QA: Same as acceptance.
  - Commit strategy: n/a.

- [x] 66. Preview end-to-end verification: On the preview URL, sign in as each of `manager@demo.com`, `client@demo.com`, `designer@demo.com` (password `demo1234`). For each: dashboard loads with correct role-based content; create a project (if role allows); upload a small test PDF; download the PDF; delete the project. Verify browser DevTools console shows zero errors on all three sessions - expect all three role flows pass.
  - Files: none.
  - Acceptance: Three role verifications complete without error; screenshots or notes saved to `/tmp/preview-verify.md` documenting each.
  - QA: Same as acceptance; the summary file is agent-generated.
  - Commit strategy: n/a.

- [x] 67. Open PR: `gh pr create --base main --head migration/007-off-supabase --title "Migrate off Supabase to Vercel Postgres + Blob + Better Auth" --body "$(head -60 specs/007-migration-off-supabase.md)\n\nSee spec for full details. Fases 0-4 verified. Fase 5 (Supabase project deletion) is executed after merge."` (or equivalent via GitHub UI) - expect PR URL exists.
  - Files: none.
  - Acceptance: PR is open, targets `main`, links to the spec file.
  - QA: `gh pr view --json url` returns the PR URL.
  - Commit strategy: n/a.

- [~] 68. Merge PR: After the preview verification is green, use `gh pr merge --squash --delete-branch` (or GitHub UI). The merge triggers a Production deploy on Vercel - expect PR merged, main deploy building.
  - Files: none in local repo (remote change).
  - Acceptance: PR status is MERGED; Vercel dashboard shows a new Production deployment building.
  - QA: `gh pr view --json state` returns `MERGED`.
  - Commit strategy: n/a.

- [~] 69. Wait for Production deploy to complete (status READY). Verify https://project-manager-app-cyan.vercel.app is reachable - expect deploy is READY and URL returns 200 or 307.
  - Files: none.
  - Acceptance: `curl -sI https://project-manager-app-cyan.vercel.app` returns 200 or 307.
  - QA: Same as acceptance.
  - Commit strategy: n/a.

- [~] 70. Production end-to-end verification: same as todo 66 but on https://project-manager-app-cyan.vercel.app. For each of the three demo users: login, dashboard, create/read/delete a project, upload/download/delete a file, sign out. Zero console errors - expect all three role flows pass in production.
  - Files: none.
  - Acceptance: Screenshots or notes saved to `/tmp/prod-verify.md`.
  - QA: Same as acceptance.
  - Commit strategy: n/a.

- [~] 71. GATE — Fase 4 complete. Print summary: (a) preview verified, (b) PR merged, (c) production deploy READY, (d) production verified for all 3 demo roles, (e) merge SHA. Then PAUSE. Do NOT begin Fase 5 (IRREVERSIBLE Supabase deletion) without explicit user "OK" reply.

### Fase 5 — Teardown (irreversible; only after Fase 4 confirmed OK)

- [~] 72. Vercel Dashboard → Environment Variables → Production, Preview, Development: Remove `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from ALL three environments. Also remove any stale `DATABASE_URL` or `DIRECT_URL` entries that still point to Supabase (should be none after todos 61-63, but double-check) - expect `vercel env ls production | grep -i supabase` returns 0 and no Supabase host in DB URLs.
  - Files: none.
  - Acceptance: `for e in production preview development; do vercel env ls $e | grep -ic supabase; done` all return 0.
  - QA: Same as acceptance.
  - Commit strategy: n/a.

- [~] 73. `npm uninstall @supabase/ssr @supabase/supabase-js` - expect both entries removed from `package.json`.
  - Files: `package.json`, `package-lock.json` (modified)
  - Acceptance: `jq -r '.dependencies["@supabase/ssr"]' package.json` returns `null`; same for `@supabase/supabase-js`.
  - QA: `grep -c "@supabase" package.json` returns 0.
  - Commit strategy: Group with Fase 5 commit.

- [~] 74. Delete `.mcp.json` and `.env.local.supabase-backup` - expect files gone.
  - Files: two deletions (the second is not committed, but should be cleaned up).
  - Acceptance: `test ! -e .mcp.json && test ! -e .env.local.supabase-backup` exits 0.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 5 commit (only `.mcp.json` is tracked).

- [~] 75. `.env.example`: Remove `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` lines (and any related comments); keep `DATABASE_URL`, `DIRECT_URL`, `BLOB_READ_WRITE_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` - expect final example has 5 vars.
  - Files: `.env.example` (modified)
  - Acceptance: `grep -c "SUPABASE" .env.example` returns 0; `grep -cE '^[A-Z_]+=' .env.example` returns 5.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 5 commit.

- [~] 76. `README.md`: Update tech stack section — remove any "Supabase" mentions, replace with "Vercel Postgres (Neon)", "Vercel Blob", "Better Auth". Update "Setup" section: remove the Supabase bucket creation step; add steps to link Vercel Postgres + Blob and pull env vars. Confirm demo credentials table is still accurate (`manager@demo.com` / `client@demo.com` / `designer@demo.com` with `demo1234`). If the seed script had to change the password for any reason, update the table in the SAME commit - expect `grep -ic supabase README.md` returns 0.
  - Files: `README.md` (modified)
  - Acceptance: `grep -c -i "supabase" README.md` returns 0; demo credentials table unchanged unless the seed changed passwords.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 5 commit.

- [~] 77. `PRODUCT.md`: Remove "Supabase" from the product purpose paragraph. Update any references so the stack narrative reads "Next.js + Prisma + Vercel Postgres + Better Auth + Vercel Blob" - expect `grep -ic supabase PRODUCT.md` returns 0.
  - Files: `PRODUCT.md` (modified)
  - Acceptance: `grep -c -i "supabase" PRODUCT.md` returns 0.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 5 commit.

- [~] 78. Commit Fase 5 cleanup: `git add . && git commit -m "chore(fase-5/5): remove Supabase code, deps, docs, and MCP entry"` and push to `main` - expect one commit on main.
  - Files: all Fase 5 changes staged and committed.
  - Acceptance: `git log --oneline -1` on `main` matches; `git push origin main` succeeds; Vercel triggers a final production deploy which must succeed (no runtime references to Supabase).
  - QA: After the deploy is READY, `curl -sI https://project-manager-app-cyan.vercel.app` returns 200 or 307; login still works for all three demos.
  - Commit strategy: This is the Fase 5 commit.

- [~] 79. Supabase Dashboard → Project `hslsqmuhkctcjftwnive` → Settings → General → Danger Zone → Delete Project. IRREVERSIBLE. Enter the project name to confirm. Wait for confirmation email if applicable - expect project no longer listed in Supabase account.
  - Files: none.
  - Acceptance: Supabase Dashboard shows the project as deleted or absent; the account's active-project count is now < 2 (slot free for matchday-dev).
  - QA: Visiting `https://hslsqmuhkctcjftwnive.supabase.co` returns a Supabase "project not found" or generic 404 page.
  - Commit strategy: n/a.

- [~] 80. Verify Supabase MCP entry no longer resolves anywhere (already deleted in todo 74 as `.mcp.json`). Confirm the agent's tool list in a fresh session does not include a `supabase` MCP server - expect no `mcp_supabase_*` tools available in the executor's environment.
  - Files: none.
  - Acceptance: Restart / re-list the agent's tools; no Supabase MCP tool appears.
  - QA: n/a (agent-runtime observation).
  - Commit strategy: n/a.

- [~] 81. GATE — Fase 5 complete. Print final summary: (a) Supabase deleted (slot free), (b) all deps and code removed, (c) MCP removed, (d) docs updated, (e) production still green. Then run the FINAL VERIFICATION WAVE (below).

## Final verification wave

Run this wave AFTER todo 81. Every check below must pass; any failure blocks the migration
from being declared complete and requires targeted remediation before closing.

- [~] F1. Zero Supabase references remain in the codebase: `grep -ri "supabase" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" --include="*.json" --include="*.md" app/ lib/ scripts/ middleware.ts prisma/ next.config.ts package.json README.md PRODUCT.md .env.example 2>/dev/null` returns 0 hits. Any lingering hit is a bug — trace and remove.
- [x] F2. Neon has the expected six tables: `psql "$DIRECT_URL" -c "\dt public.*"` shows exactly `User`, `Project`, `File`, `Session`, `Account`, `Verification`.
- [x] F3. Demo users are seeded pre-verified: `psql "$DIRECT_URL" -c "SELECT email, role, \"emailVerified\" FROM \"User\" WHERE email LIKE '%@demo.com' ORDER BY email"` returns exactly 3 rows, all `emailVerified = t`, roles `PROJECT_MANAGER` / `CLIENT` / `DESIGNER`.
- [x] F4. Prisma schema validates cleanly: `npx prisma validate` prints "The schema is valid" and exits 0.
- [x] F5. TypeScript is clean: `npx tsc --noEmit` exits 0.
- [x] F6. Production build succeeds locally: `npm run build` exits 0.
- [~] F7. Vercel Blob store has at least as many blobs as File rows: `vercel blob list <store-name> --json | jq 'length'` returns >= `psql "$DIRECT_URL" -c "SELECT COUNT(*) FROM \"File\""`.
- [~] F8. Production login works for all three demo users on https://project-manager-app-cyan.vercel.app — each shows the correct role-based dashboard, zero DevTools console errors.
- [~] F9. Production upload + download + delete round-trip works: upload a test PDF, verify appears in project detail, download and verify byte identity, delete and verify gone from both UI and Blob store.
- [~] F10. Supabase account has 1 active project (the other one). The matchday-dev slot is free.
- [~] F11. Git history shows 6 commits on the migration path with the expected prefixes: `git log --oneline main | head -8 | grep -cE 'fase-(0|1|2|3|4|5)/5'` returns 6 (or 5 if Fase 4's merge was squashed — accept squash as one commit covering fases 1-4).

## Rollback playbook

Rollback effort escalates by fase. Do NOT proceed to Fase 5 without full confidence.

**Rollback from Fase 0:** `git checkout main`, `rm .mcp.json`, `npm uninstall better-auth @vercel/blob @better-auth/cli`, restore `.env.local` from `.env.local.supabase-backup`. Neon DB and Blob store can stay (empty, free).

**Rollback from Fase 1:** Same as Fase 0. Additionally, Neon DB deletion via Vercel Dashboard → Storage → delete.

**Rollback from Fase 2:** `git reset --hard <fase-1-commit>`. Restore `.env.local` from backup. Local dev goes back to Supabase Auth. If already pushed, push a revert commit or force-push (only on the migration branch).

**Rollback from Fase 3:** `git reset --hard <fase-2-commit>`. Backfilled Blob files remain harmless. Restore Supabase Storage usage in `.env.local`.

**Rollback from Fase 4:** Revert Vercel production env vars to Supabase values (they were removed at Fase 5, not Fase 4; if we're rolling back BEFORE Fase 5, they're still there). Deploy the previous main commit via Vercel Dashboard → Deployments → Redeploy on an older SHA. Supabase project is still live and holds a consistent copy of the data as of the Fase 1 dump — but any writes made against Neon during Fases 2-4 are LOST on rollback (accept this as the tradeoff for production migration).

**Rollback from Fase 5:** IRREVERSIBLE for the Supabase project deletion. Rollback = re-create a Supabase project from scratch, restore data from a backup (Supabase's own 7-day PITR window may still cover the deletion depending on plan; check immediately). This is the last-resort path and is why Fase 5 requires explicit gate approval AFTER Fase 4 is verified green.

## Post-migration state (final)

- Repo runs on Vercel-native stack: Vercel Postgres (Neon), Vercel Blob, Better Auth.
- Supabase account has one free-tier slot open for `matchday-dev`.
- No `@supabase/*` package remains in `package.json`.
- No `lib/supabase/` directory, no `/auth/confirm` or `/auth/callback` routes.
- `.mcp.json` is gone; the agent no longer sees a Supabase MCP.
- `README.md` and `PRODUCT.md` reflect the new stack.
- Demo credentials unchanged (`manager@` / `client@` / `designer@` `@demo.com` / `demo1234`).
- Production URL unchanged: https://project-manager-app-cyan.vercel.app.

## Execution note for the worker session

This spec is decision-complete. The executor (a `/start-work`-launched session) must:

1. Load the six skills listed in "Skills the executor loads for `/start-work`" via `skill(name=...)` before starting Fase 0.
2. Follow the todos in strict numeric order.
3. Respect every phase gate (todos 14, 22, 47, 60, 71, 81) — STOP, print summary, wait for explicit user "OK".
4. Never skip a QA step. Every implementation todo has an executable QA command with expected output.
5. Never widen scope beyond this plan without a spec update.
6. On any hard failure, stop, report, propose remediation, and wait for user input. Do NOT self-heal with unplanned changes.

End of plan.
