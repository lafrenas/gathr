-- Trust & Safety hardening patch
-- 1) Moderation audit log
-- 2) DB-side anti-spam limits for reports
-- 3) DB-side anti-thrash limits for block/unblock toggles

create table if not exists public.moderation_audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_name text not null,
  target_name text,
  action_type text not null,
  details jsonb
);

alter table public.moderation_audit_log enable row level security;

drop policy if exists "moderation_audit_log_all_dev" on public.moderation_audit_log;
create policy "moderation_audit_log_all_dev"
on public.moderation_audit_log
for all
using (true)
with check (true);

create or replace function public.log_moderation_action(
  p_actor text,
  p_target text,
  p_action text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.moderation_audit_log (actor_name, target_name, action_type, details)
  values (coalesce(nullif(trim(p_actor), ''), 'system'), nullif(trim(p_target), ''), p_action, coalesce(p_details, '{}'::jsonb));
end;
$$;

-- Report anti-spam limiter: max 3 reports / 10 minutes / reporter,
-- and max 1 report / 24h for the same reporter -> reported pair.
create or replace function public.enforce_report_rate_limits()
returns trigger
language plpgsql
as $$
declare
  v_recent_reporter_count int;
  v_recent_pair_count int;
begin
  select count(*) into v_recent_reporter_count
  from public.user_reports ur
  where lower(ur.reporter_name) = lower(new.reporter_name)
    and ur.created_at >= now() - interval '10 minutes';

  if v_recent_reporter_count >= 3 then
    raise exception 'rate limit: max 3 reports per 10 minutes';
  end if;

  select count(*) into v_recent_pair_count
  from public.user_reports ur
  where lower(ur.reporter_name) = lower(new.reporter_name)
    and lower(ur.reported_name) = lower(new.reported_name)
    and ur.created_at >= now() - interval '24 hours';

  if v_recent_pair_count >= 1 then
    raise exception 'duplicate report limit: same pair already reported in last 24h';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_report_rate_limits on public.user_reports;
create trigger trg_enforce_report_rate_limits
before insert on public.user_reports
for each row execute function public.enforce_report_rate_limits();

-- Block creation guard: user must have submitted a detailed report first.
create or replace function public.enforce_block_requires_report()
returns trigger
language plpgsql
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.user_reports ur
  where lower(ur.reporter_name) = lower(new.blocker_name)
    and lower(ur.reported_name) = lower(new.blocked_name)
    and coalesce(length(trim(ur.details)), 0) >= 20
    and ur.created_at >= now() - interval '30 days';

  if v_count < 1 then
    raise exception 'block requires prior detailed report';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_block_requires_report on public.user_blocks;
create trigger trg_enforce_block_requires_report
before insert on public.user_blocks
for each row execute function public.enforce_block_requires_report();

-- Block/unblock anti-thrash limiter: max 6 toggles / 10 minutes / actor-target pair.
create or replace function public.enforce_block_toggle_limits()
returns trigger
language plpgsql
as $$
declare
  v_actor text;
  v_target text;
  v_pair_changes int;
begin
  v_actor := case when tg_op = 'DELETE' then old.blocker_name else new.blocker_name end;
  v_target := case when tg_op = 'DELETE' then old.blocked_name else new.blocked_name end;

  select count(*) into v_pair_changes
  from public.moderation_audit_log l
  where lower(l.actor_name) = lower(v_actor)
    and lower(coalesce(l.target_name, '')) = lower(v_target)
    and l.action_type in ('block_user', 'unblock_user')
    and l.created_at >= now() - interval '10 minutes';

  if v_pair_changes >= 6 then
    raise exception 'rate limit: too many block/unblock changes for this user pair';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_enforce_block_toggle_limits_insert on public.user_blocks;
create trigger trg_enforce_block_toggle_limits_insert
before insert on public.user_blocks
for each row execute function public.enforce_block_toggle_limits();

drop trigger if exists trg_enforce_block_toggle_limits_delete on public.user_blocks;
create trigger trg_enforce_block_toggle_limits_delete
before delete on public.user_blocks
for each row execute function public.enforce_block_toggle_limits();

-- Auto audit logging triggers
create or replace function public.audit_user_reports()
returns trigger
language plpgsql
as $$
begin
  perform public.log_moderation_action(new.reporter_name, new.reported_name, 'report_user', jsonb_build_object(
    'reason', new.reason,
    'details', new.details
  ));
  return new;
end;
$$;

drop trigger if exists trg_audit_user_reports on public.user_reports;
create trigger trg_audit_user_reports
after insert on public.user_reports
for each row execute function public.audit_user_reports();

create or replace function public.audit_user_blocks()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_moderation_action(new.blocker_name, new.blocked_name, 'block_user', '{}'::jsonb);
    return new;
  end if;

  perform public.log_moderation_action(old.blocker_name, old.blocked_name, 'unblock_user', '{}'::jsonb);
  return old;
end;
$$;

drop trigger if exists trg_audit_user_blocks_insert on public.user_blocks;
create trigger trg_audit_user_blocks_insert
after insert on public.user_blocks
for each row execute function public.audit_user_blocks();

drop trigger if exists trg_audit_user_blocks_delete on public.user_blocks;
create trigger trg_audit_user_blocks_delete
after delete on public.user_blocks
for each row execute function public.audit_user_blocks();

create or replace function public.audit_moderation_status()
returns trigger
language plpgsql
as $$
begin
  perform public.log_moderation_action('admin', new.user_name, 'moderation_status_set', jsonb_build_object(
    'status', new.status,
    'note', new.note
  ));
  return new;
end;
$$;

drop trigger if exists trg_audit_moderation_status on public.user_moderation_status;
create trigger trg_audit_moderation_status
after insert or update on public.user_moderation_status
for each row execute function public.audit_moderation_status();