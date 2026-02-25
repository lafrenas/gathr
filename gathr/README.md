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
npx expo start --tunnel -c
```

## Backend patches (Supabase SQL)
- Base schema: `supabase.sql`
- Ratings table patch: `supabase_ratings_patch.sql`
- Safety enforcement patch: `supabase_safety_enforcement_patch.sql`
- Ratings-after-event incremental patch: `supabase_ratings_after_event_patch.sql`
