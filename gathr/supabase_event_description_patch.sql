-- Add optional description field for event details shown in feed.
alter table public.events
  add column if not exists description text;
