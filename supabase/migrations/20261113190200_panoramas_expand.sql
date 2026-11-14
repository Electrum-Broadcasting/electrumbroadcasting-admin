BEGIN;

-- Same definition as the attachments migration; repeated so this migration is
-- self-sufficient. CREATE OR REPLACE keeps the two identical.
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

-- New columns (all nullable or defaulted).
ALTER TABLE public.panoramas
  ADD COLUMN IF NOT EXISTS pan_x_initial       numeric(5,4) NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS pan_y_initial       numeric(5,4) NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS capture_date        date,
  ADD COLUMN IF NOT EXISTS capture_attribution text,
  ADD COLUMN IF NOT EXISTS published_at        timestamptz,
  ADD COLUMN IF NOT EXISTS published_by        uuid,
  ADD COLUMN IF NOT EXISTS archived_at         timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by         uuid,
  ADD COLUMN IF NOT EXISTS metadata            jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Normalize legacy rows before tightening nullability (no-op on an empty table).
-- is_published is a generated column (status = 'published') and is never written.
UPDATE public.panoramas
SET label         = COALESCE(NULLIF(pg_catalog.btrim(label), ''), 'Untitled panorama'),
    display_order = COALESCE(display_order, 0)
WHERE label IS NULL OR pg_catalog.btrim(label) = ''
   OR display_order IS NULL;

ALTER TABLE public.panoramas
  ALTER COLUMN label         SET NOT NULL,
  ALTER COLUMN display_order SET NOT NULL;

-- Foreign keys. Actor columns reference admin_users.id (the Electrum administrator),
-- not auth.users.id.
ALTER TABLE public.panoramas
  ADD CONSTRAINT panoramas_city_id_fkey
    FOREIGN KEY (city_id) REFERENCES public.cities (id),
  ADD CONSTRAINT panoramas_created_by_fkey
    FOREIGN KEY (created_by)   REFERENCES public.admin_users (id) ON DELETE SET NULL,
  ADD CONSTRAINT panoramas_updated_by_fkey
    FOREIGN KEY (updated_by)   REFERENCES public.admin_users (id) ON DELETE SET NULL,
  ADD CONSTRAINT panoramas_published_by_fkey
    FOREIGN KEY (published_by) REFERENCES public.admin_users (id) ON DELETE SET NULL,
  ADD CONSTRAINT panoramas_archived_by_fkey
    FOREIGN KEY (archived_by)  REFERENCES public.admin_users (id) ON DELETE SET NULL;

ALTER TABLE public.panoramas
  ADD CONSTRAINT panoramas_object_type_chk
    CHECK (civic_object_type IN (
      'civic_entity', 'civic_event', 'civic_place', 'civic_moment',
      'civic_artifact', 'civic_neighborhood', 'civic_story'
    )),
  ADD CONSTRAINT panoramas_status_chk
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD CONSTRAINT panoramas_published_at_chk
    CHECK (status <> 'published' OR published_at IS NOT NULL),
  ADD CONSTRAINT panoramas_archived_at_chk
    CHECK (status <> 'archived' OR archived_at IS NOT NULL),
  ADD CONSTRAINT panoramas_draft_lifecycle_chk
    CHECK (status <> 'draft' OR (published_at IS NULL AND archived_at IS NULL)),
  ADD CONSTRAINT panoramas_label_length_chk
    CHECK (pg_catalog.char_length(label) BETWEEN 1 AND 120),
  ADD CONSTRAINT panoramas_description_length_chk
    CHECK (description IS NULL OR pg_catalog.char_length(description) <= 500),
  ADD CONSTRAINT panoramas_display_order_chk
    CHECK (display_order >= 0),
  ADD CONSTRAINT panoramas_pan_x_initial_chk
    CHECK (pan_x_initial BETWEEN 0 AND 1),
  ADD CONSTRAINT panoramas_pan_y_initial_chk
    CHECK (pan_y_initial BETWEEN 0 AND 1),
  ADD CONSTRAINT panoramas_metadata_object_chk
    CHECK (pg_catalog.jsonb_typeof(metadata) = 'object');

-- display_order is intentionally not unique; ties resolve by display_order,
-- created_at, id.
CREATE INDEX panoramas_object_order_idx
  ON public.panoramas (civic_object_type, civic_object_id, display_order, created_at, id)
  WHERE status = 'published';

CREATE INDEX panoramas_object_idx
  ON public.panoramas (civic_object_type, civic_object_id);

CREATE INDEX panoramas_city_status_idx
  ON public.panoramas (city_id, status);

-- Lifecycle and integrity enforcement.
CREATE OR REPLACE FUNCTION public.panoramas_enforce_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_object_city uuid;
  v_actor uuid;
  v_has_session boolean := auth.uid() IS NOT NULL;
BEGIN
  -- Session users are attributed to their admin_users row. Trusted service-role
  -- writers (no auth.uid()) supply published_by / archived_by themselves.
  IF v_has_session THEN
    SELECT a.id INTO v_actor
    FROM public.admin_users AS a
    WHERE a.user_id = auth.uid()
    LIMIT 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_object_city := public.civic_object_city_id(NEW.civic_object_type, NEW.civic_object_id);
    IF v_object_city IS NULL THEN
      RAISE EXCEPTION 'panorama parent % % not found', NEW.civic_object_type, NEW.civic_object_id
        USING ERRCODE = '23503';
    END IF;
    IF v_object_city IS DISTINCT FROM NEW.city_id THEN
      RAISE EXCEPTION 'panorama city does not match parent civic object city'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'panoramas must be inserted as draft'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.published_at IS NOT NULL OR NEW.published_by IS NOT NULL
       OR NEW.archived_at IS NOT NULL OR NEW.archived_by IS NOT NULL THEN
      RAISE EXCEPTION 'lifecycle fields must be empty on insert'
        USING ERRCODE = '23514';
    END IF;

    IF v_actor IS NOT NULL THEN
      NEW.created_by := COALESCE(NEW.created_by, v_actor);
      NEW.updated_by := COALESCE(NEW.updated_by, v_actor);
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.city_id IS DISTINCT FROM OLD.city_id
     OR NEW.civic_object_type IS DISTINCT FROM OLD.civic_object_type
     OR NEW.civic_object_id IS DISTINCT FROM OLD.civic_object_id THEN
    RAISE EXCEPTION 'panorama ownership is immutable; archive and create a new panorama'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT ((OLD.status, NEW.status) IN (
      ('draft', 'published'),
      ('draft', 'archived'),
      ('published', 'draft'),
      ('published', 'archived')
    )) THEN
      RAISE EXCEPTION 'invalid panorama status transition % -> %', OLD.status, NEW.status
        USING ERRCODE = '23514';
    END IF;

    IF NEW.status = 'published' THEN
      NEW.published_at := pg_catalog.now();
      NEW.published_by := CASE WHEN v_has_session THEN v_actor ELSE NEW.published_by END;
      NEW.archived_at := NULL;
      NEW.archived_by := NULL;
    ELSIF NEW.status = 'archived' THEN
      NEW.archived_at := pg_catalog.now();
      NEW.archived_by := CASE WHEN v_has_session THEN v_actor ELSE NEW.archived_by END;
    ELSE
      -- Unpublish clears publication fields.
      NEW.published_at := NULL;
      NEW.published_by := NULL;
    END IF;
  ELSIF NEW.published_at IS DISTINCT FROM OLD.published_at
     OR NEW.published_by IS DISTINCT FROM OLD.published_by
     OR NEW.archived_at  IS DISTINCT FROM OLD.archived_at
     OR NEW.archived_by  IS DISTINCT FROM OLD.archived_by THEN
    RAISE EXCEPTION 'lifecycle fields change only through status transitions'
      USING ERRCODE = '23514';
  END IF;

  NEW.updated_at := pg_catalog.now();
  IF v_actor IS NOT NULL THEN
    NEW.updated_by := v_actor;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.panoramas_enforce_lifecycle() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_panoramas_enforce_lifecycle
  BEFORE INSERT OR UPDATE ON public.panoramas
  FOR EACH ROW EXECUTE FUNCTION public.panoramas_enforce_lifecycle();

COMMIT;
