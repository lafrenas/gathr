# gathr

Community activity app (in progress) built with Expo + Supabase.

## Project docs
- **Roadmap:** [ROADMAP.md](./ROADMAP.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Task list:** [TODO.md](./TODO.md)

## Run locally
```powershell
cd C:\Users\openclaw\.openclaw\workspace\gathr
npm install
npx expo start --web -c --port 8083
```

## What shipped today (2026-02-26)
- Moderation auto-flagging (medium/high/critical) + clearer moderation dashboard UI.
- Real avatar upload/preview via Supabase Storage.
- Debounced profile auto-save + retry path.
- Registration gate: users must register before using core app flows.
- OTP-style verification UX for email/phone (phone requires provider config).
- Password + confirm password with strength rules + show/hide toggles.

## Backend patches (Supabase SQL)
- Base schema: `supabase.sql`
- Moderation/safety patches: `supabase_safety_enforcement_patch.sql`, `supabase_moderation_status_patch.sql`
- Profile patches: `supabase_profile_verification_patch.sql`, `supabase_profile_contact_patch.sql`
- Storage patch (avatars): `supabase_storage_avatars_patch.sql`
- Ratings patches: `supabase_ratings_patch.sql`, `supabase_ratings_after_event_patch.sql`, `supabase_activity_ratings_patch.sql`

## Notes for tomorrow
- Convert registration panel + modal into a cleaner full-screen onboarding wizard.
- Move verification fully into registration (profile page should only show statuses/actions).
- Wire real SMS provider in Supabase Auth for phone OTP (currently unsupported provider error).
- Fix email magic-link return handling (OTP works better today than magic link flow).
