BEGIN;

-- status is the lifecycle field for these six civic object types.
-- Historical hidden state is not inferred: published rows become approved;
-- every unpublished row becomes pending, per the approved Phase 2 rule.
UPDATE public.civic_entities
SET status = CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END
WHERE status IS DISTINCT FROM
  CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END;
UPDATE public.civic_entities SET is_published = false WHERE is_published IS NULL;

UPDATE public.civic_events
SET status = CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END
WHERE status IS DISTINCT FROM
  CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END;
UPDATE public.civic_events SET is_published = false WHERE is_published IS NULL;

UPDATE public.civic_artifacts
SET status = CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END
WHERE status IS DISTINCT FROM
  CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END;
UPDATE public.civic_artifacts SET is_published = false WHERE is_published IS NULL;

UPDATE public.civic_neighborhoods
SET status = CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END
WHERE status IS DISTINCT FROM
  CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END;
UPDATE public.civic_neighborhoods SET is_published = false WHERE is_published IS NULL;

UPDATE public.civic_eras
SET status = CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END
WHERE status IS DISTINCT FROM
  CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END;
UPDATE public.civic_eras SET is_published = false WHERE is_published IS NULL;

UPDATE public.civic_moments
SET status = CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END
WHERE status IS DISTINCT FROM
  CASE WHEN is_published IS TRUE THEN 'approved' ELSE 'pending' END;
UPDATE public.civic_moments SET is_published = false WHERE is_published IS NULL;

ALTER TABLE public.civic_entities
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN is_published SET DEFAULT false,
  ALTER COLUMN is_published SET NOT NULL,
  ADD CONSTRAINT civic_entities_lifecycle_status_chk
    CHECK (status IN ('pending', 'approved', 'hidden')),
  ADD CONSTRAINT civic_entities_lifecycle_publication_chk
    CHECK ((status = 'approved') = is_published);

ALTER TABLE public.civic_events
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN is_published SET DEFAULT false,
  ALTER COLUMN is_published SET NOT NULL,
  ADD CONSTRAINT civic_events_lifecycle_status_chk
    CHECK (status IN ('pending', 'approved', 'hidden')),
  ADD CONSTRAINT civic_events_lifecycle_publication_chk
    CHECK ((status = 'approved') = is_published);

ALTER TABLE public.civic_artifacts
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN is_published SET DEFAULT false,
  ALTER COLUMN is_published SET NOT NULL,
  ADD CONSTRAINT civic_artifacts_lifecycle_status_chk
    CHECK (status IN ('pending', 'approved', 'hidden')),
  ADD CONSTRAINT civic_artifacts_lifecycle_publication_chk
    CHECK ((status = 'approved') = is_published);

ALTER TABLE public.civic_neighborhoods
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN is_published SET DEFAULT false,
  ALTER COLUMN is_published SET NOT NULL,
  ADD CONSTRAINT civic_neighborhoods_lifecycle_status_chk
    CHECK (status IN ('pending', 'approved', 'hidden')),
  ADD CONSTRAINT civic_neighborhoods_lifecycle_publication_chk
    CHECK ((status = 'approved') = is_published);

ALTER TABLE public.civic_eras
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN is_published SET DEFAULT false,
  ALTER COLUMN is_published SET NOT NULL,
  ADD CONSTRAINT civic_eras_lifecycle_status_chk
    CHECK (status IN ('pending', 'approved', 'hidden')),
  ADD CONSTRAINT civic_eras_lifecycle_publication_chk
    CHECK ((status = 'approved') = is_published);

ALTER TABLE public.civic_moments
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN is_published SET DEFAULT false,
  ALTER COLUMN is_published SET NOT NULL,
  ADD CONSTRAINT civic_moments_lifecycle_status_chk
    CHECK (status IN ('pending', 'approved', 'hidden')),
  ADD CONSTRAINT civic_moments_lifecycle_publication_chk
    CHECK ((status = 'approved') = is_published);

-- Keep existing is_published-only clients compatible until guarded RPCs replace
-- their direct writes. Explicit lifecycle status changes remain authoritative.
CREATE FUNCTION public.sync_civic_object_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL OR NEW.status NOT IN ('pending', 'approved', 'hidden') THEN
      RAISE EXCEPTION 'Unsupported civic lifecycle status: %', NEW.status
        USING ERRCODE = '23514';
    END IF;
    IF NEW.is_published IS NULL THEN
      RAISE EXCEPTION 'Civic publication state cannot be NULL'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.status = 'hidden' THEN
      NEW.is_published := false;
    ELSIF NEW.status = 'approved' OR NEW.is_published IS TRUE THEN
      NEW.status := 'approved';
      NEW.is_published := true;
    ELSE
      NEW.status := 'pending';
      NEW.is_published := false;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS NULL OR NEW.status NOT IN ('pending', 'approved', 'hidden') THEN
    RAISE EXCEPTION 'Unsupported civic lifecycle status: %', NEW.status
      USING ERRCODE = '23514';
  END IF;
  IF NEW.is_published IS NULL THEN
    RAISE EXCEPTION 'Civic publication state cannot be NULL'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.is_published IS DISTINCT FROM OLD.is_published THEN
    IF (NEW.status = 'approved') IS DISTINCT FROM NEW.is_published THEN
      RAISE EXCEPTION 'Civic lifecycle status and publication state disagree'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.is_published := (NEW.status = 'approved');
  ELSIF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
    NEW.status := CASE WHEN NEW.is_published THEN 'approved' ELSE 'pending' END;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_civic_object_lifecycle()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_civic_entities_lifecycle_sync
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_entities
  FOR EACH ROW EXECUTE FUNCTION public.sync_civic_object_lifecycle();

CREATE TRIGGER trg_civic_events_lifecycle_sync
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_civic_object_lifecycle();

CREATE TRIGGER trg_civic_artifacts_lifecycle_sync
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.sync_civic_object_lifecycle();

CREATE TRIGGER trg_civic_neighborhoods_lifecycle_sync
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_neighborhoods
  FOR EACH ROW EXECUTE FUNCTION public.sync_civic_object_lifecycle();

CREATE TRIGGER trg_civic_eras_lifecycle_sync
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_eras
  FOR EACH ROW EXECUTE FUNCTION public.sync_civic_object_lifecycle();

CREATE TRIGGER trg_civic_moments_lifecycle_sync
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_moments
  FOR EACH ROW EXECUTE FUNCTION public.sync_civic_object_lifecycle();

-- Status-driven approval must pass the same published-panorama check as a
-- legacy is_published=true write. Place and Story guards are left unchanged.
DROP TRIGGER trg_civic_entities_require_published_panorama
  ON public.civic_entities;
CREATE TRIGGER trg_civic_entities_require_published_panorama
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_entities
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_entity');

DROP TRIGGER trg_civic_events_require_published_panorama
  ON public.civic_events;
CREATE TRIGGER trg_civic_events_require_published_panorama
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_events
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_event');

DROP TRIGGER trg_civic_artifacts_require_published_panorama
  ON public.civic_artifacts;
CREATE TRIGGER trg_civic_artifacts_require_published_panorama
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_artifacts
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_artifact');

DROP TRIGGER trg_civic_neighborhoods_require_published_panorama
  ON public.civic_neighborhoods;
CREATE TRIGGER trg_civic_neighborhoods_require_published_panorama
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_neighborhoods
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_neighborhood');

DROP TRIGGER trg_civic_moments_require_published_panorama
  ON public.civic_moments;
CREATE TRIGGER trg_civic_moments_require_published_panorama
  BEFORE INSERT OR UPDATE OF status, is_published ON public.civic_moments
  FOR EACH ROW WHEN (NEW.is_published IS TRUE)
  EXECUTE FUNCTION public.civic_require_published_panorama('civic_moment');

COMMIT;
