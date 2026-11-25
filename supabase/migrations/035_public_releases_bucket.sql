-- ============================================================
-- Coliflor — Migration v035: Public Releases Bucket for Mobile APK & IPA
-- ============================================================
-- Creates a public storage bucket for downloading app installers (APK & IPA)
-- with up to 250MB file size limit and no MIME type restrictions.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('releases', 'releases', true, 262144000, null)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 262144000,
    allowed_mime_types = null;

-- Allow public read access to anyone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'releases_public_read' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "releases_public_read" ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'releases');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'releases_anon_upload' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "releases_anon_upload" ON storage.objects
      FOR INSERT TO anon, authenticated
      WITH CHECK (bucket_id = 'releases');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'releases_anon_update' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "releases_anon_update" ON storage.objects
      FOR UPDATE TO anon, authenticated
      USING (bucket_id = 'releases');
  END IF;
END $$;
