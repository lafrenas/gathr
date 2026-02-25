-- Track whether join request came from user request or host invite.
alter table public.join_requests
  add column if not exists invite_source text not null default 'self';

alter table public.join_requests
  drop constraint if exists join_requests_invite_source_check;

alter table public.join_requests
  add constraint join_requests_invite_source_check check (invite_source in ('self', 'host'));
