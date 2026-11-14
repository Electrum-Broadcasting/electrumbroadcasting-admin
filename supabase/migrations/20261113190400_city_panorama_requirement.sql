BEGIN;

-- (city_id, feature_name) is already unique live via
-- city_feature_toggles_city_id_feature_name_key, so no unique constraint is added.

-- A NULL toggle is treated as disabled; make that explicit.
UPDATE public.city_feature_toggles SET enabled = false WHERE enabled IS NULL;

ALTER TABLE public.city_feature_toggles
  ALTER COLUMN enabled SET DEFAULT false,
  ALTER COLUMN enabled SET NOT NULL;

ALTER TABLE public.city_feature_toggles
  ADD CONSTRAINT city_feature_toggles_feature_name_nonblank_chk
    CHECK (pg_catalog.btrim(feature_name) <> '');

-- require_published_panorama is off unless a city has an enabled row.
-- A missing row means every object may publish without a panorama.
CREATE OR REPLACE FUNCTION public.city_requires_published_panorama(p_city_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT COALESCE((
    SELECT t.enabled
    FROM public.city_feature_toggles AS t
    WHERE t.city_id = p_city_id
      AND t.feature_name = 'require_published_panorama'
  ), false)
$function$;

REVOKE ALL ON FUNCTION public.city_requires_published_panorama(uuid) FROM PUBLIC, anon, authenticated;

-- Publication guard. Applies only when an object becomes published; objects that
-- are already published are not affected if the toggle is enabled later.
-- TG_ARGV[0] is the civic_object_type discriminator for the table.
CREATE OR REPLACE FUNCTION public.civic_require_published_panorama()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_published IS TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.city_id IS NOT NULL
     AND public.city_requires_published_panorama(NEW.city_id)
     AND NOT EXISTS (
       SELECT 1
       FROM public.panoramas AS p
       WHERE p.civic_object_type = TG_ARGV[0]
         AND p.civic_object_id = NEW.id
         AND p.city_id = NEW.city_id
         AND p.status = 'published'
     ) THEN
    RAISE EXCEPTION 'this city requires a published panorama before publishing'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.civic_require_published_panorama() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_civic_entities_require_published_panorama
  BEFORE INSERT OR UPDATE OF is_published ON public.civic_entities
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_entity');

CREATE TRIGGER trg_civic_events_require_published_panorama
  BEFORE INSERT OR UPDATE OF is_published ON public.civic_events
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_event');

CREATE TRIGGER trg_civic_places_require_published_panorama
  BEFORE INSERT OR UPDATE OF is_published ON public.civic_places
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_place');

CREATE TRIGGER trg_civic_moments_require_published_panorama
  BEFORE INSERT OR UPDATE OF is_published ON public.civic_moments
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_moment');

CREATE TRIGGER trg_civic_artifacts_require_published_panorama
  BEFORE INSERT OR UPDATE OF is_published ON public.civic_artifacts
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_artifact');

CREATE TRIGGER trg_civic_neighborhoods_require_published_panorama
  BEFORE INSERT OR UPDATE OF is_published ON public.civic_neighborhoods
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_neighborhood');

CREATE TRIGGER trg_civic_stories_require_published_panorama
  BEFORE INSERT OR UPDATE OF is_published ON public.civic_stories
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_story');

COMMIT;
