-- Optional moderator-visible details for user reports.
alter table public.user_reports
  add column if not exists details text;
