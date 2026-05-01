-- ============================================================
-- Catstac — Storage buckets
-- Run this once in the Supabase SQL editor after 001_initial_schema.sql.
-- ============================================================
--
-- BUCKETS
--   catestants  — photos uploaded via /submit. Public read so
--                 anyone can render an <img src=public_url>.
--                 All writes go through the service role from
--                 app/api/submit/route.js.
--
-- ============================================================

insert into storage.buckets (id, name, public)
values ('catestants', 'catestants', true)
on conflict (id) do update set public = excluded.public;

-- storage.objects has RLS enabled by default in Supabase. We
-- want public read on the catestants bucket; writes are handled
-- exclusively by the service role (which bypasses RLS), so no
-- insert/update/delete policy is needed.

drop policy if exists "Public can read catestants photos" on storage.objects;
create policy "Public can read catestants photos"
  on storage.objects for select
  using (bucket_id = 'catestants');
