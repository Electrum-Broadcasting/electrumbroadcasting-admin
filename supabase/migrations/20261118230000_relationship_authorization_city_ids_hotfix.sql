BEGIN;

CREATE OR REPLACE FUNCTION public.relationship_authorize_mutation(
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
     AND NOT EXISTS (
       SELECT 1
       FROM pg_catalog.unnest(COALESCE(v_admin.city_ids, ARRAY[]::uuid[])) AS assigned(city_id)
       WHERE assigned.city_id = p_expected_city_id
     ) THEN
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

ALTER FUNCTION public.relationship_authorize_mutation(uuid, uuid, uuid, text, uuid, boolean)
  OWNER TO postgres;
REVOKE ALL ON FUNCTION public.relationship_authorize_mutation(uuid, uuid, uuid, text, uuid, boolean)
  FROM PUBLIC, anon, authenticated, service_role;

DO $check_relationship_authorization$
DECLARE
  v_function oid := 'public.relationship_authorize_mutation(uuid,uuid,uuid,text,uuid,boolean)'::regprocedure;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = v_function
      AND p.proowner = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres')
      AND p.prosecdef IS FALSE
      AND p.proconfig @> ARRAY['search_path=pg_catalog']::text[]
  ) OR pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
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
    RAISE EXCEPTION 'Relationship authorization helper security configuration is invalid';
  END IF;
END;
$check_relationship_authorization$;

COMMIT;
