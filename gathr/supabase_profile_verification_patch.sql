-- Persist onboarding verification placeholders on user_profiles.
alter table public.user_profiles
  add column if not exists avatar_url text,
  add column if not exists photo_added boolean not null default false,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists email_verified boolean not null default false;