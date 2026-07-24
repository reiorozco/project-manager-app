# Decisions — 008-post-migration-fixes

Architectural choices and rationales discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

## PR #28 Merged
- **Merge SHA**: `5dad3dda5a8e98446fe88e9650fd7dd1152d1a67`
- **Title**: fix(auth): redirect to dashboard after sign-in and sign-up
- **Status**: Merged to main via squash merge
- **QA**: Preview QA passed (all 3 demo roles verified)

## PR #29 Merged
- **Merge SHA**: `789dc0b6ed84a63c368567612191990ac0a939b5`
- **Title**: refactor: migrate middleware.ts to proxy.ts for Next.js 16
- **Status**: Merged to main via squash merge
- **QA**: Build verified clean (zero deprecation warnings), Playwright regression passed (all 3 demo users)

## PR #30 Merged
- **Merge SHA**: `b7d4c57`
- **Title**: chore: dedupe better-auth and ignore Playwright MCP artifacts
- **Status**: Merged to main via squash merge
- **Changes**: (1) Removed @better-auth/cli from devDependencies (eliminates nested better-auth@1.4.21 duplicate; app uses better-auth@1.6.25; CLI available via npx @better-auth/cli@latest on demand); (2) Added .playwright-mcp/ to .gitignore (prevents Playwright MCP browser snapshots from entering version control)
- **QA**: Production deploy READY (HTTP 307 confirmed)
