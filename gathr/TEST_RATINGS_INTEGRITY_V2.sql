-- Gathr Ratings Integrity Test Script (V2 - deterministic)
-- IMPORTANT:
-- 1) Run sections ONE BY ONE (highlight section and Run), not entire file at once.
-- 2) Some sections are expected to fail by design.
-- 3) event_id = 87, rater='2', rated='1'

-- =========================
-- SECTION A: RESET TEST STATE
-- =========================
-- Clears old disputes for this rating pair so you don't get stale open-locks.

delete from public.rating_disputes
where rating_id in (
  select id from public.event_ratings
  where event_id = 87
    and lower(trim(rater_name)) = '2'
    and lower(trim(rated_name)) = '1'
);

-- Recreate/refresh baseline rating.
insert into public.event_ratings (
  event_id, rater_name, rated_name,
  skill, friendliness, reliability, communication, boundary_respect,
  skill_context, comment
)
values (
  87, '2', '1',
  4, 4, 4, 4, 4,
  'General', 'Baseline rating for integrity test v2.'
)
on conflict (event_id, rater_name, rated_name)
do update set
  skill = excluded.skill,
  friendliness = excluded.friendliness,
  reliability = excluded.reliability,
  communication = excluded.communication,
  boundary_respect = excluded.boundary_respect,
  skill_context = excluded.skill_context,
  comment = excluded.comment,
  created_at = now();

select id, created_at, event_id, rater_name, rated_name, comment
from public.event_ratings
where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1';


-- =========================
-- SECTION B: OPEN DISPUTE
-- =========================
insert into public.rating_disputes (
  rating_id, event_id, raised_by, target_user, reason, status
)
select
  r.id,
  r.event_id,
  '1',
  r.rated_name,
  'Host disputes rating fairness/accuracy',
  'open'
from public.event_ratings r
where r.event_id = 87
  and lower(trim(r.rater_name)) = '2'
  and lower(trim(r.rated_name)) = '1'
limit 1;

select id, rating_id, status, created_at
from public.rating_disputes
where rating_id in (
  select id from public.event_ratings
  where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1'
)
order by id desc;


-- =========================
-- SECTION C: EXPECTED FAIL (DISPUTE LOCK)
-- =========================
-- This SHOULD fail with: rating locked while dispute is open
update public.event_ratings
set comment = 'Attempt edit during open dispute (expected fail).'
where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1';


-- =========================
-- SECTION D: RESOLVE + EXPECTED PASS
-- =========================
update public.rating_disputes
set status = 'resolved'
where rating_id in (
  select id from public.event_ratings
  where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1'
)
and status in ('open','reviewing');

update public.event_ratings
set comment = 'Edit after dispute resolved (expected pass).'
where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1';

select id, created_at, comment
from public.event_ratings
where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1';


-- =========================
-- SECTION E: FORCE 25H OLD + EXPECTED FAIL (24H LOCK)
-- =========================
update public.event_ratings
set created_at = now() - interval '25 hours'
where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1';

-- This SHOULD fail with: rating edit window expired (24h)
update public.event_ratings
set comment = 'Attempt edit older than 24h (expected fail).'
where event_id = 87 and lower(trim(rater_name))='2' and lower(trim(rated_name))='1';


-- =========================
-- SECTION F: OPTIONAL CHECK
-- =========================
select *
from public.rating_integrity_flags
order by last_seen desc
limit 50;
