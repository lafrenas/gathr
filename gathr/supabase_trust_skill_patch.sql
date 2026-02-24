-- Split ratings into trust + skill dimensions
alter table public.event_ratings
  add column if not exists communication int check (communication between 1 and 5),
  add column if not exists boundary_respect int check (boundary_respect between 1 and 5),
  add column if not exists skill_context text;

-- Backfill existing rows safely
update public.event_ratings
set communication = coalesce(communication, friendliness),
    boundary_respect = coalesce(boundary_respect, reliability),
    skill_context = coalesce(skill_context, 'General')
where communication is null or boundary_respect is null or skill_context is null;

alter table public.event_ratings
  alter column communication set not null,
  alter column boundary_respect set not null,
  alter column skill_context set not null;
