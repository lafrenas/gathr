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
- [ ] Decide production requirement: email and/or phone mandatory
- [ ] Configure and validate production SMS provider
- [ ] Remove test-mode shortcuts for production build (or gate behind env flag)
- [ ] Final onboarding polish pass (copy, transitions, analytics hooks)

## Phase C - Reputation Rules (Medium)
- [ ] Enforce host lockout below reputation threshold (e.g. <3.5)
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

---

## 🔄 Update Policy (Source of Truth)
- This file is the canonical roadmap for Gathr status.
- On every completed feature/meaningful change:
  1. Update this roadmap (`Completed` and/or `Remaining` sections)
  2. Commit the roadmap update in the same branch/PR when practical
  3. Push to GitHub so collaborators see latest status
