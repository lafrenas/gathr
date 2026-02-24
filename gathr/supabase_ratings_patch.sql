create table if not exists public.event_ratings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id bigint not null references public.events(id) on delete cascade,
  rater_name text not null,
  rated_name text not null,
  skill int not null check (skill between 1 and 5),
  friendliness int not null check (friendliness between 1 and 5),
  reliability int not null check (reliability between 1 and 5),
  comment text,
  unique(event_id, rater_name, rated_name)
);

alter table public.event_ratings enable row level security;

drop policy if exists "event_ratings_read_all_dev" on public.event_ratings;
drop policy if exists "event_ratings_insert_all_dev" on public.event_ratings;

create policy "event_ratings_read_all_dev" on public.event_ratings
for select using (true);

create policy "event_ratings_insert_all_dev" on public.event_ratings
for insert with check (true);
