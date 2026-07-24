# 008 — Post-migration fixes (follow-up to 007)

**Author:** Rei Orozco (via Prometheus validation session)
**Date:** 2026-07-24
**Status:** Approved plan, execution pending in separate worker session
**Predecessor:** `007-migration-off-supabase` (executed, 10/11 verifiers passed)
**Target repo:** `/Users/reiorozco/Dev/project-manager-app`
**Deployed at:** https://project-manager-app-cyan.vercel.app
**Branch strategy:** `fix/008-post-migration` → PR → merge to `main`
**Draft resume point:** `.omo/drafts/008-post-migration-fixes.md`
**Project convention copy:** `specs/008-post-migration-fixes.md` (executor copies in Fase 1 todo 1)

## Motivation

Validation of plan 007 found the migration technically sound — clean stack, data intact,
build green, storage round-trip verified byte-exact — but with one user-facing bug that
breaks the very first interaction with the app, plus two pieces of minor tech debt.

This is a portfolio project whose primary audience is recruiters. A login form that
authenticates but appears to do nothing is the worst possible first impression, so the
redirect fix is P0 and ships on its own gate.

## What validation proved (do not re-verify, it is done)

| Verifier | Result |
|---|---|
| F1 zero Supabase references | PASS — 6 grep patterns, 0 hits |
| F2 six tables + enums in Neon | PASS |
| F3 three demo users pre-verified + credential rows | PASS |
| F4 `prisma validate` | PASS |
| F5 `tsc --noEmit` | PASS |
| F6 `npm run build` | PASS, 17 routes |
| F7 blob/File parity | PASS |
| F9 upload → download → delete round-trip | PASS, byte-exact, delete confirmed via 404 |
| F11 git history | PASS |
| Historical Supabase-era data survived | PASS — 3 UUID projects, FKs resolve |
| Middleware auth-page redirect | PASS — `/auth/login` + session → `/` |
| Production console | PASS — 0 errors, 0 warnings |

## Goals

1. Signing in from the login form lands the user on `/` — no manual navigation.
2. Signing up from the register form lands the user on `/`.
3. The regression is locked by a QA step that asserts the URL programmatically, so it
   cannot silently reappear.
4. Next.js 16 deprecation warning resolved (`middleware.ts` → `proxy.ts`).
5. Duplicate `better-auth` versions removed from the dependency tree.

## Non-goals / Must-NOT-Have

1. Do NOT attempt to reconstruct or re-run a Supabase Storage backfill. The Supabase
   project is deleted; the source no longer exists. The gap is documented as an accepted,
   unprovable risk in the draft ledger. Leave it.
2. Do NOT re-verify anything in the "What validation proved" table above. It is settled.
3. Do NOT refactor `app/auth/auth-context.tsx` beyond what the redirect fix requires. It
   works; leave the React Query structure alone.
4. Do NOT reintroduce the `signInSuccessCallback` ref machinery that 007 removed. The
   page owns its navigation now — that is the intended design.
5. Do NOT touch `lib/services/project-service.ts`, the Prisma schema, the Blob routes, or
   any auth API route. None of them are implicated.
6. Do NOT change demo credentials or the README credentials table.
7. Do NOT add auto-generated signatures to commits, docs, or PR descriptions.
8. Do NOT skip a phase gate. Fase 1 is P0 and ships independently of Fases 2-3.
9. Do NOT write Spanish in code, commits, PR body, or docs. Chat is Spanish; artifacts English.
10. Do NOT create test projects in production without deleting them in the same session.

## Files that will change

**Created:**
- `specs/008-post-migration-fixes.md` (Fase 1 todo 1 — verbatim copy of this plan)
- `proxy.ts` (Fase 2)

**Modified:**
- `app/auth/login/page.tsx` (Fase 1)
- `app/auth/register/page.tsx` (Fase 1)
- `app/components/Navbar.tsx` (Fase 1, only if sign-out needs the same treatment)
- `.gitignore` (Fase 3)
- `package.json` + `package-lock.json` (Fase 3)

**Deleted:**
- `middleware.ts` (Fase 2, replaced by `proxy.ts`)

## Todos

### Fase 1 — P0: restore post-auth redirect

- [x] 1. `specs/008-post-migration-fixes.md`: Copy this plan verbatim from `.omo/plans/008-post-migration-fixes.md` so the project's `specs/` convention holds - expect the two files are byte-identical.
  - Files: `specs/008-post-migration-fixes.md` (new)
  - Acceptance: `diff .omo/plans/008-post-migration-fixes.md specs/008-post-migration-fixes.md` produces empty output.
  - QA: `diff .omo/plans/008-post-migration-fixes.md specs/008-post-migration-fixes.md && echo IDENTICAL` prints `IDENTICAL`.
  - Commit strategy: Group with Fase 1 commit.

- [x] 2. `git`: Create and check out branch `fix/008-post-migration` from a clean, up-to-date `main` - expect branch exists and tracks current origin/main.
  - Files: none
  - Acceptance: `git branch --show-current` returns `fix/008-post-migration`; `git log --oneline -1` matches the current tip of origin/main (`a4c223f` or later).
  - QA: `git rev-parse --abbrev-ref HEAD` returns `fix/008-post-migration`.
  - Commit strategy: n/a.

- [x] 3. `app/auth/login/page.tsx`: Add a post-success redirect. Import `useRouter` from `next/navigation`. On successful sign-in, call `router.push("/")` then `router.refresh()`. Use Better Auth's documented fetch-option callbacks if `signIn` from `useAuth()` forwards them; otherwise await the `signIn` result, check that no error was returned, and redirect on the success branch. Preserve all existing error handling and loading/disabled states - expect submitting valid credentials navigates to `/`.
  - Files: `app/auth/login/page.tsx` (modified)
  - Reference shape (adapt to the actual `useAuth()` signature currently in the file — read it first, do not assume):
    ```tsx
    const router = useRouter();
    // ...
    const result = await signIn({ email, password });
    if (result?.error) {
      setError(result.error.message ?? "Invalid credentials");
      return;
    }
    router.push("/");
    router.refresh();
    ```
  - WHY `router.refresh()` is mandatory: `app/page.tsx` is a Server Component that reads the session via `auth.api.getSession({ headers: await headers() })`. Without `refresh()`, the Next.js Router Cache can serve a stale prefetched RSC payload for `/` and the dashboard renders as if unauthenticated.
  - Acceptance: `npx tsc --noEmit` exits 0; the file imports `useRouter` from `next/navigation`; the success branch calls both `push` and `refresh`.
  - QA: `grep -c "useRouter\|router.push\|router.refresh" app/auth/login/page.tsx` returns >= 3.
  - Commit strategy: Group with Fase 1 commit.

- [x] 4. `app/auth/register/page.tsx`: Apply the identical post-success redirect treatment. Plan 007 todo 34 specified "redirect to `/` after successful signup" — verify whether it actually happens; if it does not, add `router.push("/")` + `router.refresh()` on the success branch exactly as in todo 3 - expect submitting a valid new registration navigates to `/`.
  - Files: `app/auth/register/page.tsx` (modified, only if the redirect is absent)
  - Acceptance: `npx tsc --noEmit` exits 0; success branch navigates to `/`. If the redirect was already present and correct, record that finding explicitly and make no change.
  - QA: `grep -c "router.push\|router.refresh" app/auth/register/page.tsx` returns >= 2, OR the executor documents that a working redirect already existed.
  - Commit strategy: Group with Fase 1 commit.

- [x] 5. `app/components/Navbar.tsx`: Verify the sign-out flow still lands on `/auth/login`. Validation did not exercise sign-out. If it uses `window.location.href` (a hard navigation) it is already correct — confirm and change nothing. If it relies on a soft navigation without `refresh()`, apply the same `router.push` + `router.refresh()` treatment - expect clicking sign out lands on `/auth/login` with the session cleared.
  - Files: `app/components/Navbar.tsx` (modified only if needed)
  - Acceptance: Sign-out navigates to `/auth/login` and a subsequent `GET /api/auth/get-session` returns an empty session.
  - QA: Covered by the Playwright script in todo 6.
  - Commit strategy: Group with Fase 1 commit.

- [x] 6. Local regression QA — write and run a throwaway Playwright script at `/tmp/qa-008-auth-redirect.mjs` that, against `http://localhost:3000` with `npm run dev` running, performs for EACH of the three demo users (`manager@demo.com`, `client@demo.com`, `designer@demo.com`, password `demo1234`): (a) goto `/auth/login`, (b) fill email + password, (c) click Sign in, (d) `await page.waitForURL("**/", { timeout: 10000 })`, (e) ASSERT `new URL(page.url()).pathname === "/"` and throw if not, (f) assert the dashboard heading is visible, (g) sign out, (h) assert pathname is `/auth/login`. Print PASS/FAIL per user and exit non-zero on any failure - expect the script exits 0 with three PASS lines.
  - Files: `/tmp/qa-008-auth-redirect.mjs` (transient, NOT committed)
  - WHY this is specified as a hard assertion: the equivalent check in plan 007 (todo 33) was phrased as prose manual verification and the bug shipped anyway. The assertion must actually execute and fail loudly.
  - Acceptance: Script exits 0. Any non-zero exit blocks the fase.
  - QA: `node /tmp/qa-008-auth-redirect.mjs; echo "exit=$?"` prints `exit=0` and three `PASS` lines. Save the full output to `/tmp/qa-008-results.txt`.
  - Commit strategy: Script is transient; do not commit.

- [x] 7. Commit Fase 1: `git add specs/008-post-migration-fixes.md .omo/ app/auth/login/page.tsx app/auth/register/page.tsx app/components/Navbar.tsx && git commit -m "fix(auth): redirect to dashboard after sign-in and sign-up"` - expect one commit.
  - Files: staged and committed.
  - Acceptance: `git log --oneline -1` matches; `git show --stat HEAD` lists the auth page(s).
  - QA: `git show --stat HEAD | grep -c 'app/auth/login/page.tsx'` returns 1.
  - Commit strategy: This is the Fase 1 commit.

- [x] 8. Push, open PR, merge, verify in production. Push `fix/008-post-migration`, wait for the Vercel preview to reach READY, re-run the todo 6 Playwright script against the PREVIEW URL (change the base URL), confirm exit 0, then merge to `main` and wait for the production deploy. Finally re-run the script against `https://project-manager-app-cyan.vercel.app` and confirm exit 0 - expect the redirect works in production for all three roles.
  - Files: none.
  - Acceptance: Script exits 0 against both preview and production. Save outputs to `/tmp/qa-008-preview.txt` and `/tmp/qa-008-prod.txt`.
  - QA: Both files end with three `PASS` lines and `exit=0`.
  - Commit strategy: n/a (PR merge).

- [x] 9. GATE — Fase 1 complete (P0 resolved). Print summary: (a) files changed, (b) local QA output, (c) preview QA output, (d) production QA output, (e) merge SHA. Then PAUSE. Fases 2 and 3 are optional tech debt — do NOT begin them without explicit user "OK".

### Fase 2 — P2: Next.js 16 proxy convention

- [x] 10. `proxy.ts`: Create at repo root as a rename of `middleware.ts`, preserving the exported logic exactly (session check via `auth.api.getSession`, the `PUBLIC_API_PREFIXES` / `AUTH_PAGE_PREFIXES` matrix, both redirects). Rename the exported function from `middleware` to `proxy`. Keep the exported `config` including `runtime: "nodejs"` and the existing matcher - expect the deprecation warning disappears from `npm run build`.
  - Files: `proxy.ts` (new)
  - Reference: Next.js 16 deprecation notice — https://nextjs.org/docs/messages/middleware-to-proxy . Confirm the exact expected export name and config shape against that page or Context7 before writing; do not guess.
  - Acceptance: `npx tsc --noEmit` exits 0.
  - QA: `grep -c "export async function proxy\|export function proxy" proxy.ts` returns 1.
  - Commit strategy: Group with Fase 2 commit.

- [x] 11. Delete `middleware.ts` - expect file gone and no duplicate route interception.
  - Files: `middleware.ts` (deleted)
  - Acceptance: `test ! -e middleware.ts` exits 0.
  - QA: Same as acceptance.
  - Commit strategy: Group with Fase 2 commit.

- [x] 12. Verify the deprecation warning is gone and route protection still works: run `npm run build` and confirm the output no longer contains "middleware" file convention is deprecated", and that the build summary still shows a Proxy/Middleware entry - expect clean build with no deprecation line.
  - Files: none.
  - Acceptance: `npm run build 2>&1 | grep -c 'is deprecated'` returns 0; exit code 0.
  - QA: Same as acceptance. Then re-run the todo 6 Playwright script locally and confirm exit 0 (route protection unbroken).
  - Commit strategy: No file change.

- [x] 13. Commit Fase 2: `git commit -m "refactor: migrate middleware.ts to proxy.ts for Next.js 16"` - expect one commit.
  - Files: `proxy.ts` added, `middleware.ts` deleted.
  - Acceptance: `git show --stat HEAD` shows both the addition and the deletion.
  - QA: `git show --stat HEAD | grep -cE 'proxy.ts|middleware.ts'` returns 2.
  - Commit strategy: This is the Fase 2 commit.

- [x] 14. GATE — Fase 2 complete. (User granted OK via /start-work invocation — proceeding to Fase 3.)

### Fase 3 — P3: repo and dependency hygiene

- [x] 15. `.gitignore`: Add `.playwright-mcp/` so Playwright MCP artifacts (page snapshots, console logs) never enter version control. This directory is regenerated every time an agent drives the browser — including by todo 6 of this very plan — so ignoring it is preventive, not cosmetic. If a `.playwright-mcp/` directory currently exists in the repo root, delete it in the same step - expect the directory is gone and git no longer reports it as untracked.
  - Files: `.gitignore` (modified)
  - Acceptance: `.gitignore` contains a line `.playwright-mcp/`; `test ! -d .playwright-mcp` exits 0; `git status --porcelain | grep -c playwright` returns 0.
  - QA: `rm -rf .playwright-mcp && git status --porcelain | grep -c playwright` returns 0, and `grep -c '^\.playwright-mcp/$' .gitignore` returns 1.
  - Commit strategy: Group with Fase 3 commit.

- [x] 16. Resolve the duplicate `better-auth` in the dependency tree. Currently `@better-auth/cli@1.4.21` pulls a nested `better-auth@1.4.21` while the app depends on `better-auth@1.6.25`. Either (a) bump `@better-auth/cli` to a version whose peer matches 1.6.x, or (b) if no such version exists, remove `@better-auth/cli` from `devDependencies` entirely and invoke it on demand via `npx @better-auth/cli@latest` — the app does not need it at build or runtime. Choose (b) if (a) is not cleanly available - expect `npm ls better-auth` shows a single version.
  - Files: `package.json`, `package-lock.json` (modified)
  - Acceptance: `npm ls better-auth` reports exactly one `better-auth` version and no `deduped`/conflict warnings for it.
  - QA: `npm ls better-auth 2>&1 | grep -c '1.4.21'` returns 0.
  - Commit strategy: Group with Fase 3 commit.

- [x] 17. Re-verify the build after the dependency change: `npx tsc --noEmit && npm run build` - expect both exit 0.
  - Files: none.
  - Acceptance: Both commands exit 0.
  - QA: `npx tsc --noEmit && npm run build && echo BOTH_OK` prints `BOTH_OK`.
  - Commit strategy: No file change.

- [x] 18. Commit Fase 3 and merge: `git commit -m "chore: dedupe better-auth and ignore Playwright MCP artifacts"`, push, merge to `main`, wait for the production deploy to reach READY - expect production still green.
  - Files: committed.
  - Acceptance: Production deploy READY; `curl -sI https://project-manager-app-cyan.vercel.app` returns 200 or 307.
  - QA: Same as acceptance.
  - Commit strategy: This is the Fase 3 commit.

- [x] 19. GATE — Fase 3 complete. Print final summary, then run the FINAL VERIFICATION WAVE below.

## Final verification wave

- [x] F1. Post-login redirect works in production for all three demo roles: the Playwright script from todo 6, pointed at `https://project-manager-app-cyan.vercel.app`, exits 0 with three PASS lines.
- [x] F2. Sign-out works in production: after sign-out the pathname is `/auth/login` and `GET /api/auth/get-session` returns an empty session.
- [x] F3. `npx tsc --noEmit` exits 0.
- [x] F4. `npm run build` exits 0 AND emits zero deprecation warnings (`grep -c 'is deprecated'` returns 0).
- [x] F5. `npm ls better-auth` reports a single version.
- [x] F6. Production console shows 0 errors and 0 warnings on `/auth/login`, `/`, and `/projects`.
- [x] F7. No test/QA artifact projects remain in production: `GET /api/projects` returns exactly the 4 expected projects (`Test Project`, `Product landing page`, `Mobile app — wireframes`, `Brand redesign — Acme Corp`) and no title containing "QA" or "test roundtrip".
- [x] F8. Route protection intact: an unauthenticated request to `/` redirects to `/auth/login`, and an authenticated request to `/auth/login` redirects to `/`.
- [x] F9. No agent artifacts left in the repo: `git status --porcelain` reports no `.playwright-mcp` entry, `test ! -d .playwright-mcp` exits 0, and `.gitignore` contains `.playwright-mcp/`. Any browser session opened during execution is closed and no background task is left running.

## Rollback playbook

**Fase 1:** `git revert <fase-1-sha>` and redeploy. The app returns to the current state —
authentication still works, only the redirect is lost again. Zero data risk.

**Fase 2:** `git revert <fase-2-sha>` restores `middleware.ts` and deletes `proxy.ts`. If
the revert leaves both files present, delete `proxy.ts` manually — having both would double
-intercept requests. Verify with the todo 6 script before considering rollback complete.

**Fase 3:** `git revert <fase-3-sha>` and `npm install`. Dev-only change, zero runtime risk.

No fase in this plan touches the database, the blob store, or any auth API route, so no
data-loss path exists anywhere in 008.

## Deferred / accepted risks (no todo — documented only)

- **Supabase Storage backfill unprovable.** Plan 007 todos 56-57 (create + run
  `scripts/backfill-storage.ts`) were never executed and left no log. At validation time
  the DB held 1 `File` row (a QA artifact, since deleted) and all 4 historical projects
  show `files: []`. The most probable reading is that the Supabase source genuinely had
  zero files — a `pg_dump --data-only` of the public schema would have carried `File` rows
  across if any existed, and the UI badge reads 0 rather than N-with-broken-downloads.
  Because the Supabase project was deleted in 007 Fase 5, this cannot be confirmed
  retroactively. Accepted. No action possible.
- **`specs/007-migration-off-supabase.md` differs from its `.omo/plans/` source by one
  checkbox** (line 172). Executor marking progress. Cosmetic. Left as-is.
- **`specs/005-project-manager-redesign.md` and `specs/006-modernizar-majors.md` remain
  untracked in git.** Predates this migration. Commit them if you want the specs history
  in the repo; out of scope here.
- **F10 of plan 007 (Supabase free-tier slot released)** was asserted by commit `a4c223f`
  but never independently verified. Confirm in the Supabase dashboard before provisioning
  `matchday-dev`.

## Execution note for the worker session

1. Fase 1 is P0 and self-contained — it can ship alone. Fases 2-3 are optional debt.
2. Read `app/auth/login/page.tsx` and `app/auth/auth-context.tsx` BEFORE writing todo 3.
   The reference snippet is shape guidance, not a drop-in; match the actual `useAuth()`
   signature in the file.
3. Respect gates at todos 9, 14, 19.
4. The todo 6 QA script is the anti-regression contract. Do not weaken it into a manual
   eyeball check — that is exactly how this bug shipped.
5. If any QA exits non-zero, stop and report. Do not self-heal with unplanned changes.

End of plan.
