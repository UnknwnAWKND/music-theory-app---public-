-- Profile/account UX support only. No learning-engine or curriculum changes.
-- Keep authentication email/password in Supabase Auth; user_profiles stores metadata only.

alter table public.user_profiles
  add column if not exists avatar_path text;

alter table public.user_profiles
  drop constraint if exists user_profiles_avatar_path_owner_check;

alter table public.user_profiles
  add constraint user_profiles_avatar_path_owner_check
  check (
    avatar_path is null
    or (
      char_length(avatar_path) between 1 and 512
      and split_part(avatar_path, '/', 1) = user_id::text
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Private bucket: every object path must begin with the authenticated user's id.
drop policy if exists "Avatar owners can read" on storage.objects;
create policy "Avatar owners can read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Avatar owners can upload" on storage.objects;
create policy "Avatar owners can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Avatar owners can update" on storage.objects;
create policy "Avatar owners can update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "Avatar owners can delete" on storage.objects;
create policy "Avatar owners can delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);
