BEGIN;

CREATE TABLE public.osm_ingestion_batches (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id),
  boundary_id uuid NOT NULL REFERENCES public.osm_city_boundaries(id),
  source_name text NOT NULL CHECK (source_name = 'openstreetmap'),
  source_version text NOT NULL CHECK (pg_catalog.btrim(source_version) <> ''),
  actor_admin_id uuid NOT NULL REFERENCES public.admin_users(id),
  actor_auth_uid uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error text,
  CHECK ((status = 'running') = (completed_at IS NULL))
);

CREATE TABLE public.osm_ingestion_items (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.osm_ingestion_batches(id),
  external_id text NOT NULL,
  source_hash text NOT NULL,
  payload jsonb NOT NULL,
  processed_state text NOT NULL CHECK (processed_state IN ('staged', 'created', 'duplicate', 'quarantined', 'failed')),
  disposition text NOT NULL,
  place_id uuid REFERENCES public.civic_places(id),
  audit_id uuid NOT NULL REFERENCES public.admin_action_logs(id),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (batch_id, external_id)
);

CREATE TABLE public.osm_place_source_links (
  source_name text NOT NULL CHECK (source_name = 'openstreetmap'),
  external_id text NOT NULL,
  place_id uuid NOT NULL REFERENCES public.civic_places(id),
  raw_id uuid NOT NULL REFERENCES public.osm_ingestion_items(id),
  PRIMARY KEY (source_name, external_id)
);

ALTER TABLE public.osm_ingestion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osm_ingestion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osm_place_source_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.osm_ingestion_batches, public.osm_ingestion_items,
  public.osm_place_source_links FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.osm_start_batch(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_city_id uuid,
  p_boundary_id uuid, p_source_name text, p_source_version text, p_batch_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_boundary public.osm_city_boundaries%ROWTYPE;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(p_actor_admin_id, p_actor_auth_uid, p_city_id, 'create_pending');
  IF p_source_name IS DISTINCT FROM 'openstreetmap'
     OR p_source_version IS NULL OR pg_catalog.btrim(p_source_version) = '' OR p_batch_id IS NULL THEN
    RAISE EXCEPTION 'Invalid source or source version';
  END IF;
  SELECT * INTO v_boundary FROM public.osm_city_boundaries
  WHERE id = p_boundary_id AND city_id = p_city_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boundary not found for city'; END IF;
  INSERT INTO public.osm_ingestion_batches (
    id, city_id, boundary_id, source_name, source_version, actor_admin_id, actor_auth_uid
  ) VALUES (
    p_batch_id, p_city_id, p_boundary_id, p_source_name, p_source_version, p_actor_admin_id, p_actor_auth_uid
  );
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'ingestion_started', 'ingestion',
    'osm_ingestion_batch', p_batch_id,
    pg_catalog.jsonb_build_object('city_id', p_city_id, 'boundary_id', p_boundary_id,
      'source', p_source_name, 'source_version', p_source_version)
  ) RETURNING id INTO v_audit_id;
  RETURN pg_catalog.jsonb_build_object('batch_id', p_batch_id, 'audit_id', v_audit_id, 'geometry', v_boundary.geometry);
END;
$function$;

CREATE FUNCTION public.osm_authorize_batch(p_actor_admin_id uuid, p_actor_auth_uid uuid, p_batch_id uuid)
RETURNS public.osm_ingestion_batches
LANGUAGE plpgsql SET search_path = pg_catalog
AS $function$
DECLARE
  v_batch public.osm_ingestion_batches%ROWTYPE;
BEGIN
  SELECT * INTO v_batch FROM public.osm_ingestion_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND OR v_batch.actor_admin_id IS DISTINCT FROM p_actor_admin_id
     OR v_batch.actor_auth_uid IS DISTINCT FROM p_actor_auth_uid OR v_batch.status <> 'running' THEN
    RAISE EXCEPTION 'Batch unavailable or unauthorized';
  END IF;
  PERFORM public.civic_authorize_lifecycle_mutation(p_actor_admin_id, p_actor_auth_uid, v_batch.city_id, 'create_pending');
  RETURN v_batch;
END;
$function$;

CREATE FUNCTION public.osm_set_source_version(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_batch_id uuid, p_source_version text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_batch public.osm_ingestion_batches%ROWTYPE;
  v_role text;
  v_audit_id uuid;
BEGIN
  v_batch := public.osm_authorize_batch(p_actor_admin_id, p_actor_auth_uid, p_batch_id);
  v_role := public.civic_authorize_lifecycle_mutation(p_actor_admin_id, p_actor_auth_uid, v_batch.city_id, 'create_pending');
  IF v_batch.source_version <> 'unavailable' OR p_source_version IS NULL
     OR p_source_version !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
     OR EXISTS (SELECT 1 FROM public.osm_ingestion_items WHERE batch_id = p_batch_id) THEN
    RAISE EXCEPTION 'Invalid or already assigned source version';
  END IF;
  UPDATE public.osm_ingestion_batches SET source_version = p_source_version WHERE id = p_batch_id;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'ingestion_source_version_recorded', 'ingestion',
    'osm_ingestion_batch', p_batch_id, pg_catalog.jsonb_build_object('city_id', v_batch.city_id,
      'source', v_batch.source_name, 'source_version', p_source_version)
  ) RETURNING id INTO v_audit_id;
  RETURN pg_catalog.jsonb_build_object('batch_id', p_batch_id, 'source_version', p_source_version, 'audit_id', v_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_stage_item(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_batch_id uuid,
  p_external_id text, p_payload jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_batch public.osm_ingestion_batches%ROWTYPE;
  v_item public.osm_ingestion_items%ROWTYPE;
  v_role text;
  v_id uuid := pg_catalog.gen_random_uuid();
  v_audit_id uuid;
  v_hash text;
BEGIN
  v_batch := public.osm_authorize_batch(p_actor_admin_id, p_actor_auth_uid, p_batch_id);
  v_role := public.civic_authorize_lifecycle_mutation(p_actor_admin_id, p_actor_auth_uid, v_batch.city_id, 'create_pending');
  IF v_batch.source_version = 'unavailable' THEN RAISE EXCEPTION 'Source version is not recorded'; END IF;
  IF p_external_id IS NULL OR p_external_id !~ '^(node|way|relation)/[1-9][0-9]*$'
     OR p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload) <> 'object'
     OR p_external_id IS DISTINCT FROM ((p_payload->>'type') || '/' || (p_payload->>'id')) THEN
    RAISE EXCEPTION 'Invalid OSM item';
  END IF;
  v_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_payload::text, 'UTF8'), 'sha256'), 'hex');
  SELECT * INTO v_item FROM public.osm_ingestion_items WHERE batch_id = p_batch_id AND external_id = p_external_id;
  IF FOUND THEN
    IF v_item.source_hash <> v_hash THEN RAISE EXCEPTION 'Batch item payload changed'; END IF;
    RETURN pg_catalog.jsonb_build_object('raw_id', v_item.id, 'state', v_item.processed_state, 'audit_id', v_item.audit_id);
  END IF;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'ingestion_item_staged', 'ingestion',
    'osm_ingestion_item', v_id, pg_catalog.jsonb_build_object('city_id', v_batch.city_id,
      'batch_id', p_batch_id, 'source', v_batch.source_name, 'external_id', p_external_id, 'source_hash', v_hash)
  ) RETURNING id INTO v_audit_id;
  INSERT INTO public.osm_ingestion_items (
    id, batch_id, external_id, source_hash, payload, processed_state, disposition, audit_id
  ) VALUES (v_id, p_batch_id, p_external_id, v_hash, p_payload, 'staged', 'awaiting_processing', v_audit_id);
  RETURN pg_catalog.jsonb_build_object('raw_id', v_id, 'state', 'staged', 'audit_id', v_audit_id);
END;
$function$;

-- Only the trusted worker supplies normalized data and the geometry verdict.
CREATE FUNCTION public.osm_ingest_item(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_batch_id uuid,
  p_raw_id uuid, p_candidate jsonb, p_quarantine_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_batch public.osm_ingestion_batches%ROWTYPE;
  v_role text;
  v_existing public.osm_ingestion_items%ROWTYPE;
  v_audit_id uuid;
  v_place_id uuid;
  v_place_city uuid;
  v_match_hash text;
  v_external_id text;
  v_hash text;
  v_state text;
  v_reason text;
  v_result jsonb;
  v_count integer;
BEGIN
  v_batch := public.osm_authorize_batch(p_actor_admin_id, p_actor_auth_uid, p_batch_id);
  v_role := public.civic_authorize_lifecycle_mutation(p_actor_admin_id, p_actor_auth_uid, v_batch.city_id, 'create_pending');
  IF (p_quarantine_reason IS NULL AND (p_candidate IS NULL OR pg_catalog.jsonb_typeof(p_candidate) <> 'object'))
     OR (p_quarantine_reason IS NOT NULL AND pg_catalog.btrim(p_quarantine_reason) = '') THEN
    RAISE EXCEPTION 'Invalid OSM candidate';
  END IF;
  SELECT * INTO v_existing FROM public.osm_ingestion_items WHERE batch_id = p_batch_id AND id = p_raw_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Staged item not found'; END IF;
  IF v_existing.processed_state <> 'staged' THEN
    RETURN pg_catalog.jsonb_build_object('raw_id', v_existing.id, 'state', v_existing.processed_state,
      'disposition', v_existing.disposition, 'place_id', v_existing.place_id, 'audit_id', v_existing.audit_id);
  END IF;
  v_external_id := v_existing.external_id;
  v_hash := v_existing.source_hash;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('osm/place/' || v_external_id, 0));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('osm/city/' || v_batch.city_id::text, 0));
  IF p_quarantine_reason IS NOT NULL THEN
    v_state := 'quarantined'; v_reason := p_quarantine_reason;
  ELSE
    SELECT l.place_id, p.city_id, i.source_hash INTO v_place_id, v_place_city, v_match_hash
    FROM public.osm_place_source_links l
    JOIN public.civic_places p ON p.id = l.place_id
    JOIN public.osm_ingestion_items i ON i.id = l.raw_id
    WHERE l.source_name = 'openstreetmap' AND l.external_id = v_external_id;
    IF v_place_id IS NOT NULL THEN
      IF v_place_city IS DISTINCT FROM v_batch.city_id THEN
        v_state := 'quarantined'; v_reason := 'external_id_owned_by_another_city';
      ELSE
        v_state := 'duplicate';
        v_reason := CASE WHEN v_match_hash = v_hash THEN 'exact_duplicate' ELSE 'existing_object' END;
      END IF;
    ELSE
      SELECT count(*), min(id::text)::uuid INTO v_count, v_place_id FROM public.civic_places
      WHERE ingestion_source = 'openstreetmap'
        AND ingestion_metadata->>'osm_type' = split_part(v_external_id, '/', 1)
        AND ingestion_metadata->>'osm_id' = split_part(v_external_id, '/', 2);
      IF v_count > 0 THEN
        v_state := 'quarantined'; v_reason := 'legacy_external_id_requires_review';
        IF v_count <> 1 THEN v_place_id := NULL; END IF;
      END IF;
    END IF;
  END IF;
  IF v_state IS NULL THEN
    SELECT count(*), min(id::text)::uuid INTO v_count, v_place_id FROM public.civic_places
    WHERE city_id = v_batch.city_id AND (
      slug = p_candidate->>'slug'
      OR (latitude BETWEEN (p_candidate->>'latitude')::double precision - 0.0001
                       AND (p_candidate->>'latitude')::double precision + 0.0001
        AND longitude BETWEEN (p_candidate->>'longitude')::double precision - 0.0001
                        AND (p_candidate->>'longitude')::double precision + 0.0001)
    );
    IF v_count > 0 THEN
      v_state := 'quarantined'; v_reason := 'potential_duplicate';
      IF v_count <> 1 THEN v_place_id := NULL; END IF;
    END IF;
  END IF;
  IF v_state IS NULL THEN
    v_result := public.admin_mutate_civic_place(
      p_actor_admin_id, p_actor_auth_uid, v_batch.city_id, 'create_pending', NULL, p_candidate
    );
    v_place_id := (v_result->>'place_id')::uuid;
    UPDATE public.civic_places SET ingestion_source = 'openstreetmap',
      ingestion_metadata = pg_catalog.jsonb_build_object('source', 'openstreetmap',
        'source_version', v_batch.source_version, 'external_id', v_external_id,
        'batch_id', p_batch_id, 'raw_id', p_raw_id, 'source_hash', v_hash)
    WHERE id = v_place_id AND city_id = v_batch.city_id AND status = 'pending' AND is_published IS FALSE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Created Place state could not be confirmed'; END IF;
    v_state := 'created'; v_reason := 'created_pending';
  END IF;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role,
    CASE WHEN v_state = 'created' THEN 'ingestion_created' ELSE 'ingestion_item_disposition' END,
    'ingestion', 'osm_ingestion_item', p_raw_id,
    pg_catalog.jsonb_build_object('city_id', v_batch.city_id, 'batch_id', p_batch_id,
      'source', v_batch.source_name, 'source_version', v_batch.source_version, 'external_id', v_external_id,
      'source_hash', v_hash, 'state', v_state, 'reason', v_reason, 'place_id', v_place_id)
  ) RETURNING id INTO v_audit_id;
  UPDATE public.osm_ingestion_items SET processed_state = v_state, disposition = v_reason,
    place_id = v_place_id, audit_id = v_audit_id WHERE id = p_raw_id;
  IF v_state = 'created' THEN
    INSERT INTO public.osm_place_source_links (source_name, external_id, place_id, raw_id)
    VALUES ('openstreetmap', v_external_id, v_place_id, p_raw_id);
  END IF;
  RETURN pg_catalog.jsonb_build_object('raw_id', p_raw_id, 'state', v_state, 'disposition', v_reason,
    'place_id', v_place_id, 'audit_id', v_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_finish_batch(
  p_actor_admin_id uuid, p_actor_auth_uid uuid, p_batch_id uuid, p_error text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_batch public.osm_ingestion_batches%ROWTYPE;
  v_role text;
  v_status text;
  v_audit_id uuid;
  v_item public.osm_ingestion_items%ROWTYPE;
BEGIN
  SELECT * INTO v_batch FROM public.osm_ingestion_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND OR v_batch.status <> 'running' THEN RAISE EXCEPTION 'Batch unavailable'; END IF;
  v_role := public.civic_authorize_lifecycle_mutation(p_actor_admin_id, p_actor_auth_uid, v_batch.city_id, 'create_pending');
  IF p_error IS NULL AND (v_batch.actor_admin_id IS DISTINCT FROM p_actor_admin_id
      OR v_batch.actor_auth_uid IS DISTINCT FROM p_actor_auth_uid) THEN
    RAISE EXCEPTION 'Only the initiating actor may complete a batch';
  END IF;
  IF p_error IS NOT NULL AND pg_catalog.btrim(p_error) = '' THEN RAISE EXCEPTION 'Failure reason required'; END IF;
  IF p_error IS NULL AND EXISTS (
    SELECT 1 FROM public.osm_ingestion_items WHERE batch_id = p_batch_id AND processed_state = 'staged'
  ) THEN RAISE EXCEPTION 'Batch has unprocessed items'; END IF;
  IF p_error IS NOT NULL THEN
    FOR v_item IN SELECT * FROM public.osm_ingestion_items
      WHERE batch_id = p_batch_id AND processed_state = 'staged' FOR UPDATE
    LOOP
      INSERT INTO public.admin_action_logs (
        actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
      ) VALUES (
        p_actor_auth_uid, p_actor_admin_id, v_role, 'ingestion_item_disposition', 'ingestion',
        'osm_ingestion_item', v_item.id,
        pg_catalog.jsonb_build_object('city_id', v_batch.city_id, 'batch_id', p_batch_id,
          'source', v_batch.source_name, 'external_id', v_item.external_id, 'source_hash', v_item.source_hash,
          'state', 'failed', 'reason', p_error)
      ) RETURNING id INTO v_audit_id;
      UPDATE public.osm_ingestion_items SET processed_state = 'failed', disposition = p_error, audit_id = v_audit_id
      WHERE id = v_item.id;
    END LOOP;
  END IF;
  v_status := CASE WHEN p_error IS NULL THEN 'completed' ELSE 'failed' END;
  UPDATE public.osm_ingestion_batches SET status = v_status, error = p_error, completed_at = pg_catalog.now()
  WHERE id = p_batch_id;
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action, domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, v_role, 'ingestion_finished', 'ingestion',
    'osm_ingestion_batch', p_batch_id,
    pg_catalog.jsonb_build_object('city_id', v_batch.city_id, 'status', v_status, 'error', p_error)
  ) RETURNING id INTO v_audit_id;
  RETURN pg_catalog.jsonb_build_object('batch_id', p_batch_id, 'status', v_status, 'audit_id', v_audit_id);
END;
$function$;

CREATE FUNCTION public.osm_get_batch(p_actor_admin_id uuid, p_actor_auth_uid uuid, p_batch_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $function$
DECLARE
  v_batch public.osm_ingestion_batches%ROWTYPE;
  v_items jsonb;
BEGIN
  SELECT * INTO v_batch FROM public.osm_ingestion_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch not found'; END IF;
  PERFORM public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, v_batch.city_id, 'create_pending'
  );
  SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'raw_id', id, 'external_id', external_id, 'source_hash', source_hash,
    'state', processed_state, 'disposition', disposition, 'place_id', place_id, 'audit_id', audit_id
  ) ORDER BY created_at, id), '[]'::jsonb) INTO v_items
  FROM public.osm_ingestion_items WHERE batch_id = p_batch_id;
  RETURN pg_catalog.jsonb_build_object('batch_id', v_batch.id, 'city_id', v_batch.city_id,
    'boundary_id', v_batch.boundary_id, 'source', v_batch.source_name, 'source_version', v_batch.source_version,
    'actor_admin_id', v_batch.actor_admin_id, 'started_at', v_batch.started_at,
    'completed_at', v_batch.completed_at, 'status', v_batch.status, 'error', v_batch.error, 'items', v_items);
END;
$function$;

ALTER FUNCTION public.osm_start_batch(uuid, uuid, uuid, uuid, text, text, uuid) OWNER TO postgres;
ALTER FUNCTION public.osm_authorize_batch(uuid, uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.osm_set_source_version(uuid, uuid, uuid, text) OWNER TO postgres;
ALTER FUNCTION public.osm_stage_item(uuid, uuid, uuid, text, jsonb) OWNER TO postgres;
ALTER FUNCTION public.osm_ingest_item(uuid, uuid, uuid, uuid, jsonb, text) OWNER TO postgres;
ALTER FUNCTION public.osm_finish_batch(uuid, uuid, uuid, text) OWNER TO postgres;
ALTER FUNCTION public.osm_get_batch(uuid, uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.osm_authorize_batch(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.osm_set_source_version(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_start_batch(uuid, uuid, uuid, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_stage_item(uuid, uuid, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_ingest_item(uuid, uuid, uuid, uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_finish_batch(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.osm_get_batch(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.osm_start_batch(uuid, uuid, uuid, uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_set_source_version(uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_stage_item(uuid, uuid, uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_ingest_item(uuid, uuid, uuid, uuid, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_finish_batch(uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.osm_get_batch(uuid, uuid, uuid) TO service_role;

COMMIT;
