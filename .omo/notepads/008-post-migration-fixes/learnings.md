# Learnings — 008-post-migration-fixes

Conventions, patterns, and successful approaches discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

## [2026-07-24 22:23] Task: todo:6 (QA script)
Playwright QA script at /tmp/qa-008-auth-redirect.mjs initially showed flaky FAIL results
(1-3 of 3 users failing with waitForURL timeout, no sign-in/email network request ever firing).
Root cause: script used `page.goto(url, { waitUntil: "domcontentloaded" })` then clicked the
submit button immediately. Under Turbopack dev-mode on-demand compilation, DOMContentLoaded can
resolve before React hydration finishes attaching the onClick handler, causing the click to be
a no-op (native DOM click happens but no fetch is triggered). Fix: use
`waitUntil: "networkidle"` on goto AND `await submitBtn.waitFor({ state: "visible" })` before
clicking. After the fix, all 3 demo users PASS consistently (verified with 2 consecutive runs).
This was a QA-script-only issue — confirmed via direct curl to /api/auth/sign-in/email that the
backend works correctly for all 3 users every time (200 OK, no rate limiting).
