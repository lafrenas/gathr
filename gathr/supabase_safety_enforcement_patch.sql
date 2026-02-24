-- Safety + moderation tables
create table if not exists public.user_reports (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  reporter_name text not null,
  reported_name text not null,
  reason text not null default 'General safety concern'
);

create table if not exists public.user_blocks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  blocker_name text not null,
  blocked_name text not null,
  unique (blocker_name, blocked_name)
);

alter table public.user_reports enable row level security;
alter table public.user_blocks enable row level security;

-- Dev policies for report/block
 drop policy if exists "user_reports_all_dev" on public.user_reports;
 create policy "user_reports_all_dev" on public.user_reports for all using (true) with check (true);

 drop policy if exists "user_blocks_all_dev" on public.user_blocks;
 create policy "user_blocks_all_dev" on public.user_blocks for all using (true) with check (true);

-- Hard enforcement: rating insert/update only if rater had approved join on that event OR rater is host and rated person had approved join.
drop policy if exists "event_ratings_insert_all_dev" on public.event_ratings;
drop policy if exists "event_ratings_update_all_dev" on public.event_ratings;

create policy "event_ratings_insert_approved_only_dev" on public.event_ratings
for insert with check (
  exists (
    select 1
    from public.events e
    join public.join_requests jr on jr.event_id = e.id
    where e.id = event_ratings.event_id
      and (
        (jr.requester_name = event_ratings.rater_name and jr.status = 'approved' and e.host_name = event_ratings.rated_name)
        or
        (e.host_name = event_ratings.rater_name and jr.requester_name = event_ratings.rated_name and jr.status = 'approved')
      )
  )
);

create policy "event_ratings_update_approved_only_dev" on public.event_ratings
for update using (
  exists (
    select 1
    from public.events e
    join public.join_requests jr on jr.event_id = e.id
    where e.id = event_ratings.event_id
      and (
        (jr.requester_name = event_ratings.rater_name and jr.status = 'approved' and e.host_name = event_ratings.rated_name)
        or
        (e.host_name = event_ratings.rater_name and jr.requester_name = event_ratings.rated_name and jr.status = 'approved')
      )
  )
) with check (
  exists (
    select 1
    from public.events e
    join public.join_requests jr on jr.event_id = e.id
    where e.id = event_ratings.event_id
      and (
        (jr.requester_name = event_ratings.rater_name and jr.status = 'approved' and e.host_name = event_ratings.rated_name)
        or
        (e.host_name = event_ratings.rater_name and jr.requester_name = event_ratings.rated_name and jr.status = 'approved')
      )
  )
);
