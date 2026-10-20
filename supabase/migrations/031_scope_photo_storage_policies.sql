-- The photos bucket is private, but its former policies allowed every
-- authenticated user to read, replace, or delete every couple's files.
-- Paths used by the app are <couple>/<date>/<user>.jpg and
-- <couple>/hero_<uuid>.<extension>.
BEGIN;

DROP POLICY IF EXISTS "Storage Photo Selects" ON storage.objects;
DROP POLICY IF EXISTS "Storage Photo Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Storage Photo Updates" ON storage.objects;
DROP POLICY IF EXISTS "Storage Photo Deletes" ON storage.objects;

CREATE POLICY "Storage Photo Selects" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Storage Photo Uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
    AND (
      ((storage.foldername(name))[2] IS NULL AND storage.filename(name) LIKE 'hero_%')
      OR storage.filename(name) = (SELECT auth.uid())::text || '.jpg'
    )
  );

CREATE POLICY "Storage Photo Updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
    AND (
      ((storage.foldername(name))[2] IS NULL AND storage.filename(name) LIKE 'hero_%')
      OR storage.filename(name) = (SELECT auth.uid())::text || '.jpg'
    )
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
    AND (
      ((storage.foldername(name))[2] IS NULL AND storage.filename(name) LIKE 'hero_%')
      OR storage.filename(name) = (SELECT auth.uid())::text || '.jpg'
    )
  );

CREATE POLICY "Storage Photo Deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
    AND (
      ((storage.foldername(name))[2] IS NULL AND storage.filename(name) LIKE 'hero_%')
      OR storage.filename(name) = (SELECT auth.uid())::text || '.jpg'
    )
  );

COMMIT;
