-- Store precise event coordinates for exact pin and rough-radius rendering.
alter table public.events
  add column if not exists exact_lat double precision,
  add column if not exists exact_lng double precision;
