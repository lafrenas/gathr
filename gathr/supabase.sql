create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  title text not null,
  description text,
  category text not null,
  required_people integer not null default 4,
  allow_overflow boolean not null default false,
  area text not null,
  exact_location text not null,
  exact_lat double precision,
  exact_lng double precision,
  exact_time text not null,
  host_name text not null,
  host_user_id uuid references auth.users(id)
);

alter table public.events
  add column if not exists host_user_id uuid references auth.users(id);

create table if not exists public.join_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id bigint not null references public.events(id) on delete cascade,
  requester_name text not null,
  requester_user_id uuid references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  invite_source text not null default 'self' check (invite_source in ('self', 'host', 'member')),
  invited_by_name text,
  invite_response text not null default 'accepted' check (invite_response in ('pending', 'accepted', 'declined')),
  unique (event_id, requester_name)
);

alter table public.join_requests
  add column if not exists requester_user_id uuid references auth.users(id);

-- replace old unique key with secure per-user unique key
alter table public.join_requests drop constraint if exists join_requests_event_id_requester_name_key;
alter table public.join_requests add constraint join_requests_event_id_requester_user_id_key unique (event_id, requester_user_id);

alter table public.events enable row level security;
alter table public.join_requests enable row level security;

-- reset policies
DROP POLICY IF EXISTS "events_read_all" ON public.events;
DROP POLICY IF EXISTS "events_insert_all" ON public.events;
DROP POLICY IF EXISTS "join_requests_read_all" ON public.join_requests;
DROP POLICY IF EXISTS "join_requests_insert_all" ON public.join_requests;
DROP POLICY IF EXISTS "join_requests_update_all" ON public.join_requests;

-- authenticated users can read events
create policy "events_read_auth" on public.events
for select to authenticated using (true);

-- only signed-in user can create own events
create policy "events_insert_own" on public.events
for insert to authenticated with check (auth.uid() = host_user_id);

-- authenticated users can read requests
create policy "join_requests_read_auth" on public.join_requests
for select to authenticated using (true);

-- user can create only their own requests
create policy "join_requests_insert_own" on public.join_requests
for insert to authenticated with check (auth.uid() = requester_user_id);

-- only event host can approve/reject
create policy "join_requests_update_host_only" on public.join_requests
for update to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = join_requests.event_id
      and e.host_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e
    where e.id = join_requests.event_id
      and e.host_user_id = auth.uid()
  )
);
