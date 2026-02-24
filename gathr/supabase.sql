create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  title text not null,
  category text not null,
  area text not null,
  exact_location text not null,
  exact_time text not null,
  host_name text not null
);

alter table public.events enable row level security;

-- MVP policy (open read/write). tighten this after auth is added.
drop policy if exists "events_read_all" on public.events;
create policy "events_read_all" on public.events
for select using (true);

drop policy if exists "events_insert_all" on public.events;
create policy "events_insert_all" on public.events
for insert with check (true);
