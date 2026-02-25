-- Event capacity: required number of people for each event.
alter table public.events
  add column if not exists required_people integer not null default 4;
