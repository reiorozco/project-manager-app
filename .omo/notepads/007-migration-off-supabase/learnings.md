# Learnings — 007-migration-off-supabase

Conventions, patterns, and successful approaches discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

## 2026-07-24 Fase 0 automated tasks
- Migration branch: migration/007-off-supabase created from main
- npm install: better-auth, @vercel/blob@^2.3.0, @better-auth/cli (--save-dev)
- .env.local: BETTER_AUTH_SECRET and BETTER_AUTH_URL added (appended, not overwritten)
- .env.example: all 7 vars present with comments on new vars
- NOT committed yet (todo 13 handles the commit after user completes todos 6, 7, 8)

## app/api/upload/route.ts created - handleUpload from @vercel/blob/client, auth check via auth.api.getSession

## app/api/files/[...path]/route.ts created - get() returns {stream, blob}, auth + canViewProject check

## 2026-07-24 Fase 2 + Fase 3 commits created
- Fase 2 commit: `9dff4ec` feat(fase-2/5): migrate Auth from Supabase to Better Auth + seed demo users
  - 29 files changed: auth migration (Better Auth), seed script, Prisma schema updates
  - Removed: lib/supabase/*, app/auth/callback, app/auth/confirm routes
  - Added: lib/auth.ts, lib/auth-client.ts, app/api/auth/[...all]/route.ts, scripts/seed-demo-users.ts
- Fase 3 commit: `353d2cc` feat(fase-3/5): migrate Storage from Supabase to Vercel Blob + backfill existing files
  - 2 files changed: next.config.ts (Blob config), scripts/backfill-storage.ts (migration script)
  - All code verified: tsc clean, build passes, zero unintended Supabase references
