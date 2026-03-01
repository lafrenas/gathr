-- Ratings integrity + anti-gaming patch

-- 1) Ensure created_at exists and immutable audit baseline is available
alter table public.event_ratings
  add column if not exists created_at timestamptz not null default now();

-- 2) Rating disputes table
create table if not exists public.rating_disputes (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  rating_id bigint not null references public.event_ratings(id) on delete cascade,
  event_id bigint not null references public.events(id) on delete cascade,
  raised_by text not null,
  target_user text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected'))
);

alter table public.rating_disputes enable row level security;

drop policy if exists "rating_disputes_all_dev" on public.rating_disputes;
create policy "rating_disputes_all_dev"
on public.rating_disputes
for all
using (true)
with check (true);

-- 3) Edit window lock: ratings are editable only for 24h from creation
create or replace function public.enforce_rating_edit_window()
returns trigger
language plpgsql
as $$
begin
  if old.created_at < now() - interval '24 hours' then
    raise exception 'rating edit window expired (24h)';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_rating_edit_window on public.event_ratings;
create trigger trg_enforce_rating_edit_window
before update on public.event_ratings
for each row execute function public.enforce_rating_edit_window();

-- 4) Lock rating updates while an open dispute exists for that rating
create or replace function public.enforce_no_update_during_dispute()
returns trigger
language plpgsql
as $$
declare
  v_open_count int;
begin
  select count(*) into v_open_count
  from public.rating_disputes d
  where d.rating_id = old.id
    and d.status in ('open', 'reviewing');

  if v_open_count > 0 then
    raise exception 'rating locked while dispute is open';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_no_update_during_dispute on public.event_ratings;
create trigger trg_enforce_no_update_during_dispute
before update on public.event_ratings
for each row execute function public.enforce_no_update_during_dispute();

-- 5) Backfill helper: suspicious rating pairs with high-frequency rewrites
create or replace view public.rating_integrity_flags as
select
  r.event_id,
  r.rater_name,
  r.rated_name,
  count(*) as rating_rows,
  min(r.created_at) as first_seen,
  max(r.created_at) as last_seen
from public.event_ratings r
group by r.event_id, r.rater_name, r.rated_name
having count(*) > 1;
