BEGIN;

-- Gate: legacy hotspot rows cannot be translated automatically. The table is
-- expected to be empty; abort rather than guess if that is no longer true.
DO $gate$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.hotspots
    WHERE civic_object_type IS NULL
       OR civic_object_id IS NULL
       OR civic_object_type NOT IN (
         'civic_entity', 'civic_event', 'civic_place', 'civic_moment',
         'civic_artifact', 'civic_neighborhood', 'civic_story'
       )
  ) THEN
    RAISE EXCEPTION 'hotspots contains rows that cannot be mapped to target_type/target_id; review before migrating';
  END IF;
END
$gate$;

ALTER TABLE public.hotspots
  ADD COLUMN IF NOT EXISTS target_type   text,
  ADD COLUMN IF NOT EXISTS target_id     uuid,
  ADD COLUMN IF NOT EXISTS target_url    text,
  ADD COLUMN IF NOT EXISTS is_active     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata      jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS behavior      jsonb   NOT NULL DEFAULT '{}'::jsonb;

-- Backfill from the legacy contract (no-op on an empty table).
UPDATE public.hotspots
SET target_type = civic_object_type,
    target_id   = civic_object_id,
    is_active   = (status = 'active')
WHERE target_type IS NULL;

UPDATE public.hotspots
SET label = COALESCE(NULLIF(pg_catalog.btrim(label), ''), 'Hotspot'),
    icon  = COALESCE(NULLIF(pg_catalog.btrim(icon), ''), 'default')
WHERE label IS NULL OR pg_catalog.btrim(label) = ''
   OR icon IS NULL OR pg_catalog.btrim(icon) = '';

-- The legacy civic_object_* columns are deprecated and no longer required, so
-- external-URL targets can be stored. They are removed in the legacy-contract migration.
ALTER TABLE public.hotspots
  ALTER COLUMN civic_object_id   DROP NOT NULL,
  ALTER COLUMN civic_object_type DROP NOT NULL,
  ALTER COLUMN target_type       SET NOT NULL,
  ALTER COLUMN label             SET NOT NULL,
  ALTER COLUMN icon              SET NOT NULL,
  ALTER COLUMN icon              SET DEFAULT 'default',
  ALTER COLUMN pan_x             TYPE numeric(5,4),
  ALTER COLUMN pan_y             TYPE numeric(5,4);

-- Foreign keys. Actor columns reference admin_users.id.
ALTER TABLE public.hotspots
  ADD CONSTRAINT hotspots_panorama_id_fkey
    FOREIGN KEY (panorama_id) REFERENCES public.panoramas (id) ON DELETE CASCADE,
  ADD CONSTRAINT hotspots_city_id_fkey
    FOREIGN KEY (city_id) REFERENCES public.cities (id),
  ADD CONSTRAINT hotspots_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.admin_users (id) ON DELETE SET NULL,
  ADD CONSTRAINT hotspots_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES public.admin_users (id) ON DELETE SET NULL;

ALTER TABLE public.hotspots
  ADD CONSTRAINT hotspots_pan_x_chk CHECK (pan_x BETWEEN 0 AND 1),
  ADD CONSTRAINT hotspots_pan_y_chk CHECK (pan_y BETWEEN 0 AND 1),
  ADD CONSTRAINT hotspots_target_type_chk
    CHECK (target_type IN (
      'civic_entity', 'civic_event', 'civic_place', 'civic_moment',
      'civic_artifact', 'civic_neighborhood', 'civic_story',
      'panorama', 'external_url'
    )),
  ADD CONSTRAINT hotspots_target_exclusive_chk
    CHECK (
      (target_type <> 'external_url' AND target_id IS NOT NULL AND target_url IS NULL)
      OR
      (target_type = 'external_url' AND target_url IS NOT NULL AND target_id IS NULL)
    ),
  ADD CONSTRAINT hotspots_target_url_https_chk
    CHECK (target_url IS NULL OR target_url ~* '^https://[^[:space:]]+$'),
  ADD CONSTRAINT hotspots_label_length_chk
    CHECK (pg_catalog.char_length(label) BETWEEN 1 AND 120),
  ADD CONSTRAINT hotspots_icon_nonblank_chk
    CHECK (pg_catalog.btrim(icon) <> ''),
  ADD CONSTRAINT hotspots_display_order_chk
    CHECK (display_order >= 0),
  ADD CONSTRAINT hotspots_metadata_object_chk
    CHECK (pg_catalog.jsonb_typeof(metadata) = 'object'),
  ADD CONSTRAINT hotspots_behavior_object_chk
    CHECK (pg_catalog.jsonb_typeof(behavior) = 'object');

CREATE INDEX IF NOT EXISTS idx_hotspots_panorama_id
  ON public.hotspots (panorama_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_city_id
  ON public.hotspots (city_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_active
  ON public.hotspots (panorama_id, display_order)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hotspots_target
  ON public.hotspots (target_type, target_id)
  WHERE target_id IS NOT NULL;

-- Publication state of a civic object. Stories are publicly visible only when
-- published and not under safety hold.
CREATE OR REPLACE FUNCTION public.civic_object_is_published(p_type text, p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT COALESCE(
    CASE p_type
      WHEN 'civic_entity'       THEN (SELECT is_published FROM public.civic_entities      WHERE id = p_id)
      WHEN 'civic_event'        THEN (SELECT is_published FROM public.civic_events        WHERE id = p_id)
      WHEN 'civic_place'        THEN (SELECT is_published FROM public.civic_places        WHERE id = p_id)
      WHEN 'civic_moment'       THEN (SELECT is_published FROM public.civic_moments       WHERE id = p_id)
      WHEN 'civic_artifact'     THEN (SELECT is_published FROM public.civic_artifacts     WHERE id = p_id)
      WHEN 'civic_neighborhood' THEN (SELECT is_published FROM public.civic_neighborhoods WHERE id = p_id)
      WHEN 'civic_story'        THEN (SELECT is_published AND NOT safety_hold FROM public.civic_stories WHERE id = p_id)
    END,
    false)
$function$;

REVOKE ALL ON FUNCTION public.civic_object_is_published(text, uuid) FROM PUBLIC, anon, authenticated;

-- Integrity and activation validation.
CREATE OR REPLACE FUNCTION public.hotspots_enforce_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_pano_city uuid;
  v_pano_status text;
  v_target_city uuid;
  v_actor uuid;
  v_target_changed boolean;
BEGIN
  SELECT p.city_id, p.status INTO v_pano_city, v_pano_status
  FROM public.panoramas AS p
  WHERE p.id = NEW.panorama_id;

  IF v_pano_city IS NULL THEN
    RAISE EXCEPTION 'hotspot panorama % not found', NEW.panorama_id
      USING ERRCODE = '23503';
  END IF;

  -- city_id is always derived from the parent panorama.
  NEW.city_id := v_pano_city;

  IF auth.uid() IS NOT NULL THEN
    SELECT a.id INTO v_actor
    FROM public.admin_users AS a
    WHERE a.user_id = auth.uid()
    LIMIT 1;
  END IF;

  v_target_changed := TG_OP = 'INSERT'
    OR NEW.panorama_id IS DISTINCT FROM OLD.panorama_id
    OR NEW.target_type IS DISTINCT FROM OLD.target_type
    OR NEW.target_id   IS DISTINCT FROM OLD.target_id;

  -- Targets must exist and belong to the hotspot's city.
  IF v_target_changed AND NEW.target_type <> 'external_url' THEN
    IF NEW.target_type = 'panorama' THEN
      SELECT p.city_id INTO v_target_city FROM public.panoramas AS p WHERE p.id = NEW.target_id;
    ELSE
      v_target_city := public.civic_object_city_id(NEW.target_type, NEW.target_id);
    END IF;

    IF v_target_city IS NULL THEN
      RAISE EXCEPTION 'hotspot target % % not found', NEW.target_type, NEW.target_id
        USING ERRCODE = '23503';
    END IF;
    IF v_target_city IS DISTINCT FROM NEW.city_id THEN
      RAISE EXCEPTION 'hotspot target belongs to a different city'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Activation requires a live parent and a published, supported target.
  IF NEW.is_active
     AND (TG_OP = 'INSERT' OR NOT OLD.is_active OR v_target_changed) THEN
    IF v_pano_status = 'archived' THEN
      RAISE EXCEPTION 'cannot activate a hotspot on an archived panorama'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.target_type = 'panorama' THEN
      RAISE EXCEPTION 'panorama targets are not supported for activation in the MVP'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.target_type <> 'external_url'
       AND NOT public.civic_object_is_published(NEW.target_type, NEW.target_id) THEN
      RAISE EXCEPTION 'cannot activate a hotspot targeting an unpublished object'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Legacy status mirrors is_active until the legacy column is removed.
  NEW.status := CASE WHEN NEW.is_active THEN 'active' ELSE 'inactive' END;

  IF TG_OP = 'INSERT' THEN
    IF v_actor IS NOT NULL THEN
      NEW.created_by := COALESCE(NEW.created_by, v_actor);
      NEW.updated_by := COALESCE(NEW.updated_by, v_actor);
    END IF;
  ELSE
    NEW.updated_at := pg_catalog.now();
    IF v_actor IS NOT NULL THEN
      NEW.updated_by := v_actor;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.hotspots_enforce_integrity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_hotspots_enforce_integrity
  BEFORE INSERT OR UPDATE ON public.hotspots
  FOR EACH ROW EXECUTE FUNCTION public.hotspots_enforce_integrity();

-- Archiving a panorama deactivates its hotspots.
CREATE OR REPLACE FUNCTION public.panoramas_deactivate_hotspots_on_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  UPDATE public.hotspots
  SET is_active = false
  WHERE panorama_id = NEW.id
    AND is_active;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.panoramas_deactivate_hotspots_on_archive() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_panoramas_deactivate_hotspots_on_archive
  AFTER UPDATE OF status ON public.panoramas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'archived')
  EXECUTE FUNCTION public.panoramas_deactivate_hotspots_on_archive();

COMMIT;
