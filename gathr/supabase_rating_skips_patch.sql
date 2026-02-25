-- Allow users to skip rating specific participants for an event.
create table if not exists public.event_rating_skips (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id bigint not null references public.events(id) on delete cascade,
  skipper_name text not null,
  skipped_name text not null,
  unique (event_id, skipper_name, skipped_name)
);

alter table public.event_rating_skips enable row level security;

drop policy if exists "event_rating_skips_all_dev" on public.event_rating_skips;
create policy "event_rating_skips_all_dev" on public.event_rating_skips
for all using (true) with check (true);
