BEGIN;

-- Keep the preflight and trigger replacement consistent with concurrent writers.
LOCK TABLE public.civic_artifacts, public.civic_entities, public.civic_eras,
  public.civic_events, public.civic_moments, public.civic_neighborhoods,
  public.civic_places, public.civic_stories, public.search_index
  IN SHARE ROW EXCLUSIVE MODE;

DO $preflight$
DECLARE
  v_count bigint;
BEGIN
  WITH sources AS (
    SELECT id, city_id, slug, name AS title, is_published IS TRUE AS eligible FROM public.civic_entities
    UNION ALL SELECT id, city_id, slug, name, is_published IS TRUE FROM public.civic_events
    UNION ALL SELECT id, city_id, slug, title, is_published IS TRUE FROM public.civic_artifacts
    UNION ALL SELECT id, city_id, slug, name, is_published IS TRUE FROM public.civic_neighborhoods
    UNION ALL SELECT id, city_id, slug, name, is_published IS TRUE FROM public.civic_eras
    UNION ALL SELECT id, city_id, slug, title, is_published IS TRUE FROM public.civic_moments
    UNION ALL SELECT id, city_id, slug, name, is_published IS TRUE FROM public.civic_places
    UNION ALL SELECT id, city_id, slug, title,
      is_published IS TRUE AND review_status = 'published' AND safety_hold IS FALSE
      FROM public.civic_stories
  )
  SELECT count(*) INTO v_count
  FROM sources s LEFT JOIN public.cities c ON c.id = s.city_id
  WHERE s.eligible IS TRUE
    AND (c.id IS NULL OR s.slug IS NULL OR s.slug !~ '^[A-Za-z0-9][A-Za-z0-9._~-]*$'
      OR s.title IS NULL OR btrim(s.title) = '');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Search index repair blocked: % eligible civic records have a missing city or title or unsafe slug', v_count;
  END IF;

  WITH objects AS (
    SELECT id FROM public.civic_entities UNION ALL
    SELECT id FROM public.civic_events UNION ALL
    SELECT id FROM public.civic_artifacts UNION ALL
    SELECT id FROM public.civic_neighborhoods UNION ALL
    SELECT id FROM public.civic_eras UNION ALL
    SELECT id FROM public.civic_moments UNION ALL
    SELECT id FROM public.civic_places
  )
  SELECT count(*) INTO v_count
  FROM (SELECT id FROM objects GROUP BY id HAVING count(*) > 1) collisions;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Search index repair blocked: % civic object IDs occur in multiple source tables', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.search_index si
  LEFT JOIN public.civic_stories s ON s.id = si.entity_id
  WHERE si.entity_type = 'story' AND si.is_published
    AND (s.id IS NULL OR s.is_published IS NOT TRUE
      OR s.review_status IS DISTINCT FROM 'published' OR s.safety_hold IS NOT FALSE
      OR si.city_id IS DISTINCT FROM s.city_id);
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Search index repair blocked: % published story index rows are stale or ineligible', v_count;
  END IF;
END
$preflight$;

-- A source-table discriminator is necessary because all civic object types
-- share search_index.entity_type = 'object'.
CREATE OR REPLACE FUNCTION public.search_index_civic_record(p_source_table text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_row jsonb;
  v_city_id uuid;
  v_slug text;
  v_title text;
  v_subtitle text;
  v_summary text;
  v_keywords text[] := ARRAY[]::text[];
  v_thumbnail text;
  v_object_type text;
  v_route_prefix text;
  v_entity_type text := 'object';
  v_eligible boolean;
  v_updated timestamptz;
  v_matches integer;
BEGIN
  IF p_id IS NULL OR p_source_table IS NULL OR p_source_table NOT IN (
    'civic_entities', 'civic_events', 'civic_artifacts', 'civic_neighborhoods',
    'civic_eras', 'civic_moments', 'civic_places', 'civic_stories'
  ) THEN
    RAISE EXCEPTION 'Invalid civic search source or ID';
  END IF;

  EXECUTE format('SELECT to_jsonb(s) FROM public.%I AS s WHERE s.id = $1 FOR UPDATE', p_source_table)
    INTO v_row USING p_id;
  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Search source % % not found', p_source_table, p_id;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  IF p_source_table <> 'civic_stories' THEN
    SELECT count(*) INTO v_matches FROM (
      SELECT id FROM public.civic_entities WHERE id = p_id
      UNION ALL SELECT id FROM public.civic_events WHERE id = p_id
      UNION ALL SELECT id FROM public.civic_artifacts WHERE id = p_id
      UNION ALL SELECT id FROM public.civic_neighborhoods WHERE id = p_id
      UNION ALL SELECT id FROM public.civic_eras WHERE id = p_id
      UNION ALL SELECT id FROM public.civic_moments WHERE id = p_id
      UNION ALL SELECT id FROM public.civic_places WHERE id = p_id
    ) AS matches;
    IF v_matches <> 1 THEN
      RAISE EXCEPTION 'Civic object ID % is not unique across search sources', p_id;
    END IF;
  END IF;

  v_city_id := (v_row->>'city_id')::uuid;
  v_slug := v_row->>'slug';
  v_eligible := COALESCE((v_row->>'is_published')::boolean, false);
  IF p_source_table = 'civic_stories' THEN
    v_entity_type := 'story';
    v_eligible := v_eligible AND v_row->>'review_status' = 'published'
      AND (v_row->>'safety_hold')::boolean IS FALSE;
  END IF;

  IF v_eligible IS NOT TRUE THEN
    UPDATE public.search_index
    SET is_published = false, indexed_at = now()
    WHERE entity_id = p_id AND (
      (entity_type = v_entity_type AND facet = 'primary')
      OR (p_source_table = 'civic_eras' AND entity_type = 'codex' AND facet = 'codex')
    );
    RETURN;
  END IF;

  IF v_city_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.cities WHERE id = v_city_id) THEN
    RAISE EXCEPTION 'Eligible search source % % has no valid city', p_source_table, p_id;
  END IF;
  IF v_slug IS NULL OR v_slug !~ '^[A-Za-z0-9][A-Za-z0-9._~-]*$' THEN
    RAISE EXCEPTION 'Eligible search source % % has an unsafe slug', p_source_table, p_id;
  END IF;

  CASE p_source_table
    WHEN 'civic_entities' THEN
      v_title := v_row->>'name'; v_subtitle := v_row->>'entity_type';
      v_summary := v_row->>'description'; v_route_prefix := '/entities/';
      v_object_type := 'civic_entity';
    WHEN 'civic_events' THEN
      v_title := v_row->>'name'; v_subtitle := v_row->>'event_type';
      v_summary := v_row->>'description'; v_route_prefix := '/events/';
      v_object_type := 'civic_event';
    WHEN 'civic_artifacts' THEN
      v_title := v_row->>'title'; v_subtitle := v_row->>'artifact_type';
      v_summary := v_row->>'description'; v_route_prefix := '/artifacts/';
      v_object_type := 'civic_artifact';
    WHEN 'civic_neighborhoods' THEN
      v_title := v_row->>'name'; v_subtitle := 'Neighborhood';
      v_summary := v_row->>'description'; v_route_prefix := '/neighborhoods/';
      v_object_type := 'civic_neighborhood';
    WHEN 'civic_eras' THEN
      v_title := v_row->>'name'; v_subtitle := 'Era';
      v_summary := v_row->>'description'; v_route_prefix := '/eras/';
    WHEN 'civic_moments' THEN
      v_title := v_row->>'title'; v_subtitle := NULL;
      v_summary := v_row->>'body'; v_route_prefix := '/moments/';
      v_object_type := 'civic_moment';
    WHEN 'civic_places' THEN
      v_title := v_row->>'name'; v_subtitle := v_row->>'place_type';
      v_summary := v_row->>'description'; v_route_prefix := '/places/';
      v_object_type := 'civic_place';
    WHEN 'civic_stories' THEN
      v_title := v_row->>'title'; v_subtitle := v_row->>'category';
      v_summary := v_row->>'summary'; v_route_prefix := '/stories/';
      v_object_type := 'civic_story';
  END CASE;
  IF v_title IS NULL OR btrim(v_title) = '' THEN
    RAISE EXCEPTION 'Eligible search source % % has no title', p_source_table, p_id;
  END IF;
  v_summary := left(v_summary, 280);
  IF jsonb_typeof(v_row->'tags') = 'array' THEN
    SELECT COALESCE(array_agg(value ORDER BY ord), ARRAY[]::text[]) INTO v_keywords
    FROM jsonb_array_elements_text(v_row->'tags') WITH ORDINALITY AS tags(value, ord);
  END IF;
  v_updated := COALESCE((v_row->>'updated_at')::timestamptz,
                        (v_row->>'created_at')::timestamptz, now());

  SELECT m.url INTO v_thumbnail
  FROM public.civic_media_attachments a
  JOIN public.media_assets m ON m.id = a.media_asset_id
  WHERE a.city_id = v_city_id AND a.civic_object_id = p_id
    AND a.civic_object_type = v_object_type AND a.is_primary
    AND a.role IN ('thumbnail', 'hero')
  ORDER BY CASE a.role WHEN 'thumbnail' THEN 0 ELSE 1 END, a.id
  LIMIT 1;

  INSERT INTO public.search_index (
    entity_type, entity_id, city_id, title, subtitle, summary, keywords,
    thumbnail_url, route, search_vector, entity_weight, is_published,
    facet, source_updated_at, indexed_at
  ) VALUES (
    v_entity_type, p_id, v_city_id, v_title, v_subtitle, v_summary, v_keywords,
    v_thumbnail, v_route_prefix || v_slug,
    setweight(to_tsvector('english'::regconfig, v_title), 'A') ||
    setweight(to_tsvector('english'::regconfig, COALESCE(v_summary, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, array_to_string(v_keywords, ' ')), 'C'),
    CASE WHEN v_entity_type = 'story' THEN 1.00 ELSE 0.90 END,
    true, 'primary', v_updated, now()
  )
  ON CONFLICT (entity_type, entity_id, facet) DO UPDATE SET
    city_id = EXCLUDED.city_id, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle,
    summary = EXCLUDED.summary, keywords = EXCLUDED.keywords,
    thumbnail_url = EXCLUDED.thumbnail_url, route = EXCLUDED.route,
    search_vector = EXCLUDED.search_vector, entity_weight = EXCLUDED.entity_weight,
    is_published = EXCLUDED.is_published, source_updated_at = EXCLUDED.source_updated_at,
    indexed_at = EXCLUDED.indexed_at;

  IF p_source_table = 'civic_eras' THEN
    INSERT INTO public.search_index (
      entity_type, entity_id, city_id, title, subtitle, summary, keywords,
      thumbnail_url, route, search_vector, entity_weight, is_published,
      facet, source_updated_at, indexed_at
    )
    SELECT 'codex', entity_id, city_id, title, 'Codex', summary, keywords,
      thumbnail_url, '/codex/' || v_slug, search_vector, entity_weight,
      is_published, 'codex', source_updated_at, indexed_at
    FROM public.search_index
    WHERE entity_type = 'object' AND entity_id = p_id AND facet = 'primary'
    ON CONFLICT (entity_type, entity_id, facet) DO UPDATE SET
      city_id = EXCLUDED.city_id, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle,
      summary = EXCLUDED.summary, keywords = EXCLUDED.keywords,
      thumbnail_url = EXCLUDED.thumbnail_url, route = EXCLUDED.route,
      search_vector = EXCLUDED.search_vector, entity_weight = EXCLUDED.entity_weight,
      is_published = EXCLUDED.is_published, source_updated_at = EXCLUDED.source_updated_at,
      indexed_at = EXCLUDED.indexed_at;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_index_civic_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_entity_type text := CASE WHEN TG_TABLE_NAME = 'civic_stories' THEN 'story' ELSE 'object' END;
  v_old_id uuid;
BEGIN
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.id IS DISTINCT FROM NEW.id) THEN
    v_old_id := OLD.id;
    PERFORM pg_advisory_xact_lock(hashtextextended(v_old_id::text, 0));
    UPDATE public.search_index
    SET is_published = false, indexed_at = now()
    WHERE entity_id = v_old_id AND (
      (entity_type = v_entity_type AND facet = 'primary')
      OR (TG_TABLE_NAME = 'civic_eras' AND entity_type = 'codex' AND facet = 'codex')
    );
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  PERFORM public.search_index_civic_record(TG_TABLE_NAME, NEW.id);
  RETURN NEW;
END;
$function$;

-- Preserve the existing single-record RPC signature for civic records.
CREATE OR REPLACE FUNCTION public.search_index_entity(p_entity_type text, p_entity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_source text;
  v_count integer;
BEGIN
  IF p_entity_type = 'story' THEN
    PERFORM public.search_index_civic_record('civic_stories', p_entity_id);
    RETURN;
  ELSIF p_entity_type = 'codex' THEN
    PERFORM public.search_index_civic_record('civic_eras', p_entity_id);
    RETURN;
  ELSIF p_entity_type IS DISTINCT FROM 'object' OR p_entity_id IS NULL THEN
    RAISE EXCEPTION 'Unsupported search index type or missing ID: %', p_entity_type;
  END IF;

  SELECT count(*), min(source) INTO v_count, v_source
  FROM (
    SELECT 'civic_entities' AS source FROM public.civic_entities WHERE id = p_entity_id
    UNION ALL SELECT 'civic_events' FROM public.civic_events WHERE id = p_entity_id
    UNION ALL SELECT 'civic_artifacts' FROM public.civic_artifacts WHERE id = p_entity_id
    UNION ALL SELECT 'civic_neighborhoods' FROM public.civic_neighborhoods WHERE id = p_entity_id
    UNION ALL SELECT 'civic_eras' FROM public.civic_eras WHERE id = p_entity_id
    UNION ALL SELECT 'civic_moments' FROM public.civic_moments WHERE id = p_entity_id
    UNION ALL SELECT 'civic_places' FROM public.civic_places WHERE id = p_entity_id
  ) matches;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Object % has % matching search sources', p_entity_id, v_count;
  END IF;
  PERFORM public.search_index_civic_record(v_source, p_entity_id);
END;
$function$;

-- The legacy full rebuild deletes the index before referencing nonexistent tables.
-- Reconciliation is a separate, reviewed operation; do not silently run it here.
CREATE OR REPLACE FUNCTION public.search_reindex_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION 'Legacy full search rebuild is unavailable; use reviewed civic reconciliation';
END;
$function$;

REVOKE ALL ON FUNCTION public.search_index_civic_record(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_index_civic_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_index_entity(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_index_story_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_reindex_all() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_index_entity(text, uuid) TO service_role;

DROP TRIGGER trg_search_index_story ON public.civic_entities;
DROP TRIGGER trg_search_index_story ON public.civic_events;
DROP TRIGGER trg_search_index_story ON public.civic_artifacts;
DROP TRIGGER trg_search_index_story ON public.civic_neighborhoods;
DROP TRIGGER trg_search_index_story ON public.civic_eras;
DROP TRIGGER trg_search_index_story ON public.civic_moments;
DROP TRIGGER trg_search_index_story ON public.civic_stories;

CREATE TRIGGER trg_sync_search_civic_entities AFTER INSERT OR UPDATE OR DELETE ON public.civic_entities
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();
CREATE TRIGGER trg_sync_search_civic_events AFTER INSERT OR UPDATE OR DELETE ON public.civic_events
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();
CREATE TRIGGER trg_sync_search_civic_artifacts AFTER INSERT OR UPDATE OR DELETE ON public.civic_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();
CREATE TRIGGER trg_sync_search_civic_neighborhoods AFTER INSERT OR UPDATE OR DELETE ON public.civic_neighborhoods
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();
CREATE TRIGGER trg_sync_search_civic_eras AFTER INSERT OR UPDATE OR DELETE ON public.civic_eras
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();
CREATE TRIGGER trg_sync_search_civic_moments AFTER INSERT OR UPDATE OR DELETE ON public.civic_moments
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();
CREATE TRIGGER trg_sync_search_civic_places AFTER INSERT OR UPDATE OR DELETE ON public.civic_places
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();
CREATE TRIGGER trg_sync_search_civic_stories AFTER INSERT OR UPDATE OR DELETE ON public.civic_stories
  FOR EACH ROW EXECUTE FUNCTION public.search_index_civic_trigger();

COMMIT;
