# MEMORY.md

## User preferences
- Prefers strong continuity across days/sessions; dislikes needing to re-paste prior context.
- For active projects (e.g., Gathr), keep concise milestone summaries in daily memory files so work can resume quickly.
- When Ignas confirms "it works" on Gathr changes, push to GitHub immediately.

## Active project: Gathr (updated 2026-03-01)
- Trust & safety hardened and validated:
  - report/block abuse throttles (UI + DB triggers)
  - moderation audit log + action triggers
  - bidirectional block enforcement across feed/invite/join/approval
  - report-first block policy with required details
  - participant-level report/block actions
  - blocked-pair shared upcoming attendance revocation
- Ratings integrity hardened and validated:
  - 24h edit window lock
  - rating dispute flow scaffold (`rating_disputes`)
  - update lock while dispute is open/reviewing
  - deterministic SQL validation script added
- Event lifecycle reliability implemented and validated:
  - explicit states (`draft/published/ongoing/ended/archived`)
  - transition guardrails in app + DB trigger
  - idempotent `sync_event_statuses()` helper
- Private beta prep underway for ~20 testers:
  - `EXPO_PUBLIC_PRIVATE_BETA_MODE` hardening (hides testing skips, requires verified email)
  - migration order, seed data, release checklist, and go-live notes added.
