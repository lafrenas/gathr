-- Gathr private beta seed data
-- Safe-ish dev seed. Adjust names/event ids as needed.

-- 1) sample events
insert into public.events (title, description, category, min_people, max_people, no_max, area, exact_location, exact_lat, exact_lng, exact_time, status, host_name)
values
('Beta Football Session', 'Friendly football run', 'Sports:Football', 6, 14, false, 'London', 'Hyde Park, London', 51.5073, -0.1657, now() + interval '2 days', 'published', '1'),
('Beta Coffee Meetup', 'Social catch-up', 'Social:Coffee', 2, 8, false, 'London', 'South Bank, London', 51.5050, -0.1160, now() + interval '1 day', 'published', '2'),
('Beta Online Valorant', '5v5 custom lobby', 'Online:Valorant', 5, 10, false, 'Online', 'Online session', null, null, now() + interval '3 days', 'published', '3')
on conflict do nothing;

-- 2) join requests (mix approved/pending)
insert into public.join_requests (event_id, requester_name, status, invite_source, invite_response)
select e.id, '2', 'approved', 'self', 'accepted' from public.events e where e.title = 'Beta Football Session'
on conflict do nothing;

insert into public.join_requests (event_id, requester_name, status, invite_source, invite_response)
select e.id, '3', 'pending', 'self', 'accepted' from public.events e where e.title = 'Beta Football Session'
on conflict do nothing;

insert into public.join_requests (event_id, requester_name, status, invite_source, invite_response)
select e.id, '1', 'approved', 'self', 'accepted' from public.events e where e.title = 'Beta Coffee Meetup'
on conflict do nothing;

-- 3) sample report + block pair for moderation visibility
insert into public.user_reports (reporter_name, reported_name, reason, details)
values ('1','4','Harassment','Repeated abusive messages during planning and event chat.')
on conflict do nothing;

insert into public.user_blocks (blocker_name, blocked_name)
values ('1','4')
on conflict (blocker_name, blocked_name) do nothing;

-- 4) sample ended event for ratings/dispute tests
insert into public.events (title, description, category, min_people, max_people, no_max, area, exact_location, exact_lat, exact_lng, exact_time, status, host_name, ended_at)
values ('Beta Ended Basketball', 'Ended fixture for ratings test', 'Sports:Basketball', 4, 10, false, 'London', 'Regent\'s Park, London', 51.5313, -0.1569, now() - interval '1 day', 'ended', '1', now() - interval '1 day')
on conflict do nothing;

insert into public.join_requests (event_id, requester_name, status, invite_source, invite_response)
select e.id, '2', 'approved', 'self', 'accepted' from public.events e where e.title = 'Beta Ended Basketball'
on conflict do nothing;

-- 5) sample rating
insert into public.event_ratings (event_id, rater_name, rated_name, skill, friendliness, reliability, communication, boundary_respect, skill_context, comment)
select e.id, '2', '1', 4, 4, 5, 4, 5, 'Basketball', 'Good host and clear communication.'
from public.events e where e.title = 'Beta Ended Basketball'
on conflict (event_id, rater_name, rated_name)
do update set
  skill = excluded.skill,
  friendliness = excluded.friendliness,
  reliability = excluded.reliability,
  communication = excluded.communication,
  boundary_respect = excluded.boundary_respect,
  skill_context = excluded.skill_context,
  comment = excluded.comment;

-- 6) verify snapshot
select
  (select count(*) from public.events) as events_count,
  (select count(*) from public.join_requests) as requests_count,
  (select count(*) from public.user_reports) as reports_count,
  (select count(*) from public.user_blocks) as blocks_count,
  (select count(*) from public.event_ratings) as ratings_count;
