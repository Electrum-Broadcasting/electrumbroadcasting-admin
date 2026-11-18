BEGIN;

CREATE FUNCTION public.relationship_authorize_mutation(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_object_type text,
  p_object_id uuid,
  p_is_source boolean
)
RETURNS text
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_object_city_id uuid;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL
     OR p_expected_city_id IS NULL OR p_object_id IS NULL
     OR p_object_type IS NULL OR p_is_source IS NULL THEN
    RAISE EXCEPTION 'Missing relationship authorization input';
  END IF;

  SELECT * INTO v_admin
  FROM public.admin_users
  WHERE id = p_actor_admin_id
  FOR SHARE;

  IF NOT FOUND
     OR v_admin.auth_uid IS DISTINCT FROM p_actor_auth_uid::text
     OR v_admin.status IS DISTINCT FROM 'active'
     OR v_admin.role IS NULL
     OR v_admin.role NOT IN ('CITY_ADMIN', 'CEO', 'PLATFORM_ADMIN') THEN
    RAISE EXCEPTION 'Actor is not an active relationship administrator';
  END IF;

  IF v_admin.role = 'CITY_ADMIN'
     AND NOT (p_expected_city_id::text = ANY(COALESCE(v_admin.city_ids, ARRAY[]::text[]))) THEN
    RAISE EXCEPTION 'Expected city is outside the administrator city scope';
  END IF;

  PERFORM 1 FROM public.cities WHERE id = p_expected_city_id FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship city not found';
  END IF;

  IF p_object_type = 'entity' THEN
    IF p_is_source THEN
      SELECT city_id INTO v_object_city_id FROM public.civic_entities
      WHERE id = p_object_id FOR UPDATE;
    ELSE
      SELECT city_id INTO v_object_city_id FROM public.civic_entities
      WHERE id = p_object_id FOR KEY SHARE;
    END IF;
  ELSIF p_object_type = 'event' THEN
    IF p_is_source THEN
      SELECT city_id INTO v_object_city_id FROM public.civic_events
      WHERE id = p_object_id FOR UPDATE;
    ELSE
      SELECT city_id INTO v_object_city_id FROM public.civic_events
      WHERE id = p_object_id FOR KEY SHARE;
    END IF;
  ELSIF p_object_type = 'artifact' THEN
    IF p_is_source THEN
      SELECT city_id INTO v_object_city_id FROM public.civic_artifacts
      WHERE id = p_object_id FOR UPDATE;
    ELSE
      SELECT city_id INTO v_object_city_id FROM public.civic_artifacts
      WHERE id = p_object_id FOR KEY SHARE;
    END IF;
  ELSIF p_object_type = 'neighborhood' THEN
    IF p_is_source THEN
      SELECT city_id INTO v_object_city_id FROM public.civic_neighborhoods
      WHERE id = p_object_id FOR UPDATE;
    ELSE
      SELECT city_id INTO v_object_city_id FROM public.civic_neighborhoods
      WHERE id = p_object_id FOR KEY SHARE;
    END IF;
  ELSIF p_object_type = 'era' THEN
    IF p_is_source THEN
      SELECT city_id INTO v_object_city_id FROM public.civic_eras
      WHERE id = p_object_id FOR UPDATE;
    ELSE
      SELECT city_id INTO v_object_city_id FROM public.civic_eras
      WHERE id = p_object_id FOR KEY SHARE;
    END IF;
  ELSIF p_object_type = 'moment' THEN
    IF p_is_source THEN
      SELECT city_id INTO v_object_city_id FROM public.civic_moments
      WHERE id = p_object_id FOR UPDATE;
    ELSE
      SELECT city_id INTO v_object_city_id FROM public.civic_moments
      WHERE id = p_object_id FOR KEY SHARE;
    END IF;
  ELSIF p_object_type = 'place' THEN
    IF p_is_source THEN
      SELECT city_id INTO v_object_city_id FROM public.civic_places
      WHERE id = p_object_id FOR UPDATE;
    ELSE
      SELECT city_id INTO v_object_city_id FROM public.civic_places
      WHERE id = p_object_id FOR KEY SHARE;
    END IF;
  ELSIF p_object_type = 'story' AND NOT p_is_source THEN
    -- Story links require a role allowed by the Story workflow as well as the
    -- Moment source check; unpublished state does not block an admin link.
    SELECT city_id INTO v_object_city_id FROM public.civic_stories
    WHERE id = p_object_id FOR KEY SHARE;
  ELSE
    RAISE EXCEPTION 'Unsupported relationship object type: %', p_object_type;
  END IF;

  IF NOT FOUND OR v_object_city_id IS NULL THEN
    RAISE EXCEPTION 'Relationship object not found or has no city';
  END IF;
  IF v_object_city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Relationship object is outside the expected city';
  END IF;

  RETURN v_admin.role;
END;
$function$;

CREATE FUNCTION public.relationship_diff(
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
  v_key text;
  v_id_text text;
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
    v_seen := ARRAY[]::text[];
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
        v_key := v_item->>'type' || ':' || v_item->>'id';
        v_id_text := v_item->>'id';
      ELSIF p_family = 'moment_entities' THEN
        IF (v_item - ARRAY['id', 'role']) <> '{}'::jsonb
           OR pg_catalog.jsonb_typeof(v_item->'id') IS DISTINCT FROM 'string'
           OR NOT (v_item ? 'role')
           OR pg_catalog.jsonb_typeof(v_item->'role') NOT IN ('string', 'null') THEN
          RAISE EXCEPTION 'Invalid Moment-Entity relationship entry';
        END IF;
        v_key := v_item->>'id';
        v_id_text := v_item->>'id';
      ELSE
        IF (v_item - ARRAY['id']) <> '{}'::jsonb
           OR pg_catalog.jsonb_typeof(v_item->'id') IS DISTINCT FROM 'string' THEN
          RAISE EXCEPTION 'Invalid relationship target entry for family %', p_family;
        END IF;
        v_key := v_item->>'id';
        v_id_text := v_item->>'id';
      END IF;

      IF v_key IS NULL OR v_key = '' THEN
        RAISE EXCEPTION 'Relationship target identifier is required';
      END IF;
      PERFORM v_id_text::uuid;
      IF v_key = ANY(v_seen) THEN
        RAISE EXCEPTION 'Duplicate relationship target: %', v_key;
      END IF;
      v_seen := pg_catalog.array_append(v_seen, v_key);
    END LOOP;
  END LOOP;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(requested.value ORDER BY requested.value::text),
    '[]'::jsonb
  ) INTO v_added
  FROM pg_catalog.jsonb_array_elements(p_requested) AS requested(value)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_catalog.jsonb_array_elements(p_current) AS current(value)
    WHERE current.value = requested.value
  );

  SELECT COALESCE(
    pg_catalog.jsonb_agg(current.value ORDER BY current.value::text),
    '[]'::jsonb
  ) INTO v_removed
  FROM pg_catalog.jsonb_array_elements(p_current) AS current(value)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_catalog.jsonb_array_elements(p_requested) AS requested(value)
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

CREATE FUNCTION public.relationship_write_audit(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_actor_role text,
  p_entity_type text,
  p_entity_id uuid,
  p_city_id uuid,
  p_idempotency_key uuid,
  p_changes jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
DECLARE
  v_audit_id uuid;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL
     OR p_actor_role IS NULL
     OR p_actor_role NOT IN ('CITY_ADMIN', 'CEO', 'PLATFORM_ADMIN')
     OR p_entity_type IS NULL
     OR p_entity_type NOT IN (
       'civic_entities', 'civic_events', 'civic_artifacts',
       'civic_neighborhoods', 'civic_eras', 'civic_moments', 'civic_places'
     )
     OR p_entity_id IS NULL OR p_city_id IS NULL OR p_idempotency_key IS NULL
     OR p_changes IS NULL OR pg_catalog.jsonb_typeof(p_changes) <> 'object' THEN
    RAISE EXCEPTION 'Invalid relationship audit arguments';
  END IF;

  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action,
    domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, p_actor_role,
    'relationship_set_replaced', 'relationship', p_entity_type, p_entity_id,
    pg_catalog.jsonb_build_object(
      'city_id', p_city_id,
      'idempotency_key', p_idempotency_key,
      'changes', p_changes
    )
  )
  RETURNING id INTO v_audit_id;

  IF v_audit_id IS NULL THEN
    RAISE EXCEPTION 'Relationship audit entry was not persisted';
  END IF;
  RETURN v_audit_id;
END;
$function$;

ALTER FUNCTION public.relationship_authorize_mutation(uuid, uuid, uuid, text, uuid, boolean)
  OWNER TO postgres;
ALTER FUNCTION public.relationship_diff(text, jsonb, jsonb) OWNER TO postgres;
ALTER FUNCTION public.relationship_write_audit(uuid, uuid, text, text, uuid, uuid, uuid, jsonb)
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.relationship_authorize_mutation(uuid, uuid, uuid, text, uuid, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.relationship_diff(text, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.relationship_write_audit(uuid, uuid, text, text, uuid, uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

DO $check_relationship_helpers$
DECLARE
  v_function oid;
BEGIN
  FOREACH v_function IN ARRAY ARRAY[
    'public.relationship_authorize_mutation(uuid,uuid,uuid,text,uuid,boolean)'::regprocedure::oid,
    'public.relationship_diff(text,jsonb,jsonb)'::regprocedure::oid,
    'public.relationship_write_audit(uuid,uuid,text,text,uuid,uuid,uuid,jsonb)'::regprocedure::oid
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc AS p
      WHERE p.oid = v_function
        AND p.proowner = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres')
        AND p.prosecdef IS FALSE
        AND p.proconfig @> ARRAY['search_path=pg_catalog']::text[]
    ) THEN
      RAISE EXCEPTION 'Relationship helper ownership or security configuration is invalid';
    END IF;
    IF pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
       OR pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
       OR pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE')
       OR EXISTS (
         SELECT 1
         FROM pg_catalog.pg_proc AS p
         CROSS JOIN LATERAL pg_catalog.aclexplode(
           COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
         ) AS acl
         WHERE p.oid = v_function AND acl.grantee <> p.proowner
       ) THEN
      RAISE EXCEPTION 'Relationship helpers must not be directly executable';
    END IF;
  END LOOP;
END;
$check_relationship_helpers$;

COMMIT;
