-- Extend user_profiles with onboarding fields.
alter table public.user_profiles
  add column if not exists full_name text,
  add column if not exists gender text,
  add column if not exists age_group text,
  add column if not exists based_in text,
  add column if not exists interests_csv text;
