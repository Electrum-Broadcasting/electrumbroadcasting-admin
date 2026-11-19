BEGIN;

-- Geometry is validated by the authenticated server before this service-only
-- RPC is called. Registered versions are immutable once referenced by a job.
CREATE TABLE public.osm_city_boundaries (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id),
  source_url text NOT NULL CHECK (source_url ~* '^https://[^[:space:]]+$'),
  source_version text NOT NULL CHECK (pg_catalog.btrim(source_version) <> ''),
  geometry jsonb NOT NULL CHECK (
    pg_catalog.jsonb_typeof(geometry) = 'object'
    AND COALESCE(geometry->>'type' IN ('Polygon', 'MultiPolygon'), false)
  ),
  registered_by uuid NOT NULL REFERENCES public.admin_users(id),
  registered_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.osm_city_boundaries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.osm_city_boundaries FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.admin_register_osm_boundary(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_city_id uuid,
  p_source_url text,
  p_source_version text,
  p_geometry jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_boundary_id uuid;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_city_id, 'create_pending'
  );
  IF p_source_url IS NULL OR p_source_url !~* '^https://[^[:space:]]+$'
     OR p_source_version IS NULL OR pg_catalog.btrim(p_source_version) = ''
     OR p_geometry IS NULL OR pg_catalog.jsonb_typeof(p_geometry) <> 'object'
     OR COALESCE(p_geometry->>'type' NOT IN ('Polygon', 'MultiPolygon'), true)
     OR pg_catalog.jsonb_typeof(p_geometry->'coordinates') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid boundary source, version, or geometry';
  END IF;
  INSERT INTO public.osm_city_boundaries (
    city_id, source_url, source_version, geometry, registered_by
  ) VALUES (
    p_city_id, p_source_url, p_source_version, p_geometry, p_actor_admin_id
  ) RETURNING id INTO v_boundary_id;

  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'ingestion_boundary_registered', 'ingestion',
    'osm_city_boundary', v_boundary_id,
    pg_catalog.jsonb_build_object('city_id', p_city_id, 'source_url', p_source_url, 'source_version', p_source_version)
  ) RETURNING id INTO v_audit_id;
  IF v_audit_id IS NULL THEN RAISE EXCEPTION 'Boundary audit was not persisted'; END IF;
  RETURN pg_catalog.jsonb_build_object('boundary_id', v_boundary_id, 'city_id', p_city_id, 'audit_id', v_audit_id);
END;
$function$;

ALTER FUNCTION public.admin_register_osm_boundary(uuid, uuid, uuid, text, text, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_register_osm_boundary(uuid, uuid, uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_register_osm_boundary(uuid, uuid, uuid, text, text, jsonb)
  TO service_role;

COMMIT;
