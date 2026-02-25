-- Enforce: ratings are allowed only after event exact_time has passed.
-- NOTE: this expects events.exact_time to be a Postgres-parseable timestamp string (ISO-8601 recommended).

drop policy if exists "event_ratings_insert_approved_only_dev" on public.event_ratings;
drop policy if exists "event_ratings_update_approved_only_dev" on public.event_ratings;

create policy "event_ratings_insert_approved_after_event_dev" on public.event_ratings
for insert with check (
  exists (
    select 1
    from public.events e
    join public.join_requests jr on jr.event_id = e.id
    where e.id = event_ratings.event_id
      and nullif(trim(e.exact_time), '') is not null
      and e.exact_time::timestamptz <= now()
      and (
        (jr.requester_name = event_ratings.rater_name and jr.status = 'approved' and e.host_name = event_ratings.rated_name)
        or
        (e.host_name = event_ratings.rater_name and jr.requester_name = event_ratings.rated_name and jr.status = 'approved')
      )
  )
);

create policy "event_ratings_update_approved_after_event_dev" on public.event_ratings
for update using (
  exists (
    select 1
    from public.events e
    join public.join_requests jr on jr.event_id = e.id
    where e.id = event_ratings.event_id
      and nullif(trim(e.exact_time), '') is not null
      and e.exact_time::timestamptz <= now()
      and (
        (jr.requester_name = event_ratings.rater_name and jr.status = 'approved' and e.host_name = event_ratings.rated_name)
        or
        (e.host_name = event_ratings.rater_name and jr.requester_name = event_ratings.rated_name and jr.status = 'approved')
      )
  )
) with check (
  exists (
    select 1
    from public.events e
    join public.join_requests jr on jr.event_id = e.id
    where e.id = event_ratings.event_id
      and nullif(trim(e.exact_time), '') is not null
      and e.exact_time::timestamptz <= now()
      and (
        (jr.requester_name = event_ratings.rater_name and jr.status = 'approved' and e.host_name = event_ratings.rated_name)
        or
        (e.host_name = event_ratings.rater_name and jr.requester_name = event_ratings.rated_name and jr.status = 'approved')
      )
  )
);
