-- Event-level activity quality ratings (separate from person ratings)
create table if not exists public.event_activity_ratings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id bigint not null references public.events(id) on delete cascade,
  rater_name text not null,
  activity_score integer not null check (activity_score between 1 and 5),
  comment text,
  unique (event_id, rater_name)
);

alter table public.event_activity_ratings enable row level security;

drop policy if exists "event_activity_ratings_all_dev" on public.event_activity_ratings;
create policy "event_activity_ratings_all_dev" on public.event_activity_ratings
for all using (true) with check (true);
