# Gathr MVP Release Checklist (Regression)

Open in notepad:
notepad C:\Users\openclaw\.openclaw\workspace\gathr\MVP_RELEASE_CHECKLIST.md

---

## 0) Preflight
- [ ] Pull latest code
- [ ] `npm install`
- [ ] `npx tsc --noEmit` passes
- [ ] Supabase patches applied:
  - [ ] `supabase_trust_safety_hardening_patch.sql`
  - [ ] `supabase_ratings_integrity_patch.sql`
  - [ ] `supabase_event_lifecycle_patch.sql`

## 1) Auth + onboarding
- [ ] New user can register
- [ ] Required profile fields enforced
- [ ] Email OTP flow works (send/verify/resend)
- [ ] Phone OTP UI works (or clearly disabled if provider not configured)

## 2) Event creation + discovery
- [ ] Create event succeeds
- [ ] Event appears in feed
- [ ] Search/filter/category/date/radius behave correctly
- [ ] Map browse opens and pins render

## 3) Attendance + invites
- [ ] Request to join works
- [ ] Host approve/reject works
- [ ] Invite user works
- [ ] Capacity limits enforced

## 4) Trust & safety
- [ ] Report requires >=20-char details
- [ ] Block requires prior detailed report
- [ ] Participant-level report/block visible (not just host)
- [ ] Blocked-pair event visibility is hidden
- [ ] Blocking revokes shared upcoming attendance
- [ ] `moderation_audit_log` receives entries

## 5) Ratings integrity
- [ ] Rating allowed only after event end
- [ ] Rating dispute can be raised by rated user
- [ ] Edit blocked while dispute is open
- [ ] Edit blocked after 24h window
- [ ] Edit allowed after dispute resolved (within 24h)

## 6) Event lifecycle reliability
- [ ] Host can transition valid states: published->ongoing->ended->archived
- [ ] Invalid transitions are blocked
- [ ] Archived events hidden from feed
- [ ] `sync_event_statuses()` runs safely (idempotent)

## 7) Regression sanity
- [ ] Comments still post for host/approved attendees
- [ ] Activity rating still works
- [ ] Host profile ratings render correctly
- [ ] No console/runtime errors in core flows

## 8) Optional SQL quick tests
- [ ] `TEST_RATINGS_INTEGRITY_V2.sql` run section-by-section
- [ ] `TEST_EVENT_LIFECYCLE.sql` run section-by-section

## 9) Release decision
- [ ] PASS all critical items
- [ ] Create release tag / deployment plan
- [ ] Note known non-blockers

---

## Critical blockers (must fix before release)
- Any safety rule bypass (block/report/dispute/lifecycle transition)
- Data corruption / broken state transition
- Users seeing blocked-pair events
- Crash in create/join/approve/rate flows

## Notes
- Expected failures in SQL tests are part of validation.
- Run SQL sections separately when failure is expected.