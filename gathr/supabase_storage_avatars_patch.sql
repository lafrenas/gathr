-- Create public avatars bucket for profile photos.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read access to avatar files.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
for select
using (bucket_id = 'avatars');

-- Dev-friendly write/update/delete for avatar files.
drop policy if exists "avatars_dev_insert" on storage.objects;
create policy "avatars_dev_insert" on storage.objects
for insert
with check (bucket_id = 'avatars');

drop policy if exists "avatars_dev_update" on storage.objects;
create policy "avatars_dev_update" on storage.objects
for update
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

drop policy if exists "avatars_dev_delete" on storage.objects;
create policy "avatars_dev_delete" on storage.objects
for delete
using (bucket_id = 'avatars');