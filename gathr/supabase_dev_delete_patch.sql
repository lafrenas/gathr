-- Allow deleting test data from app debug tools (DEV only)

drop policy if exists "events_delete_all_dev" on public.events;
create policy "events_delete_all_dev" on public.events
for delete using (true);

drop policy if exists "join_requests_delete_all_dev" on public.join_requests;
create policy "join_requests_delete_all_dev" on public.join_requests
for delete using (true);

drop policy if exists "event_ratings_delete_all_dev" on public.event_ratings;
create policy "event_ratings_delete_all_dev" on public.event_ratings
for delete using (true);
