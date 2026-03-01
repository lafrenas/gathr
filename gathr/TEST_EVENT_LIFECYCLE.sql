-- Gathr Event Lifecycle Test
-- Run after: supabase_event_lifecycle_patch.sql
-- event_id = 87 (change if needed)

-- SECTION A: check current state
select id, title, status, exact_time, started_at, ended_at, archived_at
from public.events
where id = 87;

-- SECTION B: valid transition published -> ongoing (should pass)
update public.events
set status = 'ongoing'
where id = 87;

-- SECTION C: valid transition ongoing -> ended (should pass)
update public.events
set status = 'ended'
where id = 87;

-- SECTION D: invalid transition ended -> published (should fail)
update public.events
set status = 'published'
where id = 87;

-- SECTION E: valid transition ended -> archived (should pass)
update public.events
set status = 'archived'
where id = 87;

-- SECTION F: terminal check archived -> ended (should fail)
update public.events
set status = 'ended'
where id = 87;

-- SECTION G: idempotent sync helper
select public.sync_event_statuses() as updated_rows;

-- SECTION H: final state
select id, title, status, exact_time, started_at, ended_at, archived_at
from public.events
where id = 87;