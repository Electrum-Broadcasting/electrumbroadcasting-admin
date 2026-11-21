BEGIN;

CREATE TABLE public.osm_boundary_preparations (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id),
  source_url text NOT NULL CHECK (source_url ~* '^https://[^[:space:]]+$'),
  source_version text NOT NULL CHECK (pg_catalog.btrim(source_version) <> ''),
  source_geometry jsonb NOT NULL CHECK (
    pg_catalog.jsonb_typeof(source_geometry) = 'object'
    AND COALESCE(source_geometry->>'type' IN ('Polygon', 'MultiPolygon'), false)
  ),
  source_hash text NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_coordinate_count integer NOT NULL CHECK (source_coordinate_count BETWEEN 4 AND 50000),
  source_size_bytes integer NOT NULL CHECK (source_size_bytes BETWEEN 1 AND 5242880),
  source_ring_count integer NOT NULL CHECK (source_ring_count > 0),
  source_analysis jsonb NOT NULL,
  prepared_geometry jsonb CHECK (
    prepared_geometry IS NULL OR (
      pg_catalog.jsonb_typeof(prepared_geometry) = 'object'
      AND COALESCE(prepared_geometry->>'type' IN ('Polygon', 'MultiPolygon'), false)
    )
  ),
  prepared_hash text CHECK (prepared_hash IS NULL OR prepared_hash ~ '^[0-9a-f]{64}$'),
  prepared_coordinate_count integer CHECK (prepared_coordinate_count IS NULL OR prepared_coordinate_count BETWEEN 4 AND 50000),
  prepared_size_bytes integer CHECK (prepared_size_bytes IS NULL OR prepared_size_bytes BETWEEN 1 AND 5242880),
  preparation_metadata jsonb,
  prepared_version integer CHECK (prepared_version IS NULL OR prepared_version > 0),
  current_candidate_id uuid,
  approved_candidate_id uuid,
  registered_candidate_id uuid,
  status text NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'prepared', 'approved', 'rejected', 'registered')),
  created_by uuid NOT NULL REFERENCES public.admin_users(id),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  approved_by uuid REFERENCES public.admin_users(id),
  approved_at timestamptz,
  registered_boundary_id uuid REFERENCES public.osm_city_boundaries(id),
  registered_at timestamptz,
  rejection_reason text,
  CHECK ((status IN ('approved', 'registered')) = (approved_at IS NOT NULL)),
  CHECK ((status = 'registered') = (registered_at IS NOT NULL)),
  CHECK ((status = 'registered') = (registered_boundary_id IS NOT NULL)),
  CHECK (status NOT IN ('approved', 'registered') OR
    (prepared_coordinate_count <= 5000 AND prepared_size_bytes <= 900000))
);

CREATE TABLE public.osm_boundary_preparation_candidates (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  preparation_id uuid NOT NULL REFERENCES public.osm_boundary_preparations(id),
  version integer NOT NULL CHECK (version > 0),
  geometry jsonb NOT NULL CHECK (
    pg_catalog.jsonb_typeof(geometry) = 'object'
    AND COALESCE(geometry->>'type' IN ('Polygon', 'MultiPolygon'), false)
  ),
  geometry_hash text NOT NULL CHECK (geometry_hash ~ '^[0-9a-f]{64}$'),
  coordinate_count integer NOT NULL CHECK (coordinate_count BETWEEN 4 AND 50000),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 5242880),
  metadata jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES public.admin_users(id),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (preparation_id, version),
  UNIQUE (preparation_id, id)
);

ALTER TABLE public.osm_boundary_preparations
  ADD CONSTRAINT osm_boundary_preparations_current_candidate_fk
    FOREIGN KEY (id, current_candidate_id)
    REFERENCES public.osm_boundary_preparation_candidates(preparation_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT osm_boundary_preparations_approved_candidate_fk
    FOREIGN KEY (id, approved_candidate_id)
    REFERENCES public.osm_boundary_preparation_candidates(preparation_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT osm_boundary_preparations_registered_candidate_fk
    FOREIGN KEY (id, registered_candidate_id)
    REFERENCES public.osm_boundary_preparation_candidates(preparation_id, id)
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.osm_boundary_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osm_boundary_preparation_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.osm_boundary_preparations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.osm_boundary_preparation_candidates FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.osm_create_boundary_preparation(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_city_id uuid,
  p_source_url text, p_source_version text, p_source_geometry jsonb,
  p_source_hash text, p_source_coordinate_count integer,
  p_source_size_bytes integer, p_source_ring_count integer, p_source_analysis jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_id uuid;
  v_uploaded_audit_id uuid;
  v_analysis_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_city_id, 'create_pending'
  );
  IF p_source_url IS NULL OR p_source_url !~* '^https://[^[:space:]]+$'
     OR p_source_version IS NULL OR pg_catalog.btrim(p_source_version) = ''
     OR p_source_geometry IS NULL OR pg_catalog.jsonb_typeof(p_source_geometry) <> 'object'
     OR COALESCE(p_source_geometry->>'type' IN ('Polygon', 'MultiPolygon'), false) IS FALSE
     OR p_source_hash IS NULL OR p_source_hash !~ '^[0-9a-f]{64}$'
    OR p_source_coordinate_count NOT BETWEEN 4 AND 50000
     OR p_source_size_bytes NOT BETWEEN 1 AND 5242880
     OR p_source_ring_count < 1 OR pg_catalog.jsonb_typeof(p_source_analysis) <> 'object' THEN
    RAISE EXCEPTION 'Invalid boundary source preparation';
  END IF;
  INSERT INTO public.osm_boundary_preparations (
    city_id, source_url, source_version, source_geometry, source_hash,
    source_coordinate_count, source_size_bytes, source_ring_count, source_analysis, created_by
  ) VALUES (
    p_city_id, p_source_url, p_source_version, p_source_geometry, p_source_hash,
    p_source_coordinate_count, p_source_size_bytes, p_source_ring_count, p_source_analysis, p_actor_admin_id
  ) RETURNING id INTO v_id;

  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'boundary_uploaded', 'ingestion',
    'osm_boundary_preparation', v_id,
    pg_catalog.jsonb_build_object('city_id', p_city_id, 'source_url', p_source_url,
      'source_version', p_source_version, 'source_hash', p_source_hash,
      'coordinate_count', p_source_coordinate_count, 'size_bytes', p_source_size_bytes)
  ) RETURNING id INTO v_uploaded_audit_id;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'boundary_analysis_completed', 'ingestion',
    'osm_boundary_preparation', v_id,
    pg_catalog.jsonb_build_object('city_id', p_city_id, 'source_hash', p_source_hash,
      'coordinate_count', p_source_coordinate_count, 'ring_count', p_source_ring_count,
      'size_bytes', p_source_size_bytes, 'analysis', p_source_analysis)
  ) RETURNING id INTO v_analysis_audit_id;
  RETURN pg_catalog.jsonb_build_object('preparation_id', v_id,
    'uploaded_audit_id', v_uploaded_audit_id, 'analysis_audit_id', v_analysis_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_save_boundary_preparation_candidate(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_preparation_id uuid,
  p_prepared_geometry jsonb, p_prepared_hash text, p_prepared_coordinate_count integer,
  p_prepared_size_bytes integer, p_preparation_metadata jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_preparation public.osm_boundary_preparations%ROWTYPE;
  v_role text;
  v_audit_id uuid;
  v_version integer;
  v_candidate_id uuid;
BEGIN
  SELECT * INTO v_preparation FROM public.osm_boundary_preparations
    WHERE id = p_preparation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boundary preparation not found'; END IF;
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, v_preparation.city_id, 'create_pending'
  );
  IF v_preparation.status NOT IN ('uploaded', 'prepared')
     OR p_prepared_geometry IS NULL OR pg_catalog.jsonb_typeof(p_prepared_geometry) <> 'object'
     OR COALESCE(p_prepared_geometry->>'type' IN ('Polygon', 'MultiPolygon'), false) IS FALSE
     OR p_prepared_hash IS NULL OR p_prepared_hash !~ '^[0-9a-f]{64}$'
    OR p_prepared_coordinate_count NOT BETWEEN 4 AND 50000
    OR p_prepared_size_bytes NOT BETWEEN 1 AND 5242880
     OR pg_catalog.jsonb_typeof(p_preparation_metadata) <> 'object'
     OR p_preparation_metadata->>'algorithm' IS DISTINCT FROM 'Douglas-Peucker'
     OR p_preparation_metadata->>'validation_passed' NOT IN ('true', 'false') THEN
    RAISE EXCEPTION 'Invalid prepared boundary candidate';
  END IF;
  SELECT COALESCE(pg_catalog.max(version), 0) + 1 INTO v_version
    FROM public.osm_boundary_preparation_candidates WHERE preparation_id = p_preparation_id;
  INSERT INTO public.osm_boundary_preparation_candidates (
    preparation_id, version, geometry, geometry_hash, coordinate_count, size_bytes, metadata, created_by
  ) VALUES (
    p_preparation_id, v_version, p_prepared_geometry, p_prepared_hash,
    p_prepared_coordinate_count, p_prepared_size_bytes, p_preparation_metadata, p_actor_admin_id
  ) RETURNING id INTO v_candidate_id;
  UPDATE public.osm_boundary_preparations SET
    prepared_geometry = p_prepared_geometry, prepared_hash = p_prepared_hash,
    prepared_coordinate_count = p_prepared_coordinate_count, prepared_size_bytes = p_prepared_size_bytes,
    preparation_metadata = p_preparation_metadata, prepared_version = v_version,
    current_candidate_id = v_candidate_id, status = 'prepared',
    approved_by = NULL, approved_at = NULL, registered_boundary_id = NULL, registered_at = NULL
    , approved_candidate_id = NULL, registered_candidate_id = NULL
  WHERE id = p_preparation_id;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'boundary_prepared', 'ingestion',
    'osm_boundary_preparation', p_preparation_id,
    pg_catalog.jsonb_build_object('city_id', v_preparation.city_id,
      'source_hash', v_preparation.source_hash, 'prepared_hash', p_prepared_hash,
      'candidate_id', v_candidate_id, 'candidate_version', v_version,
      'source_coordinates', v_preparation.source_coordinate_count,
      'prepared_coordinates', p_prepared_coordinate_count, 'prepared_size_bytes', p_prepared_size_bytes,
      'metadata', p_preparation_metadata)
  ) RETURNING id INTO v_audit_id;
  RETURN pg_catalog.jsonb_build_object('preparation_id', p_preparation_id,
    'candidate_id', v_candidate_id, 'candidate_version', v_version, 'audit_id', v_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_approve_boundary_preparation(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_preparation_id uuid,
  p_acknowledge_boundary_differences boolean
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_preparation public.osm_boundary_preparations%ROWTYPE;
  v_role text;
  v_audit_id uuid;
  v_boundary_differences integer;
  v_grid_differences integer;
BEGIN
  SELECT * INTO v_preparation FROM public.osm_boundary_preparations
    WHERE id = p_preparation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boundary preparation not found'; END IF;
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, v_preparation.city_id, 'create_pending'
  );
  IF v_preparation.status <> 'prepared' THEN RAISE EXCEPTION 'Candidate is not awaiting approval'; END IF;
  IF v_preparation.prepared_coordinate_count > 5000 OR v_preparation.prepared_size_bytes > 900000 THEN
    RAISE EXCEPTION 'Candidate exceeds current boundary registration limits; prepare a smaller candidate';
  END IF;
  v_boundary_differences := COALESCE((v_preparation.preparation_metadata->'containment'->>'boundary_differences')::integer, -1);
  v_grid_differences := COALESCE((v_preparation.preparation_metadata->'containment'->>'grid_differences')::integer, -1);
  IF v_grid_differences <> 0 OR v_boundary_differences < 0
     OR (v_boundary_differences > 0 AND p_acknowledge_boundary_differences IS DISTINCT FROM TRUE) THEN
    RAISE EXCEPTION 'Review containment differences and explicitly acknowledge boundary-near changes';
  END IF;
  UPDATE public.osm_boundary_preparations SET status = 'approved',
    approved_by = p_actor_admin_id, approved_at = pg_catalog.now(),
    approved_candidate_id = current_candidate_id
  WHERE id = p_preparation_id;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'boundary_preparation_approved', 'ingestion',
    'osm_boundary_preparation', p_preparation_id,
    pg_catalog.jsonb_build_object('city_id', v_preparation.city_id,
      'source_hash', v_preparation.source_hash, 'prepared_hash', v_preparation.prepared_hash,
      'acknowledged_boundary_differences', p_acknowledge_boundary_differences,
      'containment', v_preparation.preparation_metadata->'containment')
  ) RETURNING id INTO v_audit_id;
  RETURN pg_catalog.jsonb_build_object('preparation_id', p_preparation_id, 'audit_id', v_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_reject_boundary_preparation(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_preparation_id uuid, p_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_preparation public.osm_boundary_preparations%ROWTYPE;
  v_role text;
  v_audit_id uuid;
BEGIN
  SELECT * INTO v_preparation FROM public.osm_boundary_preparations
    WHERE id = p_preparation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boundary preparation not found'; END IF;
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, v_preparation.city_id, 'create_pending'
  );
  IF v_preparation.status NOT IN ('uploaded', 'prepared') OR p_reason IS NULL
     OR pg_catalog.btrim(p_reason) = '' OR pg_catalog.length(p_reason) > 500 THEN
    RAISE EXCEPTION 'A pending preparation and rejection reason are required';
  END IF;
  UPDATE public.osm_boundary_preparations SET status = 'rejected', rejection_reason = pg_catalog.btrim(p_reason)
    WHERE id = p_preparation_id;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'boundary_preparation_rejected', 'ingestion',
    'osm_boundary_preparation', p_preparation_id,
    pg_catalog.jsonb_build_object('city_id', v_preparation.city_id,
      'source_hash', v_preparation.source_hash, 'reason', pg_catalog.btrim(p_reason))
  ) RETURNING id INTO v_audit_id;
  RETURN pg_catalog.jsonb_build_object('preparation_id', p_preparation_id, 'audit_id', v_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_register_prepared_boundary(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_preparation_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_preparation public.osm_boundary_preparations%ROWTYPE;
  v_candidate public.osm_boundary_preparation_candidates%ROWTYPE;
  v_result jsonb;
  v_role text;
  v_link_audit_id uuid;
BEGIN
  SELECT * INTO v_preparation FROM public.osm_boundary_preparations
    WHERE id = p_preparation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boundary preparation not found'; END IF;
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, v_preparation.city_id, 'create_pending'
  );
  IF v_preparation.status <> 'approved' OR v_preparation.prepared_geometry IS NULL THEN
    RAISE EXCEPTION 'Only an approved prepared boundary can be registered';
  END IF;
  IF v_preparation.approved_candidate_id IS NULL
     OR v_preparation.approved_candidate_id IS DISTINCT FROM v_preparation.current_candidate_id THEN
    RAISE EXCEPTION 'Current candidate is not the approved version';
  END IF;
  SELECT * INTO v_candidate FROM public.osm_boundary_preparation_candidates
    WHERE preparation_id = p_preparation_id AND id = v_preparation.approved_candidate_id;
  IF NOT FOUND OR v_candidate.geometry_hash IS DISTINCT FROM v_preparation.prepared_hash
     OR v_candidate.geometry IS DISTINCT FROM v_preparation.prepared_geometry THEN
    RAISE EXCEPTION 'Approved candidate version could not be confirmed';
  END IF;
  v_result := public.admin_register_osm_boundary(
    p_actor_admin_id, p_actor_auth_uid, v_preparation.city_id,
    v_preparation.source_url, v_preparation.source_version, v_candidate.geometry
  );
  UPDATE public.osm_boundary_preparations SET status = 'registered',
    registered_boundary_id = (v_result->>'boundary_id')::uuid, registered_at = pg_catalog.now(),
    registered_candidate_id = v_preparation.approved_candidate_id
  WHERE id = p_preparation_id;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'boundary_registered', 'ingestion',
    'osm_boundary_preparation', p_preparation_id,
    pg_catalog.jsonb_build_object('city_id', v_preparation.city_id,
      'preparation_id', p_preparation_id, 'boundary_id', v_result->>'boundary_id',
      'registration_audit_id', v_result->>'audit_id', 'source_hash', v_preparation.source_hash,
      'prepared_hash', v_candidate.geometry_hash, 'candidate_id', v_candidate.id,
      'candidate_version', v_candidate.version)
  ) RETURNING id INTO v_link_audit_id;
  RETURN v_result || pg_catalog.jsonb_build_object('preparation_id', p_preparation_id,
    'link_audit_id', v_link_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_get_boundary_preparation(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_preparation_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_preparation public.osm_boundary_preparations%ROWTYPE;
  v_candidates jsonb;
BEGIN
  SELECT * INTO v_preparation FROM public.osm_boundary_preparations WHERE id = p_preparation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boundary preparation not found'; END IF;
  PERFORM public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, v_preparation.city_id, 'create_pending'
  );
  SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'id', c.id, 'version', c.version, 'geometry_hash', c.geometry_hash,
    'coordinate_count', c.coordinate_count, 'size_bytes', c.size_bytes,
    'metadata', c.metadata, 'created_by', a.email, 'created_at', c.created_at
  ) ORDER BY c.version DESC), '[]'::jsonb) INTO v_candidates
  FROM public.osm_boundary_preparation_candidates c
    LEFT JOIN public.admin_users a ON a.id = c.created_by
  WHERE c.preparation_id = p_preparation_id;
  RETURN pg_catalog.to_jsonb(v_preparation) || pg_catalog.jsonb_build_object('candidates', v_candidates);
END;
$function$;

CREATE FUNCTION public.osm_list_boundary_preparations(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_city_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
BEGIN
  PERFORM public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_city_id, 'create_pending'
  );
  RETURN COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'id', p.id, 'city_id', p.city_id, 'source_url', p.source_url,
    'source_version', p.source_version, 'source_hash', p.source_hash,
    'source_coordinate_count', p.source_coordinate_count, 'source_size_bytes', p.source_size_bytes,
    'source_ring_count', p.source_ring_count, 'source_analysis', p.source_analysis,
    'prepared_hash', p.prepared_hash, 'prepared_coordinate_count', p.prepared_coordinate_count,
    'prepared_size_bytes', p.prepared_size_bytes, 'prepared_version', p.prepared_version,
    'current_candidate_id', p.current_candidate_id, 'preparation_metadata', p.preparation_metadata,
    'status', p.status, 'created_at', p.created_at, 'approved_at', p.approved_at,
    'registered_at', p.registered_at, 'registered_boundary_id', p.registered_boundary_id,
    'rejection_reason', p.rejection_reason, 'created_by', a.email, 'approved_by', approver.email
  ) ORDER BY p.created_at DESC, p.id DESC)
    FROM public.osm_boundary_preparations p
    LEFT JOIN public.admin_users a ON a.id = p.created_by
    LEFT JOIN public.admin_users approver ON approver.id = p.approved_by
    WHERE p.city_id = p_city_id), '[]'::jsonb);
END;
$function$;

ALTER FUNCTION public.osm_create_boundary_preparation(uuid, uuid, uuid, text, text, jsonb, text, integer, integer, integer, jsonb) OWNER TO postgres;
ALTER FUNCTION public.osm_save_boundary_preparation_candidate(uuid, uuid, uuid, jsonb, text, integer, integer, jsonb) OWNER TO postgres;
ALTER FUNCTION public.osm_approve_boundary_preparation(uuid, uuid, uuid, boolean) OWNER TO postgres;
ALTER FUNCTION public.osm_reject_boundary_preparation(uuid, uuid, uuid, text) OWNER TO postgres;
ALTER FUNCTION public.osm_register_prepared_boundary(uuid, uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.osm_get_boundary_preparation(uuid, uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.osm_list_boundary_preparations(uuid, uuid, uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.osm_create_boundary_preparation(uuid, uuid, uuid, text, text, jsonb, text, integer, integer, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_save_boundary_preparation_candidate(uuid, uuid, uuid, jsonb, text, integer, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_approve_boundary_preparation(uuid, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_reject_boundary_preparation(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_register_prepared_boundary(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_get_boundary_preparation(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_list_boundary_preparations(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.osm_create_boundary_preparation(uuid, uuid, uuid, text, text, jsonb, text, integer, integer, integer, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_save_boundary_preparation_candidate(uuid, uuid, uuid, jsonb, text, integer, integer, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_approve_boundary_preparation(uuid, uuid, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_reject_boundary_preparation(uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_register_prepared_boundary(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_get_boundary_preparation(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_list_boundary_preparations(uuid, uuid, uuid) TO service_role;

COMMIT;