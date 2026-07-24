# ulw-plan draft: 008-post-migration-fixes

---
slug: 008-post-migration-fixes
intent: clear
review_required: false
status: approved
started_at: 2026-07-24
approved_at: 2026-07-24
final_plan_path: /Users/reiorozco/Dev/project-manager-app/.omo/plans/008-post-migration-fixes.md
project_convention_copy: /Users/reiorozco/Dev/project-manager-app/specs/008-post-migration-fixes.md
predecessor: 007-migration-off-supabase
---

## Origin

Post-execution validation of plan 007 (migration off Supabase). Validation was run by
Prometheus on 2026-07-24 against the live production deploy plus static/DB/build checks.
10 of 11 final verifiers passed. This plan closes the gaps found.

## Validation ledger (evidence collected 2026-07-24)

PASSED:
- F1 zero Supabase refs — 6 grep patterns, 0 hits across app/ lib/ scripts/ prisma/
  middleware.ts next.config.ts package.json .env.example README.md PRODUCT.md
- F2 six tables in Neon + both enums; host `ep-cool-base-au1fhspi.c-10.us-east-1.aws.neon.tech`
- F3 three demo users, correct roles, emailVerified=true, 3 `Account.providerId='credential'`
- F4 `npx prisma validate` exit 0
- F5 `npx tsc --noEmit` exit 0
- F6 `npm run build` exit 0, 17 routes
- F7 blob/File parity 1:1
- F9 upload+download+delete round-trip verified byte-exact (69340 bytes, PNG magic,
  then 404 after delete → `del()` confirmed)
- F11 git history: PR #25 squash + `fase-4/5` + `fase-5/5` commits
- deps: `@supabase/*` absent, `better-auth@1.6.25`, `@vercel/blob@2.6.1` present
- historical data survived: 3 Supabase-era UUID projects with FKs resolving to
  "Designer Demo"
- middleware redirect verified: `/auth/login` with active session → `/`
- production console: 0 errors, 0 warnings

FAILED / GAPS:
- **P0 BUG — post-login redirect missing.** `POST /api/auth/sign-in/email` returns 200,
  cookie set, navbar flips to authenticated, but URL stays on `/auth/login` with the form
  still populated. Waited 3s, no navigation. Middleware works but only evaluates on
  navigation, and a client-side sign-in triggers none. Root cause: todo 32 of plan 007
  removed the `signInSuccessCallback` ref machinery along with `onAuthStateChange`, and
  todo 33 did not reinstate an equivalent redirect. Violates todo 33's own acceptance
  criterion ("login succeeds and lands on `/`").
- `scripts/backfill-storage.ts` never created (plan 007 todos 56-57), no
  `/tmp/backfill-log.txt`. Only 1 `File` row existed at validation time (the QA artifact).
  All 4 historical projects have `files: []`. Most likely the source had zero files
  (a `--data-only` dump would have carried `File` rows if they existed, and the badge
  shows 0 not N) — but the Supabase project is deleted, so this is now UNPROVABLE.
  Recorded as accepted risk, not actionable.
- Next.js 16 deprecation: `The "middleware" file convention is deprecated. Please use
  "proxy" instead.` Non-fatal.
- Duplicate better-auth in tree: `@better-auth/cli@1.4.21` pulls `better-auth@1.4.21`
  alongside top-level `better-auth@1.6.25`.
- `specs/007-migration-off-supabase.md` differs from `.omo/plans/007-...` by one checkbox
  (line 172). Cosmetic — executor marking progress. Not actionable.

NOT VERIFIABLE BY AGENT:
- F10 Supabase slot freed — commit `a4c223f` asserts it; requires user confirmation in
  the Supabase dashboard before creating `matchday-dev`.
- F8 only exercised with `manager@demo.com`. `client@` and `designer@` have credential
  rows so they almost certainly work, but were not driven end-to-end.

CLEANUP ALREADY DONE:
- The QA artifact project "Migration QA - blob roundtrip" and its blob were deleted from
  production during validation. Production is back to 4 projects / 0 files.

## Decisions adopted as defaults

1. **Redirect fix location:** `app/auth/login/page.tsx` (and `app/auth/register/page.tsx`),
   NOT auth-context. Keep the context lean; the page owns its own navigation.
2. **Redirect mechanism:** Better Auth's documented `onSuccess` fetch-option callback with
   `router.push("/")` followed by `router.refresh()`. The `refresh()` is REQUIRED because
   `app/page.tsx` is a Server Component reading the session server-side; without it the
   Next.js Router Cache can serve a stale prefetched RSC payload for `/`.
3. **No rollback of 007.** These are additive fixes on top of a working migration.
4. **Regression-proof QA.** The 007 QA for this exact todo was prose-verifiable and the
   bug still shipped. New QA asserts `page.url()` programmatically after submit — it
   cannot be self-reported as passing without the assertion actually running.
5. **Backfill gap:** accepted as unprovable, documented, no remediation todo. Do NOT
   attempt to reconstruct — the source is gone.
6. **proxy.ts migration:** included as its own fase, P2, gated separately so it can be
   deferred without blocking the P0 fix.
7. Language/commit conventions inherited from 007: English artifacts, Spanish chat,
   no auto-signatures, gate between fases.

## Open questions

None. All forks closed by validation evidence.

## Next workflow action

Plan written. Execution starts only when the user runs `/start-work`.
