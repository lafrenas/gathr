# Gathr Private Beta Go-Live (20 Testers)

Open in Notepad:
notepad C:\Users\openclaw\.openclaw\workspace\gathr\PRIVATE_BETA_GO_LIVE.md

## Goal
Ship a stable private beta to ~20 invited testers (not public store launch).

## 1) Environment mode
- Set `EXPO_PUBLIC_PRIVATE_BETA_MODE=true`
- In this mode:
  - registration skip toggles are hidden
  - email skip/phone skip testing shortcuts are hidden
  - onboarding requires valid + verified email

## 2) Apply SQL patches (order)
1. `supabase_safety_enforcement_patch.sql`
2. `supabase_trust_safety_hardening_patch.sql`
3. `supabase_ratings_integrity_patch.sql`
4. `supabase_event_lifecycle_patch.sql`

## 3) Seed test data for internal QA
- Run: `BETA_SEED_DATA.sql`
- Verify hosts + attendees + pending requests + moderation sample data.

## 4) Regression run
- Run checklist: `MVP_RELEASE_CHECKLIST.md`
- Critical blockers only (safety bypass, state corruption, crashers).

## 5) Tester operations setup
- Define one admin operator account (user `1` for now).
- Confirm moderation dashboard works for reports/disputes.
- Keep quick rollback note: revert to previous commit + DB backups.

## 6) Invite plan (20 users)
- Wave 1: 5 users (24h)
- Wave 2: +10 users (if stable)
- Wave 3: +5 users
- Collect feedback in one shared form/chat thread.

## 7) Exit criteria
- No major crashes in create/join/invite/report/block/rate flows
- No blocked-pair privacy leaks
- No invalid lifecycle transitions
- Ratings dispute lock behaves correctly

## 8) Nice-to-have before wider beta
- Time quick filters polish (today/tomorrow/week)
- Report triage workflow statuses in moderation panel
- Block/report history inside profile view
