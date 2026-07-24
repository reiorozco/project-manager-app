# Issues — 007-migration-off-supabase

Problems and gotchas encountered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

## Fase 4 bug found+fixed: Better Auth rejected Preview deployment sign-ins
- Symptom: POST /api/auth/sign-in/email returned 403 INVALID_ORIGIN on Preview URL
- Root cause: BETTER_AUTH_URL fixed to production domain, Preview gets different dynamic URL, Origin header validation failed
- Fix: added trustedOrigins to lib/auth.ts covering production + *.vercel.app + localhost
- Commit: fix(fase-4/5): add trustedOrigins for Vercel Preview auth (8039c56)
