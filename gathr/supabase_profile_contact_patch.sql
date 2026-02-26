-- Add contact fields used by profile verification scaffold.
alter table public.user_profiles
  add column if not exists phone text,
  add column if not exists email text;