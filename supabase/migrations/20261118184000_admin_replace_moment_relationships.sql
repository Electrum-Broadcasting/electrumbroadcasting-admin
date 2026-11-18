BEGIN;

CREATE FUNCTION public.admin_replace_moment_relationships(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_moment_id uuid,
  p_entity_links jsonb,
  p_era_ids uuid[],
  p_place_ids uuid[],
  p_neighborhood_ids uuid[],
  p_story_ids uuid[],
  p_idempotency_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_target jsonb;
  v_entity_requested jsonb;
  v_era_requested jsonb;
  v_place_requested jsonb;
  v_neighborhood_requested jsonb;
  v_story_requested jsonb;
  v_entity_current jsonb;
  v_era_current jsonb;
  v_place_current jsonb;
  v_neighborhood_current jsonb;
  v_story_current jsonb;
  v_entity_diff jsonb;
  v_era_diff jsonb;
  v_place_diff jsonb;
  v_neighborhood_diff jsonb;
  v_story_diff jsonb;
  v_changes jsonb;
  v_request jsonb;
  v_request_hash bytea;
  v_saved_hash bytea;
  v_saved_response jsonb;
  v_response jsonb;
  v_audit_id uuid;
  v_rows integer;
  v_added_count integer;
  v_removed_count integer;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL
     OR p_expected_city_id IS NULL OR p_moment_id IS NULL
     OR p_entity_links IS NULL OR pg_catalog.jsonb_typeof(p_entity_links) <> 'array'
     OR p_era_ids IS NULL OR p_place_ids IS NULL
     OR p_neighborhood_ids IS NULL OR p_story_ids IS NULL
     OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Missing Moment relationship replacement input';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.unnest(p_era_ids || p_place_ids || p_neighborhood_ids || p_story_ids) AS target(id)
    WHERE target.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Moment relationship target identifiers cannot be null';
  END IF;

  LOCK TABLE
    public.moment_entities,
    public.moment_eras,
    public.moment_neighborhoods,
    public.moment_places,
    public.moment_stories
  IN SHARE ROW EXCLUSIVE MODE;

  v_role := public.relationship_authorize_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id,
    'moment', p_moment_id, true
  );

  SELECT COALESCE(
    pg_catalog.jsonb_agg(target.value ORDER BY target.value->>'id'),
    '[]'::jsonb
  ) INTO v_entity_requested
  FROM pg_catalog.jsonb_array_elements(p_entity_links) AS target(value);
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', target.id::text) ORDER BY target.id),
    '[]'::jsonb
  ) INTO v_era_requested FROM pg_catalog.unnest(p_era_ids) AS target(id);
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', target.id::text) ORDER BY target.id),
    '[]'::jsonb
  ) INTO v_place_requested FROM pg_catalog.unnest(p_place_ids) AS target(id);
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', target.id::text) ORDER BY target.id),
    '[]'::jsonb
  ) INTO v_neighborhood_requested FROM pg_catalog.unnest(p_neighborhood_ids) AS target(id);
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', target.id::text) ORDER BY target.id),
    '[]'::jsonb
  ) INTO v_story_requested FROM pg_catalog.unnest(p_story_ids) AS target(id);

  PERFORM public.relationship_diff('moment_entities', '[]'::jsonb, v_entity_requested);
  PERFORM public.relationship_diff('moment_eras', '[]'::jsonb, v_era_requested);
  PERFORM public.relationship_diff('moment_places', '[]'::jsonb, v_place_requested);
  PERFORM public.relationship_diff('moment_neighborhoods', '[]'::jsonb, v_neighborhood_requested);
  PERFORM public.relationship_diff('moment_stories', '[]'::jsonb, v_story_requested);

  v_request := pg_catalog.jsonb_build_object(
    'actor_auth_uid', p_actor_auth_uid,
    'city_id', p_expected_city_id,
    'moment_id', p_moment_id,
    'moment_entities', v_entity_requested,
    'moment_eras', v_era_requested,
    'moment_places', v_place_requested,
    'moment_neighborhoods', v_neighborhood_requested,
    'moment_stories', v_story_requested
  );
  v_request_hash := extensions.digest(
    pg_catalog.convert_to(v_request::text, 'UTF8'), 'sha256'
  );

  INSERT INTO public.relationship_governance_idempotency (
    actor_admin_id, rpc_name, idempotency_key, request_hash
  ) VALUES (
    p_actor_admin_id, 'admin_replace_moment_relationships',
    p_idempotency_key, v_request_hash
  )
  ON CONFLICT (actor_admin_id, rpc_name, idempotency_key) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    SELECT request_hash, response
    INTO v_saved_hash, v_saved_response
    FROM public.relationship_governance_idempotency
    WHERE actor_admin_id = p_actor_admin_id
      AND rpc_name = 'admin_replace_moment_relationships'
      AND idempotency_key = p_idempotency_key
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Idempotency receipt disappeared';
    END IF;
    IF v_saved_hash IS DISTINCT FROM v_request_hash THEN
      RAISE EXCEPTION 'Idempotency key was already used with a different request';
    END IF;
    IF v_saved_response IS NULL THEN
      RAISE EXCEPTION 'Idempotency receipt is incomplete';
    END IF;
    RETURN v_saved_response;
  END IF;

  FOR v_target IN
    SELECT requested.value
    FROM (
      SELECT pg_catalog.jsonb_build_object(
        'target_type', 'entity', 'target_id', value->>'id'
      ) AS value
      FROM pg_catalog.jsonb_array_elements(v_entity_requested) AS entities(value)
      UNION ALL
      SELECT pg_catalog.jsonb_build_object(
        'target_type', 'era', 'target_id', value->>'id'
      )
      FROM pg_catalog.jsonb_array_elements(v_era_requested) AS eras(value)
      UNION ALL
      SELECT pg_catalog.jsonb_build_object(
        'target_type', 'place', 'target_id', value->>'id'
      )
      FROM pg_catalog.jsonb_array_elements(v_place_requested) AS places(value)
      UNION ALL
      SELECT pg_catalog.jsonb_build_object(
        'target_type', 'neighborhood', 'target_id', value->>'id'
      )
      FROM pg_catalog.jsonb_array_elements(v_neighborhood_requested) AS neighborhoods(value)
      UNION ALL
      SELECT pg_catalog.jsonb_build_object(
        'target_type', 'story', 'target_id', value->>'id'
      )
      FROM pg_catalog.jsonb_array_elements(v_story_requested) AS stories(value)
    ) AS requested
    ORDER BY requested.value->>'target_type', requested.value->>'target_id'
  LOOP
    PERFORM public.relationship_authorize_mutation(
      p_actor_admin_id, p_actor_auth_uid, p_expected_city_id,
      v_target->>'target_type', (v_target->>'target_id')::uuid, false
    );
  END LOOP;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id', link.entity_id::text, 'role', link.role)
      ORDER BY link.entity_id, link.role
    ),
    '[]'::jsonb
  ) INTO v_entity_current
  FROM public.moment_entities AS link
  WHERE link.moment_id = p_moment_id;
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', link.era_id::text) ORDER BY link.era_id),
    '[]'::jsonb
  ) INTO v_era_current
  FROM public.moment_eras AS link WHERE link.moment_id = p_moment_id;
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', link.place_id::text) ORDER BY link.place_id),
    '[]'::jsonb
  ) INTO v_place_current
  FROM public.moment_places AS link WHERE link.moment_id = p_moment_id;
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', link.neighborhood_id::text)
      ORDER BY link.neighborhood_id),
    '[]'::jsonb
  ) INTO v_neighborhood_current
  FROM public.moment_neighborhoods AS link WHERE link.moment_id = p_moment_id;
  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', link.story_id::text) ORDER BY link.story_id),
    '[]'::jsonb
  ) INTO v_story_current
  FROM public.moment_stories AS link WHERE link.moment_id = p_moment_id;

  v_entity_diff := public.relationship_diff('moment_entities', v_entity_current, v_entity_requested);
  v_era_diff := public.relationship_diff('moment_eras', v_era_current, v_era_requested);
  v_place_diff := public.relationship_diff('moment_places', v_place_current, v_place_requested);
  v_neighborhood_diff := public.relationship_diff(
    'moment_neighborhoods', v_neighborhood_current, v_neighborhood_requested
  );
  v_story_diff := public.relationship_diff('moment_stories', v_story_current, v_story_requested);

  v_added_count :=
      (v_entity_diff->>'addedCount')::integer
    + (v_era_diff->>'addedCount')::integer
    + (v_place_diff->>'addedCount')::integer
    + (v_neighborhood_diff->>'addedCount')::integer
    + (v_story_diff->>'addedCount')::integer;
  v_removed_count :=
      (v_entity_diff->>'removedCount')::integer
    + (v_era_diff->>'removedCount')::integer
    + (v_place_diff->>'removedCount')::integer
    + (v_neighborhood_diff->>'removedCount')::integer
    + (v_story_diff->>'removedCount')::integer;

  IF v_added_count = 0 AND v_removed_count = 0 THEN
    v_response := pg_catalog.jsonb_build_object(
      'sourceId', p_moment_id,
      'cityId', p_expected_city_id,
      'changed', false,
      'auditId', NULL,
      'addedCount', 0,
      'removedCount', 0
    );
  ELSE
    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_entity_diff->'removed') AS removed(value)
    LOOP
      DELETE FROM public.moment_entities
      WHERE moment_id = p_moment_id AND entity_id = (v_target->>'id')::uuid;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN RAISE EXCEPTION 'Moment-Entity relationship changed concurrently'; END IF;
    END LOOP;
    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_entity_diff->'added') AS added(value)
    LOOP
      INSERT INTO public.moment_entities (moment_id, entity_id, role, created_at, updated_at)
      VALUES (
        p_moment_id, (v_target->>'id')::uuid,
        CASE WHEN pg_catalog.jsonb_typeof(v_target->'role') = 'null'
          THEN NULL ELSE v_target->>'role' END,
        pg_catalog.now(), pg_catalog.now()
      );
    END LOOP;

    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_era_diff->'removed') AS removed(value)
    LOOP
      DELETE FROM public.moment_eras
      WHERE moment_id = p_moment_id AND era_id = (v_target->>'id')::uuid;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN RAISE EXCEPTION 'Moment-Era relationship changed concurrently'; END IF;
    END LOOP;
    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_era_diff->'added') AS added(value)
    LOOP
      INSERT INTO public.moment_eras (id, moment_id, era_id)
      VALUES (pg_catalog.gen_random_uuid(), p_moment_id, (v_target->>'id')::uuid);
    END LOOP;

    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_place_diff->'removed') AS removed(value)
    LOOP
      DELETE FROM public.moment_places
      WHERE moment_id = p_moment_id AND place_id = (v_target->>'id')::uuid;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN RAISE EXCEPTION 'Moment-Place relationship changed concurrently'; END IF;
    END LOOP;
    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_place_diff->'added') AS added(value)
    LOOP
      INSERT INTO public.moment_places (id, moment_id, place_id)
      VALUES (pg_catalog.gen_random_uuid(), p_moment_id, (v_target->>'id')::uuid);
    END LOOP;

    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_neighborhood_diff->'removed') AS removed(value)
    LOOP
      DELETE FROM public.moment_neighborhoods
      WHERE moment_id = p_moment_id AND neighborhood_id = (v_target->>'id')::uuid;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN RAISE EXCEPTION 'Moment-Neighborhood relationship changed concurrently'; END IF;
    END LOOP;
    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_neighborhood_diff->'added') AS added(value)
    LOOP
      INSERT INTO public.moment_neighborhoods (id, moment_id, neighborhood_id)
      VALUES (pg_catalog.gen_random_uuid(), p_moment_id, (v_target->>'id')::uuid);
    END LOOP;

    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_story_diff->'removed') AS removed(value)
    LOOP
      DELETE FROM public.moment_stories
      WHERE moment_id = p_moment_id AND story_id = (v_target->>'id')::uuid;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN RAISE EXCEPTION 'Moment-Story relationship changed concurrently'; END IF;
    END LOOP;
    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_story_diff->'added') AS added(value)
    LOOP
      INSERT INTO public.moment_stories (moment_id, story_id, created_at, updated_at)
      VALUES (p_moment_id, (v_target->>'id')::uuid, pg_catalog.now(), pg_catalog.now());
    END LOOP;

    v_changes := pg_catalog.jsonb_build_object(
      'families', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'family', 'moment_entities',
          'added', v_entity_diff->'added', 'removed', v_entity_diff->'removed'
        ),
        pg_catalog.jsonb_build_object(
          'family', 'moment_eras',
          'added', v_era_diff->'added', 'removed', v_era_diff->'removed'
        ),
        pg_catalog.jsonb_build_object(
          'family', 'moment_places',
          'added', v_place_diff->'added', 'removed', v_place_diff->'removed'
        ),
        pg_catalog.jsonb_build_object(
          'family', 'moment_neighborhoods',
          'added', v_neighborhood_diff->'added', 'removed', v_neighborhood_diff->'removed'
        ),
        pg_catalog.jsonb_build_object(
          'family', 'moment_stories',
          'added', v_story_diff->'added', 'removed', v_story_diff->'removed'
        )
      )
    );
    v_audit_id := public.relationship_write_audit(
      p_actor_admin_id, p_actor_auth_uid, v_role,
      'civic_moments', p_moment_id, p_expected_city_id, p_idempotency_key, v_changes
    );
    v_response := pg_catalog.jsonb_build_object(
      'sourceId', p_moment_id,
      'cityId', p_expected_city_id,
      'changed', true,
      'auditId', v_audit_id,
      'addedCount', v_added_count,
      'removedCount', v_removed_count
    );
  END IF;

  UPDATE public.relationship_governance_idempotency
  SET response = v_response
  WHERE actor_admin_id = p_actor_admin_id
    AND rpc_name = 'admin_replace_moment_relationships'
    AND idempotency_key = p_idempotency_key
    AND response IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Unable to persist Moment relationship idempotency receipt';
  END IF;

  RETURN v_response;
END;
$function$;

ALTER FUNCTION public.admin_replace_moment_relationships(
  uuid, uuid, uuid, uuid, jsonb, uuid[], uuid[], uuid[], uuid[], uuid
) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_replace_moment_relationships(
  uuid, uuid, uuid, uuid, jsonb, uuid[], uuid[], uuid[], uuid[], uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_replace_moment_relationships(
  uuid, uuid, uuid, uuid, jsonb, uuid[], uuid[], uuid[], uuid[], uuid
) TO service_role;

DO $check_moment_rpc$
DECLARE
  v_function oid := 'public.admin_replace_moment_relationships(uuid,uuid,uuid,uuid,jsonb,uuid[],uuid[],uuid[],uuid[],uuid)'::regprocedure;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = v_function
      AND p.proowner = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres')
      AND p.prosecdef
      AND p.proconfig @> ARRAY['search_path=pg_catalog']::text[]
  ) OR pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
    OR pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE')
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS p
      CROSS JOIN LATERAL pg_catalog.aclexplode(
        COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
      ) AS acl
      WHERE p.oid = v_function
        AND acl.grantee NOT IN (
          p.proowner, (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
        )
    ) THEN
    RAISE EXCEPTION 'Moment relationship RPC security configuration is invalid';
  END IF;
END;
$check_moment_rpc$;

COMMIT;
