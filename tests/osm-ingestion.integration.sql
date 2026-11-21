-- Run after the fixture and required governance/ingestion migrations in an isolated database.
INSERT INTO public.cities VALUES
  ('11111111-1111-4111-8111-111111111111'), ('44444444-4444-4444-8444-444444444444');
INSERT INTO public.admin_users VALUES (
  '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333',
  'active', 'CITY_ADMIN', ARRAY['11111111-1111-4111-8111-111111111111']
), (
  '55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666',
  'active', 'CITY_ADMIN', ARRAY['11111111-1111-4111-8111-111111111111']
), (
  '77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888',
  'active', 'CITY_ADMIN', ARRAY['44444444-4444-4444-8444-444444444444']
);

DO $test$
DECLARE
  a uuid := '22222222-2222-4222-8222-222222222222';
  u uuid := '33333333-3333-4333-8333-333333333333';
  c uuid := '11111111-1111-4111-8111-111111111111';
  payload jsonb := '{"type":"node","id":1,"lat":48,"lon":-122,"tags":{"name":"Example"}}';
  candidate jsonb := '{"name":"Example","slug":"example","latitude":48,"longitude":-122,"place_type":"park"}';
  b jsonb; run jsonb; run2 jsonb; raw jsonb; item jsonb; again jsonb;
  duplicate jsonb; quarantined jsonb; failed jsonb; details jsonb; operations jsonb; p uuid;
BEGIN
  b := public.admin_register_osm_boundary(a, u, c, 'https://example.test', 'v1',
    '{"type":"Polygon","coordinates":[[[-123,47],[-121,47],[-121,49],[-123,49],[-123,47]]]}'::jsonb);
  run := public.osm_start_batch(a, u, c, (b->>'boundary_id')::uuid, 'openstreetmap', 'unavailable', gen_random_uuid());
  PERFORM public.osm_set_source_version(a, u, (run->>'batch_id')::uuid, '2026-11-19T21:00:00Z');
  raw := public.osm_stage_item(a, u, (run->>'batch_id')::uuid, 'node/1', payload);
  item := public.osm_ingest_item(a, u, (run->>'batch_id')::uuid, (raw->>'raw_id')::uuid, candidate, NULL);
  IF item->>'state' <> 'created' OR item->>'audit_id' IS NULL THEN RAISE EXCEPTION 'create: %', item; END IF;
  p := (item->>'place_id')::uuid;
  IF NOT EXISTS (SELECT 1 FROM public.civic_places WHERE id = p AND city_id = c AND status = 'pending'
      AND is_published IS FALSE AND ingestion_metadata->>'external_id' = 'node/1'
      AND ingestion_metadata->>'raw_id' = raw->>'raw_id'
      AND ingestion_metadata->>'source_version' = '2026-11-19T21:00:00Z') THEN
    RAISE EXCEPTION 'Place state or provenance invalid';
  END IF;
  again := public.osm_ingest_item(a, u, (run->>'batch_id')::uuid, (raw->>'raw_id')::uuid, candidate, NULL);
  IF again->>'place_id' <> item->>'place_id' THEN RAISE EXCEPTION 'same-batch retry failed'; END IF;
  run2 := public.osm_start_batch(a, u, c, (b->>'boundary_id')::uuid, 'openstreetmap', 'unavailable', gen_random_uuid());
  PERFORM public.osm_set_source_version(a, u, (run2->>'batch_id')::uuid, '2026-11-19T21:00:00Z');
  raw := public.osm_stage_item(a, u, (run2->>'batch_id')::uuid, 'node/1', payload);
  duplicate := public.osm_ingest_item(a, u, (run2->>'batch_id')::uuid, (raw->>'raw_id')::uuid, candidate, NULL);
  IF duplicate->>'state' <> 'duplicate' OR duplicate->>'disposition' <> 'exact_duplicate'
      OR (SELECT count(*) FROM public.civic_places) <> 1 THEN RAISE EXCEPTION 'retry: %', duplicate; END IF;
  raw := public.osm_stage_item(a, u, (run2->>'batch_id')::uuid, 'node/2', '{"type":"node","id":2}'::jsonb);
  quarantined := public.osm_ingest_item(a, u, (run2->>'batch_id')::uuid, (raw->>'raw_id')::uuid, NULL, 'location_outside');
  IF quarantined->>'state' <> 'quarantined' THEN RAISE EXCEPTION 'quarantine: %', quarantined; END IF;
  failed := public.osm_stage_item(a, u, (run2->>'batch_id')::uuid, 'node/3', '{"type":"node","id":3}'::jsonb);
  BEGIN
    PERFORM public.osm_finish_batch('77777777-7777-4777-8777-777777777777',
      '88888888-8888-4888-8888-888888888888', (run2->>'batch_id')::uuid, 'unauthorized');
    RAISE EXCEPTION 'cross-city abort authorized';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'cross-city abort authorized' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.osm_finish_batch('55555555-5555-4555-8555-555555555555',
      '66666666-6666-4666-8666-666666666666', (run2->>'batch_id')::uuid, NULL);
    RAISE EXCEPTION 'non-initiator completed batch';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'non-initiator completed batch' THEN RAISE; END IF;
  END;
  PERFORM public.osm_finish_batch('55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666', (run2->>'batch_id')::uuid, 'test failure');
  IF NOT EXISTS (SELECT 1 FROM public.osm_ingestion_items WHERE id = (failed->>'raw_id')::uuid
      AND processed_state = 'failed') THEN RAISE EXCEPTION 'failed item missing'; END IF;
  details := public.osm_get_batch(a, u, (run2->>'batch_id')::uuid);
  IF details->>'status' <> 'failed' OR jsonb_array_length(details->'items') <> 3 THEN
    RAISE EXCEPTION 'batch trace incomplete: %', details;
  END IF;
  operations := public.osm_operations_for_city(a, u, c);
  IF jsonb_array_length(operations->'boundaries') <> 1
      OR jsonb_array_length(operations->'batches') <> 2
      OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(operations->'batches') AS batch,
        jsonb_array_elements(batch->'items') AS entry
        WHERE entry->>'place_id' = p::text AND entry->>'place_status' = 'pending') THEN
    RAISE EXCEPTION 'operations read model incomplete: %', operations;
  END IF;
  IF pg_catalog.has_function_privilege('authenticated', 'public.osm_operations_for_city(uuid,uuid,uuid)', 'EXECUTE')
      OR NOT pg_catalog.has_function_privilege('service_role', 'public.osm_operations_for_city(uuid,uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'operations read privileges invalid';
  END IF;
  BEGIN
    PERFORM public.osm_operations_for_city(a, u, '44444444-4444-4444-8444-444444444444');
    RAISE EXCEPTION 'cross-city operations read authorized';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'cross-city operations read authorized' THEN RAISE; END IF;
  END;
  PERFORM public.admin_mutate_civic_place(a, u, c, 'approve', p, '{}');
  IF NOT EXISTS (SELECT 1 FROM public.civic_places WHERE id = p AND city_id = c
      AND status = 'approved' AND is_published IS TRUE) THEN
    RAISE EXCEPTION 'Place approval did not publish';
  END IF;
  PERFORM public.admin_mutate_civic_place(a, u, c, 'hide', p, '{}');
  PERFORM public.admin_mutate_civic_place(a, u, c, 'restore', p, '{}');
  IF NOT EXISTS (SELECT 1 FROM public.civic_places WHERE id = p AND status = 'pending' AND is_published IS FALSE)
      OR NOT EXISTS (SELECT 1 FROM public.admin_action_logs WHERE entity_id = p AND action = 'PLACE_APPROVE') THEN
    RAISE EXCEPTION 'review lifecycle or audit failed';
  END IF;
  IF pg_catalog.has_function_privilege('authenticated', 'public.osm_ingest_item(uuid,uuid,uuid,uuid,jsonb,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated can ingest';
  END IF;
  BEGIN
    PERFORM public.osm_start_batch(a, u, '44444444-4444-4444-8444-444444444444',
      (b->>'boundary_id')::uuid, 'openstreetmap', 'unavailable', gen_random_uuid());
    RAISE EXCEPTION 'cross-city authorized';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'cross-city authorized' THEN RAISE; END IF;
  END;
END;
$test$;

DO $preparation_test$
DECLARE
  a uuid := '22222222-2222-4222-8222-222222222222';
  u uuid := '33333333-3333-4333-8333-333333333333';
  c uuid := '11111111-1111-4111-8111-111111111111';
  source_shape jsonb := '{"type":"Polygon","coordinates":[[[0,0],[10,0],[10,10],[0,10],[0,0]]]}'::jsonb;
  analysis jsonb := '{"valid":true,"bounds":{"west":0,"south":0,"east":10,"north":10}}'::jsonb;
  metadata jsonb := '{"algorithm":"Douglas-Peucker","algorithm_version":"JSTS 2.12.1","projection":"local AEQD","tolerance_meters":0.1,"validation_passed":false,"containment":{"grid_differences":0,"boundary_differences":6}}'::jsonb;
  prep jsonb; candidate jsonb; candidate2 jsonb; approved jsonb; registered jsonb; prep_id uuid; boundary_id uuid;
  oversized jsonb; oversized_id uuid;
BEGIN
  prep := public.osm_create_boundary_preparation(a, u, c, 'https://example.test/oakland', '2026-11-20',
    source_shape, repeat('a', 64), 5, pg_catalog.octet_length(source_shape::text), 1, analysis);
  prep_id := (prep->>'preparation_id')::uuid;
  candidate := public.osm_save_boundary_preparation_candidate(a, u, prep_id, source_shape,
    repeat('b', 64), 5, pg_catalog.octet_length(source_shape::text), metadata);
  candidate2 := public.osm_save_boundary_preparation_candidate(a, u, prep_id, source_shape,
    repeat('c', 64), 5, pg_catalog.octet_length(source_shape::text), metadata);
  IF candidate->>'candidate_version' <> '1' OR candidate2->>'candidate_version' <> '2'
      OR (SELECT count(*) FROM public.osm_boundary_preparation_candidates WHERE preparation_id = prep_id) <> 2
      OR NOT EXISTS (SELECT 1 FROM public.osm_boundary_preparation_candidates
        WHERE preparation_id = prep_id AND version = 1 AND geometry_hash = repeat('b', 64)) THEN
    RAISE EXCEPTION 'Candidate versions were not retained';
  END IF;
  BEGIN
    PERFORM public.osm_approve_boundary_preparation(a, u, prep_id, false);
    RAISE EXCEPTION 'boundary changes approved without acknowledgement';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'boundary changes approved without acknowledgement' THEN RAISE; END IF;
  END;
  approved := public.osm_approve_boundary_preparation(a, u, prep_id, true);
  registered := public.osm_register_prepared_boundary(a, u, prep_id);
  boundary_id := (registered->>'boundary_id')::uuid;
  IF boundary_id IS NULL OR registered->>'preparation_id' <> prep_id::text
      OR NOT EXISTS (SELECT 1 FROM public.osm_boundary_preparations p
        WHERE p.id = prep_id AND p.status = 'registered'
          AND p.source_geometry = source_shape AND p.prepared_geometry = source_shape
          AND p.source_hash = repeat('a', 64) AND p.prepared_hash = repeat('c', 64)
          AND p.prepared_version = 2 AND p.current_candidate_id = (candidate2->>'candidate_id')::uuid
          AND p.registered_boundary_id = boundary_id)
      OR NOT EXISTS (SELECT 1 FROM public.osm_city_boundaries b
        WHERE b.id = boundary_id AND b.city_id = c AND b.geometry = source_shape)
      OR NOT EXISTS (SELECT 1 FROM public.osm_boundary_preparation_candidates
        WHERE id = (candidate2->>'candidate_id')::uuid AND version = 2 AND geometry = source_shape) THEN
    RAISE EXCEPTION 'Prepared boundary registration did not preserve source/candidate provenance';
  END IF;
  IF (SELECT count(*) FROM public.admin_action_logs
      WHERE entity_type = 'osm_boundary_preparation' AND entity_id = prep_id
        AND action IN ('boundary_uploaded','boundary_analysis_completed','boundary_prepared',
          'boundary_preparation_approved','boundary_registered')) <> 6
      OR registered->>'audit_id' IS NULL OR registered->>'link_audit_id' IS NULL THEN
    RAISE EXCEPTION 'Boundary preparation audit chain is incomplete';
  END IF;
    IF NOT EXISTS (SELECT 1 FROM public.admin_action_logs AS log WHERE log.entity_type = 'osm_boundary_preparation'
      AND log.entity_id = prep_id AND log.action = 'boundary_preparation_approved'
      AND log.metadata->>'acknowledged_boundary_differences' = 'true') THEN
    RAISE EXCEPTION 'Boundary difference acknowledgement was not audited';
  END IF;
    oversized := public.osm_create_boundary_preparation(a, u, c, 'https://example.test/large-city', 'v1',
      source_shape, repeat('c', 64), 6000, 100000, 1, analysis);
    oversized_id := (oversized->>'preparation_id')::uuid;
    PERFORM public.osm_save_boundary_preparation_candidate(a, u, oversized_id, source_shape,
      repeat('d', 64), 5001, 100000, metadata);
    BEGIN
      PERFORM public.osm_approve_boundary_preparation(a, u, oversized_id, true);
      RAISE EXCEPTION 'over-limit candidate approved';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM = 'over-limit candidate approved' THEN RAISE; END IF;
    END;
    IF NOT EXISTS (SELECT 1 FROM public.osm_boundary_preparations p
        WHERE p.id = oversized_id AND p.status = 'prepared' AND p.prepared_coordinate_count = 5001) THEN
      RAISE EXCEPTION 'over-limit candidate was not retained for operator review';
    END IF;
  IF pg_catalog.has_function_privilege('authenticated',
      'public.osm_create_boundary_preparation(uuid,uuid,uuid,text,text,jsonb,text,integer,integer,integer,jsonb)', 'EXECUTE')
      OR NOT pg_catalog.has_function_privilege('service_role',
      'public.osm_register_prepared_boundary(uuid,uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Boundary preparation RPC privileges are invalid';
  END IF;
END;
$preparation_test$;
