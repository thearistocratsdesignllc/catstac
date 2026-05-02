-- ============================================================
-- Catstac — Direct browser uploads to the catestants bucket
-- Run this once in the Supabase SQL editor after 002_storage_buckets.sql.
-- ============================================================
--
-- Why this exists:
--   /submit used to stream the raw photo bytes through
--   /api/submit, which hit Vercel's 4.5MB request body limit.
--   The browser now uploads directly to Supabase Storage with
--   the anon (cookie-authenticated) client and sends just the
--   resulting URL + path to /api/submit.
--
-- The policy below scopes uploads to a user's own folder so a
-- signed-in user cannot overwrite or pollute someone else's
-- objects. Path convention: <user_id>/<catestant_id>.<ext>.
--
-- ============================================================

drop policy if exists "Authenticated users can upload to own folder" on storage.objects;
create policy "Authenticated users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'catestants'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
