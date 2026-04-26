-- ctrl-briefings bucket: explicit create + RLS policies.
--
-- This bucket has been created on-the-fly by synthesize-briefing's
-- supabase.storage.createBucket() call (with public: false). That works in
-- happy-path but is not auditable: there is no SQL migration documenting
-- the bucket's existence, intended privacy, or its access rules. If the
-- bucket is ever recreated (DR, project clone, accidental drop) it could
-- default to public — which would publicly expose every user's audio
-- briefings (containing the leader's voice, name, company, strategic
-- decisions). This migration codifies the contract.
--
-- Pattern mirrors `documents` bucket policies in
-- 20250128000002_create_documents_storage_policies.sql.

-- 1. Ensure the bucket exists, private, with a 10MB per-object cap.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ctrl-briefings',
  'ctrl-briefings',
  false,
  10485760,                 -- 10 MB
  ARRAY['audio/mpeg']::text[]
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['audio/mpeg']::text[];

-- 2. Path convention: <user_id>/<date>-<short_id>.mp3
--    Folder-based isolation: a user can only read/write/delete objects
--    whose first path segment matches their auth.uid().

DROP POLICY IF EXISTS "Users can upload their own briefing audio"      ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own briefing audio"        ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own briefing audio"      ON storage.objects;

CREATE POLICY "Users can upload their own briefing audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ctrl-briefings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own briefing audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ctrl-briefings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own briefing audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ctrl-briefings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note: the synthesize-briefing edge function uses the service-role key,
-- which bypasses these policies for its uploads / signed-URL generation —
-- that is intentional. Authenticated end-users can only ever interact with
-- their own folder; everyone else is shut out.

COMMENT ON POLICY "Users can read their own briefing audio" ON storage.objects IS
  'ctrl-briefings: folder-based isolation. First path segment must equal auth.uid().';
