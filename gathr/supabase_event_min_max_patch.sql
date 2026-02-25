-- Capacity model v2: min + max + no_max toggle
alter table public.events
  add column if not exists min_people integer not null default 2,
  add column if not exists max_people integer,
  add column if not exists no_max boolean not null default false;
