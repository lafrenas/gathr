# Gathr Roadmap

## Current Status (Done)

### Frontend
- Event feed + create event
- Join request flow (request / approve / reject)
- Exact location/time hidden until approval
- Host profile card with trust/skill summary
- Multi-metric user rating form
- Report flow + reason picker
- Block/unblock + blocked hosts hidden from feed
- Event date->time picker (ISO timestamp output)
- Registration gate before core app actions
- Profile completion meter + autosave
- Avatar upload + avatar/initial chips across feed/invites/notifications
- Moderation dashboard severity grouping + visual badges

### Backend (Supabase)
- Tables: `events`, `join_requests`, `event_ratings`, `user_reports`, `user_blocks`, `user_profiles`
- RLS policies for read/write safety in dev mode
- Hard enforcement for ratings:
  - only approved attendee↔host pairs for the same event
  - only after event time has passed
- Profile/contact/verification columns added (`avatar_url`, `phone`, `email`, verified flags)
- Avatars storage bucket + policies patch added

---

## Roadmap Phases

## Phase A — Core UX + Discovery (High)
- [ ] Clear in-app project structure view (done / doing / todo)
- [ ] Searchable dropdown for activities (type + suggestions)
- [ ] Event description field on activity creation
- [ ] Profile "About me" field
- [ ] Search v1:
  - [ ] Free-text search bar
  - [ ] Category + location + radius
  - [ ] Location + radius only
  - [ ] Time filters (today / tomorrow / this week)
- [ ] Map browse view (rough area activity discovery)

## Phase B — Identity + Trust (High)
- [~] Registration fields:
  - [x] Gender (male/female)
  - [x] Age group (14 and under, 15–18, 19–25, 26–40, etc.)
  - [~] Phone (verification UI done; provider setup pending)
  - [~] Email (OTP flow implemented; magic-link return polish pending)
  - [x] Photo
  - [x] Full name
  - [x] Password + confirm + complexity validation
- [x] Location postcode autocomplete
- [x] Drop-a-pin precise map location
- [x] Host invites people
- [x] Members can request/invite attendance (host still approves)

## Phase C — Activity Model + Ratings (Medium)
- [ ] Required number of people per activity
- [ ] Activity-level ratings (rate the activity/event itself)
- [ ] Online activities (gaming etc.)
- [ ] Separate rankings per game (CS, LoL, etc.)
- [ ] Social activities: no skill-level requirement

## Phase D — Safety/Moderation Expansion (Medium)
- [ ] Report management dashboard
- [ ] Block/report history in user profile
- [ ] Auto-flagging thresholds for repeat reports

---

## Suggested Build Order (Sprints)

### Sprint 1
- Activity searchable dropdown
- Event description
- Profile About me
- Search v1 (text + basic filters)

### Sprint 2
- Registration profile fields + verification placeholders
- Postcode autocomplete
- Drop pin on map

### Sprint 3
- Host invites + member invite/request improvements
- Required people capacity logic

### Sprint 4
- Activity ratings
- Online game activities + per-game ranking
- Social/no-skill rule logic

### Sprint 5
- Moderation dashboard + refinements
