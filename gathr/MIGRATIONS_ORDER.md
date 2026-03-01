# Gathr Migration Order (Private Beta)

Open in Notepad:
notepad C:\Users\openclaw\.openclaw\workspace\gathr\MIGRATIONS_ORDER.md

Apply in this order:
1. `supabase.sql`
2. `supabase_safety_enforcement_patch.sql`
3. `supabase_ratings_after_event_patch.sql`
4. `supabase_trust_safety_hardening_patch.sql`
5. `supabase_ratings_integrity_patch.sql`
6. `supabase_event_lifecycle_patch.sql`

Then optional test scripts:
- `TEST_RATINGS_INTEGRITY_V2.sql`
- `TEST_EVENT_LIFECYCLE.sql`

Then optional seed:
- `BETA_SEED_DATA.sql`

Rollback note:
- Keep DB backup before steps 4-6.
- If needed, revert app commits and restore DB snapshot.
