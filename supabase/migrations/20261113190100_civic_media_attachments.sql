BEGIN;

-- Resolve the owning city of a polymorphic civic object. Static per-type lookup;
-- returns NULL when the object does not exist or the type is unknown.
-- Shared with later migrations (panoramas, hotspots).
CREATE OR REPLACE FUNCTION public.civic_object_city_id(p_type text, p_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT CASE p_type
    WHEN 'civic_entity'       THEN (SELECT city_id FROM public.civic_entities       WHERE id = p_id)
    WHEN 'civic_event'        THEN (SELECT city_id FROM public.civic_events         WHERE id = p_id)
    WHEN 'civic_place'        THEN (SELECT city_id FROM public.civic_places         WHERE id = p_id)
    WHEN 'civic_moment'       THEN (SELECT city_id FROM public.civic_moments        WHERE id = p_id)
    WHEN 'civic_artifact'     THEN (SELECT city_id FROM public.civic_artifacts      WHERE id = p_id)
    WHEN 'civic_neighborhood' THEN (SELECT city_id FROM public.civic_neighborhoods  WHERE id = p_id)
    WHEN 'civic_story'        THEN (SELECT city_id FROM public.civic_stories        WHERE id = p_id)
    ELSE NULL
  END
$function$;

REVOKE ALL ON FUNCTION public.civic_object_city_id(text, uuid) FROM PUBLIC, anon, authenticated;

CREATE TABLE public.civic_media_attachments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id           uuid        NOT NULL,
  civic_object_id   uuid        NOT NULL,
  civic_object_type text        NOT NULL,
  media_asset_id    uuid        NOT NULL,
  role              text        NOT NULL,
  is_primary        boolean     NOT NULL DEFAULT false,
  display_order     integer     NOT NULL DEFAULT 0,
  alt_text          text,
  caption           text,
  is_decorative     boolean     NOT NULL DEFAULT false,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT civic_media_attachments_city_id_fkey
    FOREIGN KEY (city_id) REFERENCES public.cities (id),
  CONSTRAINT civic_media_attachments_media_asset_id_fkey
    FOREIGN KEY (media_asset_id) REFERENCES public.media_assets (id) ON DELETE RESTRICT,
  -- created_by is the Electrum administrator (admin_users.id), not the Auth user.
  CONSTRAINT civic_media_attachments_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.admin_users (id) ON DELETE SET NULL,

  CONSTRAINT civic_media_attachments_object_type_chk
    CHECK (civic_object_type IN (
      'civic_entity', 'civic_event', 'civic_place', 'civic_moment',
      'civic_artifact', 'civic_neighborhood', 'civic_story'
    )),
  CONSTRAINT civic_media_attachments_role_chk
    CHECK (role IN ('hero', 'thumbnail', 'gallery', 'evidence')),
  CONSTRAINT civic_media_attachments_role_primary_chk
    CHECK (
      (role IN ('hero', 'thumbnail') AND is_primary)
      OR (role IN ('gallery', 'evidence') AND NOT is_primary)
    ),
  CONSTRAINT civic_media_attachments_display_order_chk
    CHECK (display_order >= 0),
  CONSTRAINT civic_media_attachments_alt_text_chk
    CHECK (
      is_decorative
      OR (alt_text IS NOT NULL AND pg_catalog.btrim(alt_text) <> '')
    )
);

-- One hero and one thumbnail per civic object.
CREATE UNIQUE INDEX civic_media_attachments_primary_role_uidx
  ON public.civic_media_attachments (city_id, civic_object_id, civic_object_type, role)
  WHERE role IN ('hero', 'thumbnail');

CREATE INDEX civic_media_attachments_object_idx
  ON public.civic_media_attachments (civic_object_type, civic_object_id, role, display_order);

CREATE INDEX civic_media_attachments_city_idx
  ON public.civic_media_attachments (city_id);

CREATE INDEX civic_media_attachments_asset_idx
  ON public.civic_media_attachments (media_asset_id);

-- Integrity: the civic object must exist in the same city, ownership is immutable,
-- and any recorded storage bucket must be universal-media.
CREATE OR REPLACE FUNCTION public.civic_media_attachments_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_object_city uuid;
  v_bucket text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.city_id IS DISTINCT FROM OLD.city_id
       OR NEW.civic_object_type IS DISTINCT FROM OLD.civic_object_type
       OR NEW.civic_object_id IS DISTINCT FROM OLD.civic_object_id THEN
      RAISE EXCEPTION 'civic_media_attachments ownership is immutable'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    v_object_city := public.civic_object_city_id(NEW.civic_object_type, NEW.civic_object_id);
    IF v_object_city IS NULL THEN
      RAISE EXCEPTION 'civic object % % not found', NEW.civic_object_type, NEW.civic_object_id
        USING ERRCODE = '23503';
    END IF;
    IF v_object_city IS DISTINCT FROM NEW.city_id THEN
      RAISE EXCEPTION 'attachment city does not match civic object city'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.media_asset_id IS DISTINCT FROM OLD.media_asset_id THEN
    SELECT storage_bucket INTO v_bucket
    FROM public.media_assets
    WHERE id = NEW.media_asset_id;

    IF v_bucket IS NOT NULL AND v_bucket <> 'universal-media' THEN
      RAISE EXCEPTION 'civic media must be stored in universal-media (found %)', v_bucket
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.civic_media_attachments_validate() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_civic_media_attachments_validate
  BEFORE INSERT OR UPDATE ON public.civic_media_attachments
  FOR EACH ROW EXECUTE FUNCTION public.civic_media_attachments_validate();

-- Deny by default. Policies and column grants are defined in the RLS migration.
ALTER TABLE public.civic_media_attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.civic_media_attachments FROM PUBLIC, anon, authenticated;

COMMIT;
