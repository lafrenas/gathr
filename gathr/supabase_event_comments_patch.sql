-- Event comment thread (MVP)
create table if not exists public.event_comments (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id bigint not null references public.events(id) on delete cascade,
  author_name text not null,
  body text not null
);

alter table public.event_comments enable row level security;

drop policy if exists "event_comments_all_dev" on public.event_comments;
create policy "event_comments_all_dev" on public.event_comments
for all using (true) with check (true);
