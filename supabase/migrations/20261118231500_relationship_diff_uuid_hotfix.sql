BEGIN;

CREATE OR REPLACE FUNCTION public.relationship_diff(
  p_family text,
  p_current jsonb,
  p_requested jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
DECLARE
  v_item jsonb;
  v_set jsonb;
  v_normalized jsonb;
  v_current jsonb;
  v_requested jsonb;
  v_set_index integer := 0;
  v_key text;
  v_id uuid;
  v_seen text[] := ARRAY[]::text[];
  v_added jsonb;
  v_removed jsonb;
BEGIN
  IF p_family IS NULL OR p_family NOT IN (
       'civic_relationships', 'event_eras', 'moment_entities',
       'moment_eras', 'moment_places', 'moment_neighborhoods', 'moment_stories'
     )
     OR p_current IS NULL OR pg_catalog.jsonb_typeof(p_current) <> 'array'
     OR p_requested IS NULL OR pg_catalog.jsonb_typeof(p_requested) <> 'array' THEN
    RAISE EXCEPTION 'Invalid relationship diff input';
  END IF;

  FOREACH v_set IN ARRAY ARRAY[p_current, p_requested] LOOP
    v_set_index := v_set_index + 1;
    v_seen := ARRAY[]::text[];
    v_normalized := '[]'::jsonb;
    FOR v_item IN SELECT value FROM pg_catalog.jsonb_array_elements(v_set) LOOP
      IF pg_catalog.jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'Relationship entries must be objects';
      END IF;

      IF p_family = 'civic_relationships' THEN
        IF (v_item - ARRAY['type', 'id']) <> '{}'::jsonb
           OR pg_catalog.jsonb_typeof(v_item->'type') IS DISTINCT FROM 'string'
           OR pg_catalog.jsonb_typeof(v_item->'id') IS DISTINCT FROM 'string'
           OR v_item->>'type' NOT IN (
             'entity', 'event', 'artifact', 'neighborhood', 'era', 'moment', 'place'
           ) THEN
          RAISE EXCEPTION 'Invalid or unsupported civic relationship endpoint';
        END IF;
      ELSIF p_family = 'moment_entities' THEN
        IF (v_item - ARRAY['id', 'role']) <> '{}'::jsonb
           OR pg_catalog.jsonb_typeof(v_item->'id') IS DISTINCT FROM 'string'
           OR NOT (v_item ? 'role')
           OR pg_catalog.jsonb_typeof(v_item->'role') NOT IN ('string', 'null') THEN
          RAISE EXCEPTION 'Invalid Moment-Entity relationship entry';
        END IF;
      ELSE
        IF (v_item - ARRAY['id']) <> '{}'::jsonb
           OR pg_catalog.jsonb_typeof(v_item->'id') IS DISTINCT FROM 'string' THEN
          RAISE EXCEPTION 'Invalid relationship target entry for family %', p_family;
        END IF;
      END IF;

      IF v_item->>'id' = '' THEN
        RAISE EXCEPTION 'Relationship target identifier is required';
      END IF;
      v_id := (v_item->>'id')::uuid;
      v_key := CASE WHEN p_family = 'civic_relationships'
        THEN (v_item->>'type') || ':' || v_id::text
        ELSE v_id::text
      END;
      IF v_key = ANY(v_seen) THEN
        RAISE EXCEPTION 'Duplicate relationship target: %', v_key;
      END IF;
      v_seen := pg_catalog.array_append(v_seen, v_key);
      v_normalized := v_normalized || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_set(v_item, ARRAY['id'], pg_catalog.to_jsonb(v_id::text))
      );
    END LOOP;

    IF v_set_index = 1 THEN
      v_current := v_normalized;
    ELSE
      v_requested := v_normalized;
    END IF;
  END LOOP;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(requested.value ORDER BY requested.value::text),
    '[]'::jsonb
  ) INTO v_added
  FROM pg_catalog.jsonb_array_elements(v_requested) AS requested(value)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_catalog.jsonb_array_elements(v_current) AS current(value)
    WHERE current.value = requested.value
  );

  SELECT COALESCE(
    pg_catalog.jsonb_agg(current.value ORDER BY current.value::text),
    '[]'::jsonb
  ) INTO v_removed
  FROM pg_catalog.jsonb_array_elements(v_current) AS current(value)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_catalog.jsonb_array_elements(v_requested) AS requested(value)
    WHERE requested.value = current.value
  );

  RETURN pg_catalog.jsonb_build_object(
    'added', v_added,
    'removed', v_removed,
    'addedCount', pg_catalog.jsonb_array_length(v_added),
    'removedCount', pg_catalog.jsonb_array_length(v_removed)
  );
END;
$function$;

COMMIT;
