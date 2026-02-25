-- Basic user profiles for onboarding + identity.
create table if not exists public.user_profiles (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  display_name text not null unique,
  full_name text,
  gender text,
  age_group text,
  based_in text,
  interests_csv text,
  about_me text
);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_all_dev" on public.user_profiles;
create policy "user_profiles_all_dev" on public.user_profiles
for all using (true) with check (true);
