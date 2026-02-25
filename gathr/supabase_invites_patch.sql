-- Track invite source + invite acceptance flow.
alter table public.join_requests
  add column if not exists invite_source text not null default 'self',
  add column if not exists invited_by_name text,
  add column if not exists invite_response text not null default 'accepted';

alter table public.join_requests
  drop constraint if exists join_requests_invite_source_check;

alter table public.join_requests
  add constraint join_requests_invite_source_check check (invite_source in ('self', 'host', 'member'));

alter table public.join_requests
  drop constraint if exists join_requests_invite_response_check;

alter table public.join_requests
  add constraint join_requests_invite_response_check check (invite_response in ('pending', 'accepted', 'declined'));
