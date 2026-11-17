BEGIN;

-- Only trusted server code may invoke the public mutation RPCs. The actor UID
-- must be derived from its verified session, not from request parameters.
CREATE FUNCTION public.civic_authorize_lifecycle_mutation(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_city_id uuid,
  p_operation text
)
RETURNS text
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
DECLARE
  v_admin public.admin_users%ROWTYPE;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL OR p_city_id IS NULL THEN
    RAISE EXCEPTION 'Missing required identity or city';
  END IF;
  IF p_operation IS NULL OR p_operation NOT IN
    ('create_pending', 'edit_metadata', 'approve', 'hide', 'restore') THEN
    RAISE EXCEPTION 'Unsupported civic lifecycle operation';
  END IF;

  SELECT * INTO v_admin
  FROM public.admin_users
  WHERE id = p_actor_admin_id
  FOR SHARE;

  IF NOT FOUND OR v_admin.auth_uid IS DISTINCT FROM p_actor_auth_uid::text
     OR v_admin.status IS DISTINCT FROM 'active'
     OR v_admin.role IS NULL
     OR v_admin.role NOT IN ('CEO', 'PLATFORM_ADMIN', 'CITY_ADMIN') THEN
    RAISE EXCEPTION 'Actor is not an active authorized administrator';
  END IF;
  IF p_operation = 'approve' AND v_admin.role <> 'CITY_ADMIN' THEN
    RAISE EXCEPTION 'Only CITY_ADMIN may approve civic objects';
  END IF;
  IF p_operation IN ('hide', 'restore')
     AND v_admin.role NOT IN ('CEO', 'CITY_ADMIN') THEN
    RAISE EXCEPTION 'Role is not authorized for this civic lifecycle operation';
  END IF;
  IF v_admin.role = 'CITY_ADMIN'
     AND NOT EXISTS (
       SELECT 1
       FROM pg_catalog.unnest(COALESCE(v_admin.city_ids::text[], ARRAY[]::text[])) AS assigned(city_id)
       WHERE assigned.city_id = p_city_id::text
     ) THEN
    RAISE EXCEPTION 'Civic object is outside the administrator city scope';
  END IF;

  PERFORM 1 FROM public.cities WHERE id = p_city_id FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'City not found';
  END IF;
  RETURN v_admin.role;
END;
$function$;

-- p_field_types maps allowed field names to string, number, or string_array.
-- Required fields must be nonblank strings on create and whenever edited.
CREATE FUNCTION public.civic_validate_lifecycle_payload(
  p_operation text,
  p_data jsonb,
  p_field_types jsonb,
  p_required_fields text[]
)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
DECLARE
  v_field record;
  v_required text;
  v_type text;
BEGIN
  IF p_operation IS NULL OR p_operation NOT IN
    ('create_pending', 'edit_metadata', 'approve', 'hide', 'restore') THEN
    RAISE EXCEPTION 'Unsupported civic lifecycle operation';
  END IF;
  IF p_data IS NULL OR pg_catalog.jsonb_typeof(p_data) <> 'object' THEN
    RAISE EXCEPTION 'Civic object data must be an object';
  END IF;
  IF p_operation IN ('approve', 'hide', 'restore') THEN
    IF p_data <> '{}'::jsonb THEN
      RAISE EXCEPTION 'Metadata is not accepted for lifecycle transitions';
    END IF;
    RETURN;
  END IF;
  IF p_operation = 'edit_metadata' AND p_data = '{}'::jsonb THEN
    RAISE EXCEPTION 'Metadata update must include at least one field';
  END IF;

  FOREACH v_required IN ARRAY p_required_fields LOOP
    IF (p_operation = 'create_pending' OR p_data ? v_required)
       AND (pg_catalog.jsonb_typeof(p_data -> v_required) IS DISTINCT FROM 'string'
            OR pg_catalog.btrim(p_data ->> v_required) = '') THEN
      RAISE EXCEPTION 'Required civic field must be a nonblank string: %', v_required;
    END IF;
  END LOOP;

  FOR v_field IN SELECT key, value FROM pg_catalog.jsonb_each(p_data) LOOP
    v_type := p_field_types ->> v_field.key;
    IF v_type IS NULL THEN
      RAISE EXCEPTION 'Unsupported civic metadata field: %', v_field.key;
    END IF;
    IF pg_catalog.jsonb_typeof(v_field.value) = 'null' THEN
      CONTINUE;
    END IF;
    IF v_type IN ('string', 'number')
       AND pg_catalog.jsonb_typeof(v_field.value) IS DISTINCT FROM v_type THEN
      RAISE EXCEPTION 'Invalid type for civic metadata field: %', v_field.key;
    ELSIF v_type = 'string_array' THEN
      IF pg_catalog.jsonb_typeof(v_field.value) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Invalid type for civic metadata field: %', v_field.key;
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.jsonb_array_elements(v_field.value) AS item(value)
        WHERE pg_catalog.jsonb_typeof(item.value) IS DISTINCT FROM 'string'
      ) THEN
        RAISE EXCEPTION 'Array must contain only strings: %', v_field.key;
      END IF;
    ELSIF v_type NOT IN ('string', 'number') THEN
      RAISE EXCEPTION 'Unsupported civic metadata validation type: %', v_type;
    END IF;
  END LOOP;
END;
$function$;

CREATE FUNCTION public.civic_lifecycle_transition(
  p_operation text,
  p_status text,
  p_is_published boolean
)
RETURNS TABLE (next_status text, next_is_published boolean)
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  IF p_operation = 'create_pending' THEN
    IF p_status IS NOT NULL OR p_is_published IS NOT NULL THEN
      RAISE EXCEPTION 'Creation cannot specify an existing state';
    END IF;
    RETURN QUERY SELECT 'pending'::text, false;
  ELSIF p_operation = 'edit_metadata' THEN
    IF p_status IS NULL OR p_status NOT IN ('pending', 'approved', 'hidden')
       OR p_is_published IS DISTINCT FROM (p_status = 'approved') THEN
      RAISE EXCEPTION 'Invalid civic lifecycle state';
    END IF;
    RETURN QUERY SELECT p_status, p_is_published;
  ELSIF p_operation = 'approve' AND p_status = 'pending' AND p_is_published IS FALSE THEN
    RETURN QUERY SELECT 'approved'::text, true;
  ELSIF p_operation = 'hide' AND p_status = 'approved' AND p_is_published IS TRUE THEN
    RETURN QUERY SELECT 'hidden'::text, false;
  ELSIF p_operation = 'restore' AND p_status = 'hidden' AND p_is_published IS FALSE THEN
    RETURN QUERY SELECT 'pending'::text, false;
  ELSE
    RAISE EXCEPTION 'Invalid civic lifecycle transition: % from % / %',
      p_operation, p_status, p_is_published;
  END IF;
END;
$function$;

CREATE FUNCTION public.civic_write_lifecycle_audit(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_actor_role text,
  p_operation text,
  p_table_name text,
  p_object_id uuid,
  p_city_id uuid,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
DECLARE
  v_action text;
  v_audit_id uuid;
BEGIN
  v_action := CASE p_operation
    WHEN 'create_pending' THEN 'object_created'
    WHEN 'edit_metadata' THEN 'metadata_edited'
    WHEN 'approve' THEN 'object_approved'
    WHEN 'hide' THEN 'object_hidden'
    WHEN 'restore' THEN 'object_restored'
    ELSE NULL
  END;
  IF v_action IS NULL OR p_table_name IS NULL OR p_table_name NOT IN
       ('civic_entities', 'civic_events', 'civic_artifacts',
        'civic_neighborhoods', 'civic_eras', 'civic_moments')
     OR p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL OR p_actor_role IS NULL
     OR p_object_id IS NULL OR p_city_id IS NULL
     OR p_metadata IS NULL OR pg_catalog.jsonb_typeof(p_metadata) <> 'object'
     OR p_metadata ? 'city_id' THEN
    RAISE EXCEPTION 'Invalid civic audit arguments';
  END IF;

  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action,
    domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, p_actor_role, v_action,
    'civic', p_table_name, p_object_id,
    p_metadata || pg_catalog.jsonb_build_object('city_id', p_city_id)
  )
  RETURNING id INTO v_audit_id;
  IF v_audit_id IS NULL THEN
    RAISE EXCEPTION 'Civic audit entry was not persisted';
  END IF;
  RETURN v_audit_id;
END;
$function$;

ALTER FUNCTION public.civic_authorize_lifecycle_mutation(uuid, uuid, uuid, text) OWNER TO postgres;
ALTER FUNCTION public.civic_validate_lifecycle_payload(text, jsonb, jsonb, text[]) OWNER TO postgres;
ALTER FUNCTION public.civic_lifecycle_transition(text, text, boolean) OWNER TO postgres;
ALTER FUNCTION public.civic_write_lifecycle_audit(uuid, uuid, text, text, text, uuid, uuid, jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.civic_authorize_lifecycle_mutation(uuid, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.civic_validate_lifecycle_payload(text, jsonb, jsonb, text[])
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.civic_lifecycle_transition(text, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.civic_write_lifecycle_audit(uuid, uuid, text, text, text, uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

DO $check_permissions$
DECLARE
  v_function oid;
  v_owner oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres');
BEGIN
  FOREACH v_function IN ARRAY ARRAY[
    'public.civic_authorize_lifecycle_mutation(uuid,uuid,uuid,text)'::regprocedure::oid,
    'public.civic_validate_lifecycle_payload(text,jsonb,jsonb,text[])'::regprocedure::oid,
    'public.civic_lifecycle_transition(text,text,boolean)'::regprocedure::oid,
    'public.civic_write_lifecycle_audit(uuid,uuid,text,text,text,uuid,uuid,jsonb)'::regprocedure::oid
  ] LOOP
    IF v_owner IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc AS p
      WHERE p.oid = v_function AND p.proowner = v_owner AND p.prosecdef IS FALSE
        AND p.proconfig @> ARRAY['search_path=pg_catalog']::text[]
    ) OR pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
      OR pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
      OR pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE')
      OR EXISTS (
        SELECT 1 FROM pg_catalog.pg_proc AS p
        CROSS JOIN LATERAL pg_catalog.aclexplode(
          COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
        ) AS acl
        WHERE p.oid = v_function AND acl.privilege_type = 'EXECUTE'
          AND acl.grantee <> p.proowner
      ) THEN
      RAISE EXCEPTION 'Unexpected civic helper security or privileges: %', v_function::regprocedure;
    END IF;
  END LOOP;
END;
$check_permissions$;

COMMIT;
