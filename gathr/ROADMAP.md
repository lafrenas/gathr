# Gathr Roadmap

_Last updated: 2026-02-27_

## ✅ Completed So Far

### Core event platform
- [x] Event feed + create event
- [x] Join request flow (request / approve / reject)
- [x] Host invites + member invite/request flow (host approval final)
- [x] Exact location/time hidden until approval
- [x] Event date→time picker improvements (safe timestamp flow)
- [x] Event description field
- [x] Capacity support (`min_people`, `max_people`, `no_max`) with full checks

### Discovery + maps
- [x] Search bar + fuzzy matching
- [x] Search suggestion ranking polish (exact/prefix/typo-tolerant)
- [x] Category filter + activity filter
- [x] Date filter + radius filter (with unknown-location handling)
- [x] Postcode/location autocomplete (remote + Google fallback)
- [x] Map pin drop for precise locations
- [x] Map browse view (nearby/global admin)

### Identity + onboarding
- [x] Registration gate before core actions
- [x] Profile completion meter + autosave
- [x] Profile fields: full name, gender, age group, based in, about me
- [x] Avatar upload + avatar chips in feed/invites/notifications
- [x] Password + confirm + strength rules
- [x] Email OTP flow (send/verify/resend/change)
- [x] Phone OTP flow UI (send/verify/resend/change; provider-dependent)
- [x] Full-screen onboarding wizard with:
  - [x] Animated logo intro
  - [x] Step progress + back button
  - [x] Interest categories + per-category option boxes
  - [x] Location question with Google-style suggestions
  - [x] Searchable country picker (flag + code + aliases)
  - [x] Testing fast-track + skip email/phone
  - [x] Inline validation errors
  - [x] Draft persistence on web refresh
  - [x] Post-signup checklist modal

### Ratings / trust / safety
- [x] Multi-metric participant ratings (skill/friendliness/reliability/communication/boundary)
- [x] Rating eligibility enforcement (approved attendee↔host + event ended)
- [x] Activity-level ratings
- [x] Online activities supported + per-game leaderboard scaffold
- [x] Report flow + reason picker + details
- [x] Block/unblock + blocked hosts hidden from feed
- [x] Moderation dashboard with severity grouping + visual badges
- [x] Abuse throttles for reports and block/unblock churn (UI + DB trigger)
- [x] Moderation audit log scaffold (`moderation_audit_log` + action triggers)
- [x] Block enforcement expanded across feed/invite/approval flows (both directions)
- [x] Report-first safety policy: blocking requires prior detailed report
- [x] Participant-level block/report actions (not host-only)

### Backend (Supabase)
- [x] Core tables: `events`, `join_requests`, `event_ratings`, `event_activity_ratings`, `event_comments`, `user_reports`, `user_blocks`, `user_profiles`, moderation/rating skip tables
- [x] Dev-safe RLS and policy patches
- [x] Profile/contact/verification columns (`avatar_url`, `phone`, `email`, verified flags)
- [x] Avatars storage bucket + policy patch

---

## 🚧 Remaining Work (To Complete MVP+)

## Phase A - Discovery UX Polish (High)
- [x] Search/filter simplification pass (basic vs advanced)
- [ ] Time quick filters polish: today / tomorrow / this week
- [x] Better empty states and filter-result explanations
- [ ] Clear in-app "done / doing / todo" project structure page

## Phase B - Registration Finalization (High)
- [x] Private beta requirement set: email mandatory + verified (phone optional)
- [ ] Configure and validate production SMS provider
- [x] Test-mode shortcuts gated behind env flag (`EXPO_PUBLIC_PRIVATE_BETA_MODE`)
- [ ] Final onboarding polish pass (copy, transitions, analytics hooks)

## Phase C - Reputation Rules (Medium)
- [ ] Enforce host lockout below reputation threshold (e.g. <3.5)
- [x] Ratings integrity baseline: 24h edit window + lock while dispute open
- [x] Host dispute flow scaffold for unfair ratings (`rating_disputes`)
- [x] Backfill integrity helper view (`rating_integrity_flags`)
- [ ] Social activities: ensure no skill-gating where inappropriate
- [ ] Per-game ranking refinements beyond current scaffold

## Phase D - Moderation Expansion (Medium)
- [ ] Report management workflow refinement (triage/review lifecycle)
- [ ] Block/report history in profile
- [ ] Repeat offender analytics + threshold tuning

## Phase E - Collaboration + Dev Hygiene (Medium)
- [ ] Schema migration documentation cleanup
- [ ] Seed script for test/demo data
- [ ] Contributor setup guide (env + auth provider setup)
- [ ] Regression checklist for releases

## Phase F - Event lifecycle reliability (High)
- [x] Explicit lifecycle states (`draft`, `published`, `ongoing`, `ended`, `archived`)
- [x] Transition guardrails in app + DB trigger (invalid jumps blocked)
- [x] Idempotent status sync helper (`sync_event_statuses`)
- [x] Host lifecycle controls in event cards (publish/start/end/archive)

---

## 🔄 Update Policy (Source of Truth)
- This file is the canonical roadmap for Gathr status.
- On every completed feature/meaningful change:
  1. Update this roadmap (`Completed` and/or `Remaining` sections)
  2. Commit the roadmap update in the same branch/PR when practical
  3. Push to GitHub so collaborators see latest status
