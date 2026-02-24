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

create table if not exists public.join_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id bigint not null references public.events(id) on delete cascade,
  requester_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  unique (event_id, requester_name)
);

alter table public.events enable row level security;
alter table public.join_requests enable row level security;

-- MVP policies (open). tighten after auth is added.
drop policy if exists "events_read_all" on public.events;
create policy "events_read_all" on public.events
for select using (true);

drop policy if exists "events_insert_all" on public.events;
create policy "events_insert_all" on public.events
for insert with check (true);

drop policy if exists "join_requests_read_all" on public.join_requests;
create policy "join_requests_read_all" on public.join_requests
for select using (true);

drop policy if exists "join_requests_insert_all" on public.join_requests;
create policy "join_requests_insert_all" on public.join_requests
for insert with check (true);

drop policy if exists "join_requests_update_all" on public.join_requests;
create policy "join_requests_update_all" on public.join_requests
for update using (true) with check (true);
