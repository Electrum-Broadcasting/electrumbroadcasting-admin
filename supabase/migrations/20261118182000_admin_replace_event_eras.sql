BEGIN;

CREATE FUNCTION public.admin_replace_event_eras(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_event_id uuid,
  p_era_ids uuid[],
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
  v_rows integer;
  v_added_count integer;
  v_removed_count integer;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL
     OR p_expected_city_id IS NULL OR p_event_id IS NULL
     OR p_era_ids IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Missing Event relationship replacement input';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.unnest(p_era_ids) AS target(era_id)
    WHERE target.era_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Era identifiers cannot be null';
  END IF;

  LOCK TABLE public.event_eras IN SHARE ROW EXCLUSIVE MODE;

  v_role := public.relationship_authorize_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id,
    'event', p_event_id, true
  );

  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', target.era_id::text)
      ORDER BY target.era_id),
    '[]'::jsonb
  ) INTO v_requested
  FROM (SELECT unnest(p_era_ids) AS era_id) AS target;

  v_request := pg_catalog.jsonb_build_object(
    'actor_auth_uid', p_actor_auth_uid,
    'city_id', p_expected_city_id,
    'event_id', p_event_id,
    'era_ids', v_requested
  );
  v_request_hash := extensions.digest(
    pg_catalog.convert_to(v_request::text, 'UTF8'), 'sha256'
  );

  INSERT INTO public.relationship_governance_idempotency (
    actor_admin_id, rpc_name, idempotency_key, request_hash
  ) VALUES (
    p_actor_admin_id, 'admin_replace_event_eras', p_idempotency_key, v_request_hash
  )
  ON CONFLICT (actor_admin_id, rpc_name, idempotency_key) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    SELECT request_hash, response
    INTO v_saved_hash, v_saved_response
    FROM public.relationship_governance_idempotency
    WHERE actor_admin_id = p_actor_admin_id
      AND rpc_name = 'admin_replace_event_eras'
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
    ORDER BY value->>'id'
  LOOP
    PERFORM public.relationship_authorize_mutation(
      p_actor_admin_id, p_actor_auth_uid, p_expected_city_id,
      'era', (v_target->>'id')::uuid, false
    );
  END LOOP;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', link.era_id::text)
      ORDER BY link.era_id),
    '[]'::jsonb
  ) INTO v_current
  FROM public.event_eras AS link
  WHERE link.event_id = p_event_id;

  v_diff := public.relationship_diff('event_eras', v_current, v_requested);
  v_added_count := (v_diff->>'addedCount')::integer;
  v_removed_count := (v_diff->>'removedCount')::integer;

  IF v_added_count = 0 AND v_removed_count = 0 THEN
    v_response := pg_catalog.jsonb_build_object(
      'sourceId', p_event_id,
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
      DELETE FROM public.event_eras
      WHERE event_id = p_event_id AND era_id = (v_target->>'id')::uuid;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN
        RAISE EXCEPTION 'Event-Era relationship changed concurrently';
      END IF;
    END LOOP;

    FOR v_target IN
      SELECT value FROM pg_catalog.jsonb_array_elements(v_diff->'added') AS added(value)
    LOOP
      INSERT INTO public.event_eras (event_id, era_id)
      VALUES (p_event_id, (v_target->>'id')::uuid);
    END LOOP;

    v_changes := pg_catalog.jsonb_build_object(
      'families', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'family', 'event_eras',
          'added', v_diff->'added',
          'removed', v_diff->'removed'
        )
      )
    );
    v_audit_id := public.relationship_write_audit(
      p_actor_admin_id, p_actor_auth_uid, v_role,
      'civic_events', p_event_id, p_expected_city_id, p_idempotency_key, v_changes
    );
    v_response := pg_catalog.jsonb_build_object(
      'sourceId', p_event_id,
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
    AND rpc_name = 'admin_replace_event_eras'
    AND idempotency_key = p_idempotency_key
    AND response IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Unable to persist Event relationship idempotency receipt';
  END IF;

  RETURN v_response;
END;
$function$;

ALTER FUNCTION public.admin_replace_event_eras(uuid, uuid, uuid, uuid, uuid[], uuid)
  OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_replace_event_eras(uuid, uuid, uuid, uuid, uuid[], uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_replace_event_eras(uuid, uuid, uuid, uuid, uuid[], uuid)
  TO service_role;

DO $check_event_rpc$
DECLARE
  v_function oid := 'public.admin_replace_event_eras(uuid,uuid,uuid,uuid,uuid[],uuid)'::regprocedure;
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
    RAISE EXCEPTION 'Event relationship RPC security configuration is invalid';
  END IF;
END;
$check_event_rpc$;

COMMIT;
