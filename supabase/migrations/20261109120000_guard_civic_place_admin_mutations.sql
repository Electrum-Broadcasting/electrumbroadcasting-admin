BEGIN;

CREATE FUNCTION public.admin_mutate_civic_place(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_operation text,
  p_place_id uuid,
  p_place_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_place public.civic_places%ROWTYPE;
  v_audit_id uuid;
  v_changed_fields text[];
  v_old_status text;
  v_old_is_published boolean;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL OR p_expected_city_id IS NULL THEN
    RAISE EXCEPTION 'Missing required identity or city';
  END IF;
  IF p_operation IS NULL OR p_operation NOT IN ('create_pending', 'edit_metadata', 'hide') THEN
    RAISE EXCEPTION 'Unsupported civic Place operation';
  END IF;
  IF p_place_data IS NULL OR pg_catalog.jsonb_typeof(p_place_data) <> 'object' THEN
    RAISE EXCEPTION 'Place data must be an object';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_object_keys(p_place_data) AS supplied(key)
    WHERE supplied.key NOT IN (
      'name', 'slug', 'place_type', 'description', 'latitude', 'longitude',
      'year_built', 'year_demolished', 'neighborhood'
    )
  ) THEN
    RAISE EXCEPTION 'Unsupported civic Place field';
  END IF;
  IF p_operation = 'create_pending'
     AND (pg_catalog.jsonb_typeof(p_place_data->'name') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_place_data->>'name') = '') THEN
    RAISE EXCEPTION 'Place name is required';
  END IF;
  IF p_operation = 'edit_metadata' AND p_place_data ? 'name'
     AND (pg_catalog.jsonb_typeof(p_place_data->'name') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_place_data->>'name') = '') THEN
    RAISE EXCEPTION 'Place name must be a nonblank string';
  END IF;
  IF p_operation = 'create_pending' AND p_place_id IS NOT NULL THEN
    RAISE EXCEPTION 'Place ID is not accepted for creation';
  END IF;
  IF p_operation IN ('edit_metadata', 'hide') AND p_place_id IS NULL THEN
    RAISE EXCEPTION 'Place ID is required';
  END IF;
  IF p_operation = 'edit_metadata' AND p_place_data = '{}'::jsonb THEN
    RAISE EXCEPTION 'Place metadata update must include at least one field';
  END IF;
  IF p_operation = 'hide' AND p_place_data <> '{}'::jsonb THEN
    RAISE EXCEPTION 'Place data is not accepted for hide';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_each(p_place_data) AS supplied(key, value)
    WHERE supplied.key IN ('name', 'slug', 'place_type', 'description', 'neighborhood')
      AND pg_catalog.jsonb_typeof(supplied.value) NOT IN ('string', 'null')
  ) THEN
    RAISE EXCEPTION 'Invalid civic Place text field';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_each(p_place_data) AS supplied(key, value)
    WHERE supplied.key IN ('latitude', 'longitude', 'year_built', 'year_demolished')
      AND pg_catalog.jsonb_typeof(supplied.value) NOT IN ('number', 'null')
  ) THEN
    RAISE EXCEPTION 'Invalid civic Place numeric field';
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
  IF v_admin.role = 'CITY_ADMIN'
     AND NOT EXISTS (
       SELECT 1
       FROM pg_catalog.unnest(COALESCE(v_admin.city_ids::text[], ARRAY[]::text[])) AS assigned(city_id)
       WHERE assigned.city_id = p_expected_city_id::text
     ) THEN
    RAISE EXCEPTION 'Place is outside the administrator city scope';
  END IF;

  SELECT id INTO v_place.id
  FROM public.cities
  WHERE id = p_expected_city_id
  FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'City not found';
  END IF;

  SELECT pg_catalog.array_agg(supplied.key ORDER BY supplied.key)
  INTO v_changed_fields
  FROM pg_catalog.jsonb_object_keys(p_place_data) AS supplied(key);

  IF p_operation = 'create_pending' THEN
    INSERT INTO public.civic_places (
      city_id, name, slug, place_type, description, latitude, longitude,
      year_built, year_demolished, neighborhood, status, is_published,
      updated_by, updated_at
    ) VALUES (
      p_expected_city_id,
      p_place_data->>'name',
      COALESCE(
        NULLIF(pg_catalog.btrim(p_place_data->>'slug'), ''),
        pg_catalog.btrim(pg_catalog.regexp_replace(
          pg_catalog.lower(pg_catalog.btrim(p_place_data->>'name')),
          '[^a-z0-9]+', '-', 'g'
        ), '-')
      ),
      p_place_data->>'place_type',
      p_place_data->>'description',
      (p_place_data->>'latitude')::double precision,
      (p_place_data->>'longitude')::double precision,
      (p_place_data->>'year_built')::integer,
      (p_place_data->>'year_demolished')::integer,
      p_place_data->>'neighborhood',
      'pending',
      false,
      p_actor_auth_uid,
      pg_catalog.now()
    )
    RETURNING * INTO v_place;

    INSERT INTO public.admin_action_logs (
      actor_user_id, actor_admin_id, actor_role, action,
      domain, entity_type, entity_id, metadata
    ) VALUES (
      p_actor_auth_uid, v_admin.id, v_admin.role, 'PLACE_CREATE_PENDING',
      'places', 'civic_place', v_place.id,
      pg_catalog.jsonb_build_object(
        'city_id', v_place.city_id,
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields),
        'lifecycle', pg_catalog.jsonb_build_object(
          'status', v_place.status,
          'is_published', v_place.is_published
        )
      )
    )
    RETURNING id INTO v_audit_id;
  ELSIF p_operation = 'edit_metadata' THEN
    SELECT * INTO v_place
    FROM public.civic_places
    WHERE id = p_place_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Place not found';
    END IF;
    IF v_place.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Place city changed or is unavailable';
    END IF;

    UPDATE public.civic_places
    SET name = CASE WHEN p_place_data ? 'name' THEN p_place_data->>'name' ELSE name END,
        slug = CASE WHEN p_place_data ? 'slug' THEN p_place_data->>'slug' ELSE slug END,
        place_type = CASE WHEN p_place_data ? 'place_type' THEN p_place_data->>'place_type' ELSE place_type END,
        description = CASE WHEN p_place_data ? 'description' THEN p_place_data->>'description' ELSE description END,
        latitude = CASE WHEN p_place_data ? 'latitude' THEN (p_place_data->>'latitude')::double precision ELSE latitude END,
        longitude = CASE WHEN p_place_data ? 'longitude' THEN (p_place_data->>'longitude')::double precision ELSE longitude END,
        year_built = CASE WHEN p_place_data ? 'year_built' THEN (p_place_data->>'year_built')::integer ELSE year_built END,
        year_demolished = CASE WHEN p_place_data ? 'year_demolished' THEN (p_place_data->>'year_demolished')::integer ELSE year_demolished END,
        neighborhood = CASE WHEN p_place_data ? 'neighborhood' THEN p_place_data->>'neighborhood' ELSE neighborhood END,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
    WHERE id = p_place_id
    RETURNING * INTO v_place;

    INSERT INTO public.admin_action_logs (
      actor_user_id, actor_admin_id, actor_role, action,
      domain, entity_type, entity_id, metadata
    ) VALUES (
      p_actor_auth_uid, v_admin.id, v_admin.role, 'PLACE_EDIT_METADATA',
      'places', 'civic_place', v_place.id,
      pg_catalog.jsonb_build_object(
        'city_id', v_place.city_id,
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields)
      )
    )
    RETURNING id INTO v_audit_id;
  ELSE
    SELECT * INTO v_place
    FROM public.civic_places
    WHERE id = p_place_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Place not found';
    END IF;
    IF v_place.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Place city changed or is unavailable';
    END IF;

    v_old_status := v_place.status;
    v_old_is_published := v_place.is_published;

    UPDATE public.civic_places
    SET status = 'hidden',
        is_published = false,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
    WHERE id = p_place_id
    RETURNING * INTO v_place;

    INSERT INTO public.admin_action_logs (
      actor_user_id, actor_admin_id, actor_role, action,
      domain, entity_type, entity_id, metadata
    ) VALUES (
      p_actor_auth_uid, v_admin.id, v_admin.role, 'PLACE_HIDE',
      'places', 'civic_place', v_place.id,
      pg_catalog.jsonb_build_object(
        'city_id', v_place.city_id,
        'lifecycle', pg_catalog.jsonb_build_object(
          'from_status', v_old_status,
          'from_is_published', v_old_is_published,
          'to_status', v_place.status,
          'to_is_published', v_place.is_published
        )
      )
    )
    RETURNING id INTO v_audit_id;
  END IF;

  IF v_audit_id IS NULL THEN
    RAISE EXCEPTION 'Place audit entry was not persisted';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'place_id', v_place.id,
    'city_id', v_place.city_id,
    'operation', p_operation,
    'audit_id', v_audit_id,
    'status', v_place.status,
    'is_published', v_place.is_published
  );
END;
$function$;

ALTER FUNCTION public.admin_mutate_civic_place(uuid, uuid, uuid, text, uuid, jsonb)
  OWNER TO postgres;

REVOKE ALL ON FUNCTION public.admin_mutate_civic_place(uuid, uuid, uuid, text, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_civic_place(uuid, uuid, uuid, text, uuid, jsonb)
  TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON TABLE public.civic_places
  FROM authenticated;

DROP POLICY IF EXISTS "Authenticated insert civic_places" ON public.civic_places;
DROP POLICY IF EXISTS "Authenticated update civic_places" ON public.civic_places;
DROP POLICY IF EXISTS "Authenticated delete civic_places" ON public.civic_places;
DROP POLICY IF EXISTS "Admin full access civic_places" ON public.civic_places;

DO $check_permissions$
DECLARE
  v_function oid := 'public.admin_mutate_civic_place(uuid,uuid,uuid,text,uuid,jsonb)'::regprocedure;
  v_postgres oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres');
BEGIN
  IF v_postgres IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM pg_catalog.pg_proc AS p
       WHERE p.oid = v_function
         AND p.proowner = v_postgres
         AND p.proconfig @> ARRAY['search_path=pg_catalog']::text[]
     ) THEN
    RAISE EXCEPTION 'Unexpected civic Place mutation function owner or search_path';
  END IF;
  IF pg_catalog.has_table_privilege('authenticated', 'public.civic_places', 'INSERT')
     OR pg_catalog.has_table_privilege('authenticated', 'public.civic_places', 'UPDATE')
     OR pg_catalog.has_table_privilege('authenticated', 'public.civic_places', 'DELETE')
     OR pg_catalog.has_table_privilege('authenticated', 'public.civic_places', 'TRUNCATE')
     OR NOT pg_catalog.has_table_privilege('authenticated', 'public.civic_places', 'SELECT') THEN
    RAISE EXCEPTION 'Unexpected authenticated civic_places table privileges';
  END IF;
  IF pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
     OR pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected civic Place mutation function EXECUTE privileges';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS p
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) AS acl
    WHERE p.oid = v_function
      AND acl.privilege_type = 'EXECUTE'
      AND acl.grantee NOT IN (
        p.proowner,
        (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected explicit civic Place mutation function grant';
  END IF;
END;
$check_permissions$;

COMMIT;
