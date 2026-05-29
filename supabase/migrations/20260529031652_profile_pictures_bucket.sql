-- =============================================================
-- kostly · profile_pictures_bucket.sql
-- Adds user avatar paths and a private Storage bucket for profile
-- pictures uploaded by the mobile app.
-- =============================================================

alter table public.users
  add column if not exists avatar_path text;

alter table public.users
  drop constraint if exists users_avatar_path_matches_user;

alter table public.users
  add constraint users_avatar_path_matches_user
  check (
    avatar_path is null
    or avatar_path like ('profiles/' || id::text || '/%')
  );

comment on column public.users.avatar_path is
  'Supabase Storage object path in the profile-pictures bucket.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "user_upload_own_profile_picture" on storage.objects;
drop policy if exists "user_read_own_profile_picture" on storage.objects;
drop policy if exists "user_update_own_profile_picture" on storage.objects;
drop policy if exists "user_delete_own_profile_picture" on storage.objects;
drop policy if exists "owner_read_profile_pictures" on storage.objects;

create policy "user_upload_own_profile_picture"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-pictures'
    and (private.is_owner() or private.is_active_tenant())
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "user_read_own_profile_picture"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-pictures'
    and (private.is_owner() or private.is_active_tenant())
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "user_update_own_profile_picture"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-pictures'
    and (private.is_owner() or private.is_active_tenant())
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-pictures'
    and (private.is_owner() or private.is_active_tenant())
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "user_delete_own_profile_picture"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-pictures'
    and (private.is_owner() or private.is_active_tenant())
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "owner_read_profile_pictures"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-pictures'
    and private.is_owner()
  );
