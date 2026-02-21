-- Run in the Supabase SQL editor to add image support to announcements.

-- 1. Add image_url column
alter table public.announcements
  add column if not exists image_url text;

-- 2. Create a public storage bucket for announcement images
insert into storage.buckets (id, name, public)
values ('announcement-images', 'announcement-images', true)
on conflict (id) do nothing;

-- 3. Allow anyone to read images (they're public)
create policy "public read announcement images"
  on storage.objects for select
  using (bucket_id = 'announcement-images');

-- 4. Allow staff to upload / delete images
create policy "staff upload announcement images"
  on storage.objects for insert
  with check (
    bucket_id = 'announcement-images'
    and exists (
      select 1 from public.staff_users
      where user_id = auth.uid()
    )
  );

create policy "staff delete announcement images"
  on storage.objects for delete
  using (
    bucket_id = 'announcement-images'
    and exists (
      select 1 from public.staff_users
      where user_id = auth.uid()
    )
  );
