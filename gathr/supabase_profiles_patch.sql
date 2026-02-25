-- Basic user profiles for About Me and display identity.
create table if not exists public.user_profiles (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  display_name text not null unique,
  about_me text
);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_all_dev" on public.user_profiles;
create policy "user_profiles_all_dev" on public.user_profiles
for all using (true) with check (true);
