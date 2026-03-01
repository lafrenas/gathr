-- Event lifecycle reliability patch
-- Adds explicit status machine + timestamp markers + transition guard + idempotent sync helper.

alter table public.events
  add column if not exists status text not null default 'published' check (status in ('draft','published','ongoing','ended','archived')),
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Transition guard (prevents invalid jumps)
create or replace function public.enforce_event_status_transition()
returns trigger
language plpgsql
as $$
declare
  prev text;
  nxt text;
begin
  prev := coalesce(old.status, 'published');
  nxt := coalesce(new.status, prev);

  if tg_op = 'INSERT' then
    return new;
  end if;

  if prev = nxt then
    return new;
  end if;

  if prev = 'draft' and nxt not in ('published','archived') then
    raise exception 'invalid event transition: % -> %', prev, nxt;
  end if;

  if prev = 'published' and nxt not in ('ongoing','ended','archived') then
    raise exception 'invalid event transition: % -> %', prev, nxt;
  end if;

  if prev = 'ongoing' and nxt not in ('ended','archived') then
    raise exception 'invalid event transition: % -> %', prev, nxt;
  end if;

  if prev = 'ended' and nxt not in ('archived') then
    raise exception 'invalid event transition: % -> %', prev, nxt;
  end if;

  if prev = 'archived' then
    raise exception 'invalid event transition: archived is terminal';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_event_status_transition on public.events;
create trigger trg_enforce_event_status_transition
before update on public.events
for each row execute function public.enforce_event_status_transition();

-- Timestamp stamping helper
create or replace function public.stamp_event_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'ongoing' and new.started_at is null then
    new.started_at := now();
  end if;

  if new.status = 'ended' and new.ended_at is null then
    new.ended_at := now();
  end if;

  if new.status = 'archived' and new.archived_at is null then
    new.archived_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_stamp_event_status_timestamps on public.events;
create trigger trg_stamp_event_status_timestamps
before insert or update on public.events
for each row execute function public.stamp_event_status_timestamps();

-- Idempotent sync job helper (safe to run repeatedly)
create or replace function public.sync_event_statuses()
returns integer
language plpgsql
as $$
declare
  v_count int := 0;
begin
  -- published -> ended when exact_time has passed
  update public.events e
  set status = 'ended',
      ended_at = coalesce(e.ended_at, now())
  where e.status in ('published','ongoing')
    and nullif(trim(e.exact_time), '') is not null
    and e.exact_time::timestamptz <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;