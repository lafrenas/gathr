-- Optional overflow capacity for events (allow more than required_people)
alter table public.events
  add column if not exists allow_overflow boolean not null default false;
