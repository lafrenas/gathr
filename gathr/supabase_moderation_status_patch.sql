-- Admin moderation statuses for reported users.
create table if not exists public.user_moderation_status (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_name text not null unique,
  status text not null default 'watchlist' check (status in ('watchlist', 'reviewed', 'clear')),
  note text
);

alter table public.user_moderation_status enable row level security;

drop policy if exists "user_moderation_status_all_dev" on public.user_moderation_status;
create policy "user_moderation_status_all_dev" on public.user_moderation_status
for all using (true) with check (true);
