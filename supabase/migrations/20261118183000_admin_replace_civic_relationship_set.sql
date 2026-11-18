BEGIN;

CREATE FUNCTION public.admin_replace_civic_relationship_set(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_targets jsonb,
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
  v_requested jsonb;
  v_current jsonb;
  v_diff jsonb;
  v_changes jsonb;
  v_request jsonb;
  v_request_hash bytea;
  v_saved_hash bytea;
  v_saved_response jsonb;
  v_response jsonb;
  v_audit_id uuid;
  v_entity_type text;
  v_rows integer;
  v_added_count integer;
  v_removed_count integer;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL
     OR p_expected_city_id IS NULL OR p_source_id IS NULL
     OR p_idempotency_key IS NULL OR p_targets IS NULL
     OR pg_catalog.jsonb_typeof(p_targets) <> 'array' THEN
    RAISE EXCEPTION 'Missing civic relationship replacement input';
  END IF;
  IF p_source_type IS NULL OR p_source_type NOT IN (
    'entity', 'event', 'artifact', 'neighborhood', 'era', 'moment', 'place'
  ) THEN
    RAISE EXCEPTION 'Unsupported civic relationship source type';
  END IF;

  LOCK TABLE public.civic_relationships IN SHARE ROW EXCLUSIVE MODE;

  v_role := public.relationship_authorize_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id,
    p_source_type, p_source_id, true
  );
  v_diff := public.relationship_diff('civic_relationships', '[]'::jsonb, p_targets);
  SELECT COALESCE(
    pg_catalog.jsonb_agg(target.value ORDER BY target.value->>'type', target.value->>'id'),
    '[]'::jsonb
  ) INTO v_requested
  FROM pg_catalog.jsonb_array_elements(p_targets) AS target(value);

  v_request := pg_catalog.jsonb_build_object(
    'actor_auth_uid', p_actor_auth_uid,
    'city_id', p_expected_city_id,
    'source_type', p_source_type,
    'source_id', p_source_id,
    'targets', v_requested
  );
  v_request_hash := extensions.digest(
    pg_catalog.convert_to(v_request::text, 'UTF8'), 'sha256'
  );

  INSERT INTO public.relationship_governance_idempotency (
    actor_admin_id, rpc_name, idempotency_key, request_hash
  ) VALUES (
    p_actor_admin_id, 'admin_replace_civic_relationship_set',
    p_idempotency_key, v_request_hash
  )
  ON CONFLICT (actor_admin_id, rpc_name, idempotency_key) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    SELECT request_hash, response
    INTO v_saved_hash, v_saved_response
    FROM public.relationship_governance_idempotency
    WHERE actor_admin_id = p_actor_admin_id
      AND rpc_name = 'admin_replace_civic_relationship_set'
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
    SELECT value
    FROM pg_catalog.jsonb_array_elements(v_requested) AS requested(value)
    ORDER BY value->>'type', value->>'id'
  LOOP
    PERFORM public.relationship_authorize_mutation(
      p_actor_admin_id, p_actor_auth_uid, p_expected_city_id,
      v_target->>'type', (v_target->>'id')::uuid, false
    );
  END LOOP;

  -- This RPC owns only its civic allowlist. Legacy Story and unknown-type
  -- edges remain untouched for their separate workflow or later remediation.
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('type', link.to_type, 'id', link.to_id::text)
      ORDER BY link.to_type, link.to_id
    ),
    '[]'::jsonb
  ) INTO v_current
  FROM public.civic_relationships AS link
  WHERE link.from_type = p_source_type
    AND link.from_id = p_source_id
    AND link.to_type IN (
      'entity', 'event', 'artifact', 'neighborhood', 'era', 'moment', 'place'
    );

  v_diff := public.relationship_diff('civic_relationships', v_current, v_requested);
  v_added_count := (v_diff->>'addedCount')::integer;
  v_removed_count := (v_diff->>'removedCount')::integer;

  IF v_added_count = 0 AND v_removed_count = 0 THEN
    v_response := pg_catalog.jsonb_build_object(
      'sourceId', p_source_id,
      'cityId', p_expected_city_id,
      'changed', false,
      'auditId', NULL,
      'addedCount', 0,
      'removedCount', 0
    );
  ELSE
    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_diff->'removed') AS removed(value)
    LOOP
      DELETE FROM public.civic_relationships
      WHERE from_type = p_source_type
        AND from_id = p_source_id
        AND to_type = v_target->>'type'
        AND to_id = (v_target->>'id')::uuid;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN
        RAISE EXCEPTION 'Civic relationship changed concurrently';
      END IF;
    END LOOP;

    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_diff->'added') AS added(value)
    LOOP
      INSERT INTO public.civic_relationships (from_type, from_id, to_type, to_id)
      VALUES (
        p_source_type, p_source_id,
        v_target->>'type', (v_target->>'id')::uuid
      );
    END LOOP;

    v_entity_type := CASE p_source_type
      WHEN 'entity' THEN 'civic_entities'
      WHEN 'event' THEN 'civic_events'
      WHEN 'artifact' THEN 'civic_artifacts'
      WHEN 'neighborhood' THEN 'civic_neighborhoods'
      WHEN 'era' THEN 'civic_eras'
      WHEN 'moment' THEN 'civic_moments'
      WHEN 'place' THEN 'civic_places'
      ELSE NULL
    END;
    IF v_entity_type IS NULL THEN
      RAISE EXCEPTION 'Unsupported civic relationship source type';
    END IF;

    v_changes := pg_catalog.jsonb_build_object(
      'families', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'family', 'civic_relationships',
          'added', v_diff->'added',
          'removed', v_diff->'removed'
        )
      )
    );
    v_audit_id := public.relationship_write_audit(
      p_actor_admin_id, p_actor_auth_uid, v_role,
      v_entity_type, p_source_id, p_expected_city_id, p_idempotency_key, v_changes
    );
    v_response := pg_catalog.jsonb_build_object(
      'sourceId', p_source_id,
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
    AND rpc_name = 'admin_replace_civic_relationship_set'
    AND idempotency_key = p_idempotency_key
    AND response IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Unable to persist civic relationship idempotency receipt';
  END IF;

  RETURN v_response;
END;
$function$;

ALTER FUNCTION public.admin_replace_civic_relationship_set(uuid, uuid, uuid, text, uuid, jsonb, uuid)
  OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_replace_civic_relationship_set(uuid, uuid, uuid, text, uuid, jsonb, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_replace_civic_relationship_set(uuid, uuid, uuid, text, uuid, jsonb, uuid)
  TO service_role;

DO $check_civic_rpc$
DECLARE
  v_function oid := 'public.admin_replace_civic_relationship_set(uuid,uuid,uuid,text,uuid,jsonb,uuid)'::regprocedure;
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
    RAISE EXCEPTION 'Civic relationship RPC security configuration is invalid';
  END IF;
END;
$check_civic_rpc$;

COMMIT;
