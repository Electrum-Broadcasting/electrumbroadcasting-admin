BEGIN;

-- Expand the platform asset registry with typed storage and provenance fields.
-- Existing columns and rows are unchanged; every new column is nullable.
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path   text,
  ADD COLUMN IF NOT EXISTS mime_type      text,
  ADD COLUMN IF NOT EXISTS source         text,
  ADD COLUMN IF NOT EXISTS source_url     text,
  ADD COLUMN IF NOT EXISTS attribution    text,
  ADD COLUMN IF NOT EXISTS license        text,
  ADD COLUMN IF NOT EXISTS rights_notes   text,
  ADD COLUMN IF NOT EXISTS uploaded_by    uuid;

-- uploaded_by is the Auth user ID, not admin_users.id.
-- SET NULL keeps the asset if the Auth user is deleted.
ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES auth.users (id) ON DELETE SET NULL;

-- A storage location is a complete bucket + path pair, or absent.
ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_storage_location_pair_chk
  CHECK ((storage_bucket IS NULL) = (storage_path IS NULL));

ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_storage_fields_nonblank_chk
  CHECK (
    (storage_bucket IS NULL OR pg_catalog.btrim(storage_bucket) <> '')
    AND (storage_path IS NULL OR pg_catalog.btrim(storage_path) <> '')
    AND (mime_type IS NULL OR pg_catalog.btrim(mime_type) <> '')
  );

-- Backfill storage location and MIME type from the metadata written by the
-- existing upload route. Only complete bucket + path pairs are copied.
UPDATE public.media_assets
SET storage_bucket = metadata->>'bucket',
    storage_path   = metadata->>'path'
WHERE storage_bucket IS NULL
  AND storage_path IS NULL
  AND pg_catalog.jsonb_typeof(metadata) = 'object'
  AND pg_catalog.btrim(COALESCE(metadata->>'bucket', '')) <> ''
  AND pg_catalog.btrim(COALESCE(metadata->>'path', '')) <> '';

UPDATE public.media_assets
SET mime_type = metadata->>'content_type'
WHERE mime_type IS NULL
  AND pg_catalog.jsonb_typeof(metadata) = 'object'
  AND pg_catalog.btrim(COALESCE(metadata->>'content_type', '')) <> '';

-- Backfill uploader only when metadata holds a verified Auth user ID.
-- Unverifiable or unknown values stay NULL; the original metadata is untouched.
UPDATE public.media_assets AS m
SET uploaded_by = (m.metadata->>'uploaded_by')::uuid
WHERE m.uploaded_by IS NULL
  AND pg_catalog.jsonb_typeof(m.metadata) = 'object'
  AND EXISTS (
    SELECT 1
    FROM auth.users AS u
    WHERE u.id::text = m.metadata->>'uploaded_by'
  );

-- One registry row per stored object. Partial: legacy rows without a
-- location are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS media_assets_storage_location_uidx
  ON public.media_assets (storage_bucket, storage_path)
  WHERE storage_bucket IS NOT NULL AND storage_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS media_assets_uploaded_by_idx
  ON public.media_assets (uploaded_by)
  WHERE uploaded_by IS NOT NULL;

COMMENT ON COLUMN public.media_assets.storage_bucket IS
  'Storage bucket of the stored object. New civic uploads use universal-media. NULL for legacy rows without a verified location.';
COMMENT ON COLUMN public.media_assets.storage_path IS
  'Stable-ID object path within storage_bucket. Never derived from titles or slugs.';
COMMENT ON COLUMN public.media_assets.mime_type IS
  'File-level MIME type of the stored object.';
COMMENT ON COLUMN public.media_assets.uploaded_by IS
  'auth.users.id of the uploader (not admin_users.id). NULL when unknown.';

COMMIT;
