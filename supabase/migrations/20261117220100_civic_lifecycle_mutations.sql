BEGIN;

CREATE FUNCTION public.admin_mutate_civic_entity(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_operation text,
  p_object_id uuid,
  p_object_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_input public.civic_entities%ROWTYPE;
  v_old public.civic_entities%ROWTYPE;
  v_result public.civic_entities%ROWTYPE;
  v_status text;
  v_is_published boolean;
  v_changed_fields text[];
  v_audit_metadata jsonb;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id, p_operation
  );
  PERFORM public.civic_validate_lifecycle_payload(
    p_operation, p_object_data, '{"name":"string","slug":"string","entity_type":"string","roles":"string","description":"string","summary":"string","birth_year":"number","death_year":"number","year":"number","era_id":"string","tags":"string_array","thumbnail_url":"string","hero_image_url":"string","hero_360_url":"string","media_urls":"string_array"}'::jsonb,
    ARRAY['name', 'entity_type']::text[]
  );
  IF p_operation = 'create_pending' AND p_object_id IS NOT NULL THEN
    RAISE EXCEPTION 'Object ID is not accepted for creation';
  ELSIF p_operation <> 'create_pending' AND p_object_id IS NULL THEN
    RAISE EXCEPTION 'Object ID is required';
  END IF;
  IF p_operation IN ('create_pending', 'edit_metadata') AND p_object_data ? 'slug'
     AND (pg_catalog.jsonb_typeof(p_object_data->'slug') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_object_data->>'slug') = '') THEN
    RAISE EXCEPTION 'Slug must be a nonblank string';
  END IF;

  IF p_operation IN ('create_pending', 'edit_metadata') THEN
    v_input := pg_catalog.jsonb_populate_record(NULL::public.civic_entities, p_object_data);
    SELECT pg_catalog.array_agg(key ORDER BY key) INTO v_changed_fields
    FROM pg_catalog.jsonb_object_keys(p_object_data) AS supplied(key);
  END IF;

  IF p_operation = 'create_pending' THEN
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, NULL, NULL);
    IF v_input.slug IS NULL THEN
      v_input.slug := pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.btrim(v_input.name)), '[^a-z0-9]+', '-', 'g'
      ), '-');
    END IF;
    IF v_input.slug = '' THEN
      RAISE EXCEPTION 'A nonblank slug is required';
    END IF;
    INSERT INTO public.civic_entities (
      city_id, name,
      slug,
      entity_type,
      roles,
      description,
      summary,
      birth_year,
      death_year,
      year,
      era_id,
      tags,
      thumbnail_url,
      hero_image_url,
      hero_360_url,
      media_urls,
      status, is_published, updated_by, updated_at
    ) VALUES (
      p_expected_city_id, v_input.name,
      v_input.slug,
      v_input.entity_type,
      v_input.roles,
      v_input.description,
      v_input.summary,
      v_input.birth_year,
      v_input.death_year,
      v_input.year,
      v_input.era_id,
      v_input.tags,
      v_input.thumbnail_url,
      v_input.hero_image_url,
      v_input.hero_360_url,
      v_input.media_urls,
      v_status, v_is_published, p_actor_auth_uid, pg_catalog.now()
    )
    RETURNING * INTO v_result;
    v_audit_metadata := pg_catalog.jsonb_build_object(
      'changed_fields', pg_catalog.to_jsonb(v_changed_fields),
      'lifecycle', pg_catalog.jsonb_build_object(
        'status', v_result.status, 'is_published', v_result.is_published
      )
    );
  ELSE
    SELECT * INTO v_old FROM public.civic_entities
    WHERE id = p_object_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Civic object not found';
    END IF;
    IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Civic object city changed or is unavailable';
    END IF;
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, v_old.status, v_old.is_published);

    IF p_operation = 'edit_metadata' THEN
      UPDATE public.civic_entities
      SET name = CASE WHEN p_object_data ? 'name' THEN v_input.name ELSE name END,
        slug = CASE WHEN p_object_data ? 'slug' THEN v_input.slug ELSE slug END,
        entity_type = CASE WHEN p_object_data ? 'entity_type' THEN v_input.entity_type ELSE entity_type END,
        roles = CASE WHEN p_object_data ? 'roles' THEN v_input.roles ELSE roles END,
        description = CASE WHEN p_object_data ? 'description' THEN v_input.description ELSE description END,
        summary = CASE WHEN p_object_data ? 'summary' THEN v_input.summary ELSE summary END,
        birth_year = CASE WHEN p_object_data ? 'birth_year' THEN v_input.birth_year ELSE birth_year END,
        death_year = CASE WHEN p_object_data ? 'death_year' THEN v_input.death_year ELSE death_year END,
        year = CASE WHEN p_object_data ? 'year' THEN v_input.year ELSE year END,
        era_id = CASE WHEN p_object_data ? 'era_id' THEN v_input.era_id ELSE era_id END,
        tags = CASE WHEN p_object_data ? 'tags' THEN v_input.tags ELSE tags END,
        thumbnail_url = CASE WHEN p_object_data ? 'thumbnail_url' THEN v_input.thumbnail_url ELSE thumbnail_url END,
        hero_image_url = CASE WHEN p_object_data ? 'hero_image_url' THEN v_input.hero_image_url ELSE hero_image_url END,
        hero_360_url = CASE WHEN p_object_data ? 'hero_360_url' THEN v_input.hero_360_url ELSE hero_360_url END,
        media_urls = CASE WHEN p_object_data ? 'media_urls' THEN v_input.media_urls ELSE media_urls END,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields)
      );
    ELSE
      UPDATE public.civic_entities
      SET status = v_status, is_published = v_is_published,
          updated_by = p_actor_auth_uid, updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'lifecycle', pg_catalog.jsonb_build_object(
          'from_status', v_old.status, 'from_is_published', v_old.is_published,
          'to_status', v_result.status, 'to_is_published', v_result.is_published
        )
      );
    END IF;
  END IF;

  v_audit_id := public.civic_write_lifecycle_audit(
    p_actor_admin_id, p_actor_auth_uid, v_role, p_operation,
    'civic_entities', v_result.id, v_result.city_id, v_audit_metadata
  );
  RETURN pg_catalog.jsonb_build_object(
    'entity_id', v_result.id, 'city_id', v_result.city_id,
    'operation', p_operation, 'audit_id', v_audit_id,
    'status', v_result.status, 'is_published', v_result.is_published
  );
END;
$function$;

ALTER FUNCTION public.admin_mutate_civic_entity(uuid, uuid, uuid, text, uuid, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_mutate_civic_entity(uuid, uuid, uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_civic_entity(uuid, uuid, uuid, text, uuid, jsonb) TO service_role;

CREATE FUNCTION public.admin_mutate_civic_event(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_operation text,
  p_object_id uuid,
  p_object_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_input public.civic_events%ROWTYPE;
  v_old public.civic_events%ROWTYPE;
  v_result public.civic_events%ROWTYPE;
  v_status text;
  v_is_published boolean;
  v_changed_fields text[];
  v_audit_metadata jsonb;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id, p_operation
  );
  PERFORM public.civic_validate_lifecycle_payload(
    p_operation, p_object_data, '{"name":"string","slug":"string","event_type":"string","description":"string","start_date":"string","end_date":"string","severity":"string","casualties":"number","economic_impact":"number","tags":"string_array","thumbnail_360_url":"string"}'::jsonb,
    ARRAY['name', 'event_type']::text[]
  );
  IF p_operation = 'create_pending' AND p_object_id IS NOT NULL THEN
    RAISE EXCEPTION 'Object ID is not accepted for creation';
  ELSIF p_operation <> 'create_pending' AND p_object_id IS NULL THEN
    RAISE EXCEPTION 'Object ID is required';
  END IF;
  IF p_operation IN ('create_pending', 'edit_metadata') AND p_object_data ? 'slug'
     AND (pg_catalog.jsonb_typeof(p_object_data->'slug') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_object_data->>'slug') = '') THEN
    RAISE EXCEPTION 'Slug must be a nonblank string';
  END IF;

  IF p_operation IN ('create_pending', 'edit_metadata') THEN
    v_input := pg_catalog.jsonb_populate_record(NULL::public.civic_events, p_object_data);
    SELECT pg_catalog.array_agg(key ORDER BY key) INTO v_changed_fields
    FROM pg_catalog.jsonb_object_keys(p_object_data) AS supplied(key);
  END IF;

  IF p_operation = 'create_pending' THEN
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, NULL, NULL);
    IF v_input.slug IS NULL THEN
      v_input.slug := pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.btrim(v_input.name)), '[^a-z0-9]+', '-', 'g'
      ), '-');
    END IF;
    IF v_input.slug = '' THEN
      RAISE EXCEPTION 'A nonblank slug is required';
    END IF;
    INSERT INTO public.civic_events (
      city_id, name,
      slug,
      event_type,
      description,
      start_date,
      end_date,
      severity,
      casualties,
      economic_impact,
      tags,
      thumbnail_360_url,
      status, is_published, updated_by, updated_at
    ) VALUES (
      p_expected_city_id, v_input.name,
      v_input.slug,
      v_input.event_type,
      v_input.description,
      v_input.start_date,
      v_input.end_date,
      v_input.severity,
      v_input.casualties,
      v_input.economic_impact,
      v_input.tags,
      v_input.thumbnail_360_url,
      v_status, v_is_published, p_actor_auth_uid, pg_catalog.now()
    )
    RETURNING * INTO v_result;
    v_audit_metadata := pg_catalog.jsonb_build_object(
      'changed_fields', pg_catalog.to_jsonb(v_changed_fields),
      'lifecycle', pg_catalog.jsonb_build_object(
        'status', v_result.status, 'is_published', v_result.is_published
      )
    );
  ELSE
    SELECT * INTO v_old FROM public.civic_events
    WHERE id = p_object_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Civic object not found';
    END IF;
    IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Civic object city changed or is unavailable';
    END IF;
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, v_old.status, v_old.is_published);

    IF p_operation = 'edit_metadata' THEN
      UPDATE public.civic_events
      SET name = CASE WHEN p_object_data ? 'name' THEN v_input.name ELSE name END,
        slug = CASE WHEN p_object_data ? 'slug' THEN v_input.slug ELSE slug END,
        event_type = CASE WHEN p_object_data ? 'event_type' THEN v_input.event_type ELSE event_type END,
        description = CASE WHEN p_object_data ? 'description' THEN v_input.description ELSE description END,
        start_date = CASE WHEN p_object_data ? 'start_date' THEN v_input.start_date ELSE start_date END,
        end_date = CASE WHEN p_object_data ? 'end_date' THEN v_input.end_date ELSE end_date END,
        severity = CASE WHEN p_object_data ? 'severity' THEN v_input.severity ELSE severity END,
        casualties = CASE WHEN p_object_data ? 'casualties' THEN v_input.casualties ELSE casualties END,
        economic_impact = CASE WHEN p_object_data ? 'economic_impact' THEN v_input.economic_impact ELSE economic_impact END,
        tags = CASE WHEN p_object_data ? 'tags' THEN v_input.tags ELSE tags END,
        thumbnail_360_url = CASE WHEN p_object_data ? 'thumbnail_360_url' THEN v_input.thumbnail_360_url ELSE thumbnail_360_url END,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields)
      );
    ELSE
      UPDATE public.civic_events
      SET status = v_status, is_published = v_is_published,
          updated_by = p_actor_auth_uid, updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'lifecycle', pg_catalog.jsonb_build_object(
          'from_status', v_old.status, 'from_is_published', v_old.is_published,
          'to_status', v_result.status, 'to_is_published', v_result.is_published
        )
      );
    END IF;
  END IF;

  v_audit_id := public.civic_write_lifecycle_audit(
    p_actor_admin_id, p_actor_auth_uid, v_role, p_operation,
    'civic_events', v_result.id, v_result.city_id, v_audit_metadata
  );
  RETURN pg_catalog.jsonb_build_object(
    'event_id', v_result.id, 'city_id', v_result.city_id,
    'operation', p_operation, 'audit_id', v_audit_id,
    'status', v_result.status, 'is_published', v_result.is_published
  );
END;
$function$;

ALTER FUNCTION public.admin_mutate_civic_event(uuid, uuid, uuid, text, uuid, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_mutate_civic_event(uuid, uuid, uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_civic_event(uuid, uuid, uuid, text, uuid, jsonb) TO service_role;

CREATE FUNCTION public.admin_mutate_civic_artifact(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_operation text,
  p_object_id uuid,
  p_object_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_input public.civic_artifacts%ROWTYPE;
  v_old public.civic_artifacts%ROWTYPE;
  v_result public.civic_artifacts%ROWTYPE;
  v_status text;
  v_is_published boolean;
  v_changed_fields text[];
  v_audit_metadata jsonb;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id, p_operation
  );
  PERFORM public.civic_validate_lifecycle_payload(
    p_operation, p_object_data, '{"title":"string","slug":"string","artifact_type":"string","description":"string","media_url":"string","year":"number","hero_image_url":"string","hero_360_url":"string","media_urls":"string_array","tags":"string_array","related_event_ids":"string_array"}'::jsonb,
    ARRAY['title', 'artifact_type']::text[]
  );
  IF p_operation = 'create_pending' AND p_object_id IS NOT NULL THEN
    RAISE EXCEPTION 'Object ID is not accepted for creation';
  ELSIF p_operation <> 'create_pending' AND p_object_id IS NULL THEN
    RAISE EXCEPTION 'Object ID is required';
  END IF;
  IF p_operation IN ('create_pending', 'edit_metadata') AND p_object_data ? 'slug'
     AND (pg_catalog.jsonb_typeof(p_object_data->'slug') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_object_data->>'slug') = '') THEN
    RAISE EXCEPTION 'Slug must be a nonblank string';
  END IF;

  IF p_operation IN ('create_pending', 'edit_metadata') THEN
    v_input := pg_catalog.jsonb_populate_record(NULL::public.civic_artifacts, p_object_data);
    SELECT pg_catalog.array_agg(key ORDER BY key) INTO v_changed_fields
    FROM pg_catalog.jsonb_object_keys(p_object_data) AS supplied(key);
  END IF;

  IF p_operation = 'create_pending' THEN
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, NULL, NULL);
    IF v_input.slug IS NULL THEN
      v_input.slug := pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.btrim(v_input.title)), '[^a-z0-9]+', '-', 'g'
      ), '-');
    END IF;
    IF v_input.slug = '' THEN
      RAISE EXCEPTION 'A nonblank slug is required';
    END IF;
    INSERT INTO public.civic_artifacts (
      city_id, title,
      slug,
      artifact_type,
      description,
      media_url,
      year,
      hero_image_url,
      hero_360_url,
      media_urls,
      tags,
      related_event_ids,
      status, is_published, updated_by, updated_at
    ) VALUES (
      p_expected_city_id, v_input.title,
      v_input.slug,
      v_input.artifact_type,
      v_input.description,
      v_input.media_url,
      v_input.year,
      v_input.hero_image_url,
      v_input.hero_360_url,
      v_input.media_urls,
      v_input.tags,
      v_input.related_event_ids,
      v_status, v_is_published, p_actor_auth_uid, pg_catalog.now()
    )
    RETURNING * INTO v_result;
    v_audit_metadata := pg_catalog.jsonb_build_object(
      'changed_fields', pg_catalog.to_jsonb(v_changed_fields),
      'lifecycle', pg_catalog.jsonb_build_object(
        'status', v_result.status, 'is_published', v_result.is_published
      )
    );
  ELSE
    SELECT * INTO v_old FROM public.civic_artifacts
    WHERE id = p_object_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Civic object not found';
    END IF;
    IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Civic object city changed or is unavailable';
    END IF;
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, v_old.status, v_old.is_published);

    IF p_operation = 'edit_metadata' THEN
      UPDATE public.civic_artifacts
      SET title = CASE WHEN p_object_data ? 'title' THEN v_input.title ELSE title END,
        slug = CASE WHEN p_object_data ? 'slug' THEN v_input.slug ELSE slug END,
        artifact_type = CASE WHEN p_object_data ? 'artifact_type' THEN v_input.artifact_type ELSE artifact_type END,
        description = CASE WHEN p_object_data ? 'description' THEN v_input.description ELSE description END,
        media_url = CASE WHEN p_object_data ? 'media_url' THEN v_input.media_url ELSE media_url END,
        year = CASE WHEN p_object_data ? 'year' THEN v_input.year ELSE year END,
        hero_image_url = CASE WHEN p_object_data ? 'hero_image_url' THEN v_input.hero_image_url ELSE hero_image_url END,
        hero_360_url = CASE WHEN p_object_data ? 'hero_360_url' THEN v_input.hero_360_url ELSE hero_360_url END,
        media_urls = CASE WHEN p_object_data ? 'media_urls' THEN v_input.media_urls ELSE media_urls END,
        tags = CASE WHEN p_object_data ? 'tags' THEN v_input.tags ELSE tags END,
        related_event_ids = CASE WHEN p_object_data ? 'related_event_ids' THEN v_input.related_event_ids ELSE related_event_ids END,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields)
      );
    ELSE
      UPDATE public.civic_artifacts
      SET status = v_status, is_published = v_is_published,
          updated_by = p_actor_auth_uid, updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'lifecycle', pg_catalog.jsonb_build_object(
          'from_status', v_old.status, 'from_is_published', v_old.is_published,
          'to_status', v_result.status, 'to_is_published', v_result.is_published
        )
      );
    END IF;
  END IF;

  v_audit_id := public.civic_write_lifecycle_audit(
    p_actor_admin_id, p_actor_auth_uid, v_role, p_operation,
    'civic_artifacts', v_result.id, v_result.city_id, v_audit_metadata
  );
  RETURN pg_catalog.jsonb_build_object(
    'artifact_id', v_result.id, 'city_id', v_result.city_id,
    'operation', p_operation, 'audit_id', v_audit_id,
    'status', v_result.status, 'is_published', v_result.is_published
  );
END;
$function$;

ALTER FUNCTION public.admin_mutate_civic_artifact(uuid, uuid, uuid, text, uuid, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_mutate_civic_artifact(uuid, uuid, uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_civic_artifact(uuid, uuid, uuid, text, uuid, jsonb) TO service_role;

CREATE FUNCTION public.admin_mutate_civic_neighborhood(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_operation text,
  p_object_id uuid,
  p_object_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_input public.civic_neighborhoods%ROWTYPE;
  v_old public.civic_neighborhoods%ROWTYPE;
  v_result public.civic_neighborhoods%ROWTYPE;
  v_status text;
  v_is_published boolean;
  v_changed_fields text[];
  v_audit_metadata jsonb;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id, p_operation
  );
  PERFORM public.civic_validate_lifecycle_payload(
    p_operation, p_object_data, '{"name":"string","slug":"string","description":"string"}'::jsonb,
    ARRAY['name']::text[]
  );
  IF p_operation = 'create_pending' AND p_object_id IS NOT NULL THEN
    RAISE EXCEPTION 'Object ID is not accepted for creation';
  ELSIF p_operation <> 'create_pending' AND p_object_id IS NULL THEN
    RAISE EXCEPTION 'Object ID is required';
  END IF;
  IF p_operation IN ('create_pending', 'edit_metadata') AND p_object_data ? 'slug'
     AND (pg_catalog.jsonb_typeof(p_object_data->'slug') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_object_data->>'slug') = '') THEN
    RAISE EXCEPTION 'Slug must be a nonblank string';
  END IF;

  IF p_operation IN ('create_pending', 'edit_metadata') THEN
    v_input := pg_catalog.jsonb_populate_record(NULL::public.civic_neighborhoods, p_object_data);
    SELECT pg_catalog.array_agg(key ORDER BY key) INTO v_changed_fields
    FROM pg_catalog.jsonb_object_keys(p_object_data) AS supplied(key);
  END IF;

  IF p_operation = 'create_pending' THEN
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, NULL, NULL);
    IF v_input.slug IS NULL THEN
      v_input.slug := pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.btrim(v_input.name)), '[^a-z0-9]+', '-', 'g'
      ), '-');
    END IF;
    IF v_input.slug = '' THEN
      RAISE EXCEPTION 'A nonblank slug is required';
    END IF;
    INSERT INTO public.civic_neighborhoods (
      city_id, name,
      slug,
      description,
      status, is_published, updated_by, updated_at
    ) VALUES (
      p_expected_city_id, v_input.name,
      v_input.slug,
      v_input.description,
      v_status, v_is_published, p_actor_auth_uid, pg_catalog.now()
    )
    RETURNING * INTO v_result;
    v_audit_metadata := pg_catalog.jsonb_build_object(
      'changed_fields', pg_catalog.to_jsonb(v_changed_fields),
      'lifecycle', pg_catalog.jsonb_build_object(
        'status', v_result.status, 'is_published', v_result.is_published
      )
    );
  ELSE
    SELECT * INTO v_old FROM public.civic_neighborhoods
    WHERE id = p_object_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Civic object not found';
    END IF;
    IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Civic object city changed or is unavailable';
    END IF;
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, v_old.status, v_old.is_published);

    IF p_operation = 'edit_metadata' THEN
      UPDATE public.civic_neighborhoods
      SET name = CASE WHEN p_object_data ? 'name' THEN v_input.name ELSE name END,
        slug = CASE WHEN p_object_data ? 'slug' THEN v_input.slug ELSE slug END,
        description = CASE WHEN p_object_data ? 'description' THEN v_input.description ELSE description END,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields)
      );
    ELSE
      UPDATE public.civic_neighborhoods
      SET status = v_status, is_published = v_is_published,
          updated_by = p_actor_auth_uid, updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'lifecycle', pg_catalog.jsonb_build_object(
          'from_status', v_old.status, 'from_is_published', v_old.is_published,
          'to_status', v_result.status, 'to_is_published', v_result.is_published
        )
      );
    END IF;
  END IF;

  v_audit_id := public.civic_write_lifecycle_audit(
    p_actor_admin_id, p_actor_auth_uid, v_role, p_operation,
    'civic_neighborhoods', v_result.id, v_result.city_id, v_audit_metadata
  );
  RETURN pg_catalog.jsonb_build_object(
    'neighborhood_id', v_result.id, 'city_id', v_result.city_id,
    'operation', p_operation, 'audit_id', v_audit_id,
    'status', v_result.status, 'is_published', v_result.is_published
  );
END;
$function$;

ALTER FUNCTION public.admin_mutate_civic_neighborhood(uuid, uuid, uuid, text, uuid, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_mutate_civic_neighborhood(uuid, uuid, uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_civic_neighborhood(uuid, uuid, uuid, text, uuid, jsonb) TO service_role;

CREATE FUNCTION public.admin_mutate_civic_era(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_operation text,
  p_object_id uuid,
  p_object_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_input public.civic_eras%ROWTYPE;
  v_old public.civic_eras%ROWTYPE;
  v_result public.civic_eras%ROWTYPE;
  v_status text;
  v_is_published boolean;
  v_changed_fields text[];
  v_audit_metadata jsonb;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id, p_operation
  );
  PERFORM public.civic_validate_lifecycle_payload(
    p_operation, p_object_data, '{"name":"string","slug":"string","description":"string","start_year":"number","end_year":"number"}'::jsonb,
    ARRAY['name']::text[]
  );
  IF p_operation = 'create_pending' AND p_object_id IS NOT NULL THEN
    RAISE EXCEPTION 'Object ID is not accepted for creation';
  ELSIF p_operation <> 'create_pending' AND p_object_id IS NULL THEN
    RAISE EXCEPTION 'Object ID is required';
  END IF;
  IF p_operation IN ('create_pending', 'edit_metadata') AND p_object_data ? 'slug'
     AND (pg_catalog.jsonb_typeof(p_object_data->'slug') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_object_data->>'slug') = '') THEN
    RAISE EXCEPTION 'Slug must be a nonblank string';
  END IF;

  IF p_operation IN ('create_pending', 'edit_metadata') THEN
    v_input := pg_catalog.jsonb_populate_record(NULL::public.civic_eras, p_object_data);
    SELECT pg_catalog.array_agg(key ORDER BY key) INTO v_changed_fields
    FROM pg_catalog.jsonb_object_keys(p_object_data) AS supplied(key);
  END IF;

  IF p_operation = 'create_pending' THEN
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, NULL, NULL);
    IF v_input.slug IS NULL THEN
      v_input.slug := pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.btrim(v_input.name)), '[^a-z0-9]+', '-', 'g'
      ), '-');
    END IF;
    IF v_input.slug = '' THEN
      RAISE EXCEPTION 'A nonblank slug is required';
    END IF;
    INSERT INTO public.civic_eras (
      city_id, name,
      slug,
      description,
      start_year,
      end_year,
      status, is_published, updated_by, updated_at
    ) VALUES (
      p_expected_city_id, v_input.name,
      v_input.slug,
      v_input.description,
      v_input.start_year,
      v_input.end_year,
      v_status, v_is_published, p_actor_auth_uid, pg_catalog.now()
    )
    RETURNING * INTO v_result;
    v_audit_metadata := pg_catalog.jsonb_build_object(
      'changed_fields', pg_catalog.to_jsonb(v_changed_fields),
      'lifecycle', pg_catalog.jsonb_build_object(
        'status', v_result.status, 'is_published', v_result.is_published
      )
    );
  ELSE
    SELECT * INTO v_old FROM public.civic_eras
    WHERE id = p_object_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Civic object not found';
    END IF;
    IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Civic object city changed or is unavailable';
    END IF;
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, v_old.status, v_old.is_published);

    IF p_operation = 'edit_metadata' THEN
      UPDATE public.civic_eras
      SET name = CASE WHEN p_object_data ? 'name' THEN v_input.name ELSE name END,
        slug = CASE WHEN p_object_data ? 'slug' THEN v_input.slug ELSE slug END,
        description = CASE WHEN p_object_data ? 'description' THEN v_input.description ELSE description END,
        start_year = CASE WHEN p_object_data ? 'start_year' THEN v_input.start_year ELSE start_year END,
        end_year = CASE WHEN p_object_data ? 'end_year' THEN v_input.end_year ELSE end_year END,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields)
      );
    ELSE
      UPDATE public.civic_eras
      SET status = v_status, is_published = v_is_published,
          updated_by = p_actor_auth_uid, updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'lifecycle', pg_catalog.jsonb_build_object(
          'from_status', v_old.status, 'from_is_published', v_old.is_published,
          'to_status', v_result.status, 'to_is_published', v_result.is_published
        )
      );
    END IF;
  END IF;

  v_audit_id := public.civic_write_lifecycle_audit(
    p_actor_admin_id, p_actor_auth_uid, v_role, p_operation,
    'civic_eras', v_result.id, v_result.city_id, v_audit_metadata
  );
  RETURN pg_catalog.jsonb_build_object(
    'era_id', v_result.id, 'city_id', v_result.city_id,
    'operation', p_operation, 'audit_id', v_audit_id,
    'status', v_result.status, 'is_published', v_result.is_published
  );
END;
$function$;

ALTER FUNCTION public.admin_mutate_civic_era(uuid, uuid, uuid, text, uuid, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_mutate_civic_era(uuid, uuid, uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_civic_era(uuid, uuid, uuid, text, uuid, jsonb) TO service_role;

CREATE FUNCTION public.admin_mutate_civic_moment(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_operation text,
  p_object_id uuid,
  p_object_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_role text;
  v_input public.civic_moments%ROWTYPE;
  v_old public.civic_moments%ROWTYPE;
  v_result public.civic_moments%ROWTYPE;
  v_status text;
  v_is_published boolean;
  v_changed_fields text[];
  v_audit_metadata jsonb;
  v_audit_id uuid;
BEGIN
  v_role := public.civic_authorize_lifecycle_mutation(
    p_actor_admin_id, p_actor_auth_uid, p_expected_city_id, p_operation
  );
  PERFORM public.civic_validate_lifecycle_payload(
    p_operation, p_object_data, '{"title":"string","slug":"string","body":"string","moment_time":"string","thumbnail_360_url":"string","inline_360_urls":"string_array"}'::jsonb,
    ARRAY['title', 'moment_time']::text[]
  );
  IF p_operation = 'create_pending' AND p_object_id IS NOT NULL THEN
    RAISE EXCEPTION 'Object ID is not accepted for creation';
  ELSIF p_operation <> 'create_pending' AND p_object_id IS NULL THEN
    RAISE EXCEPTION 'Object ID is required';
  END IF;
  IF p_operation IN ('create_pending', 'edit_metadata') AND p_object_data ? 'slug'
     AND (pg_catalog.jsonb_typeof(p_object_data->'slug') IS DISTINCT FROM 'string'
          OR pg_catalog.btrim(p_object_data->>'slug') = '') THEN
    RAISE EXCEPTION 'Slug must be a nonblank string';
  END IF;

  IF p_operation IN ('create_pending', 'edit_metadata') THEN
    v_input := pg_catalog.jsonb_populate_record(NULL::public.civic_moments, p_object_data);
    SELECT pg_catalog.array_agg(key ORDER BY key) INTO v_changed_fields
    FROM pg_catalog.jsonb_object_keys(p_object_data) AS supplied(key);
  END IF;

  IF p_operation = 'create_pending' THEN
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, NULL, NULL);
    IF v_input.slug IS NULL THEN
      v_input.slug := pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.btrim(v_input.title)), '[^a-z0-9]+', '-', 'g'
      ), '-');
    END IF;
    IF v_input.slug = '' THEN
      RAISE EXCEPTION 'A nonblank slug is required';
    END IF;
    INSERT INTO public.civic_moments (
      city_id, title,
      slug,
      body,
      moment_time,
      thumbnail_360_url,
      inline_360_urls,
      status, is_published, updated_by, updated_at
    ) VALUES (
      p_expected_city_id, v_input.title,
      v_input.slug,
      v_input.body,
      v_input.moment_time,
      v_input.thumbnail_360_url,
      v_input.inline_360_urls,
      v_status, v_is_published, p_actor_auth_uid, pg_catalog.now()
    )
    RETURNING * INTO v_result;
    v_audit_metadata := pg_catalog.jsonb_build_object(
      'changed_fields', pg_catalog.to_jsonb(v_changed_fields),
      'lifecycle', pg_catalog.jsonb_build_object(
        'status', v_result.status, 'is_published', v_result.is_published
      )
    );
  ELSE
    SELECT * INTO v_old FROM public.civic_moments
    WHERE id = p_object_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Civic object not found';
    END IF;
    IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
      RAISE EXCEPTION 'Civic object city changed or is unavailable';
    END IF;
    SELECT next_status, next_is_published INTO v_status, v_is_published
    FROM public.civic_lifecycle_transition(p_operation, v_old.status, v_old.is_published);

    IF p_operation = 'edit_metadata' THEN
      UPDATE public.civic_moments
      SET title = CASE WHEN p_object_data ? 'title' THEN v_input.title ELSE title END,
        slug = CASE WHEN p_object_data ? 'slug' THEN v_input.slug ELSE slug END,
        body = CASE WHEN p_object_data ? 'body' THEN v_input.body ELSE body END,
        moment_time = CASE WHEN p_object_data ? 'moment_time' THEN v_input.moment_time ELSE moment_time END,
        thumbnail_360_url = CASE WHEN p_object_data ? 'thumbnail_360_url' THEN v_input.thumbnail_360_url ELSE thumbnail_360_url END,
        inline_360_urls = CASE WHEN p_object_data ? 'inline_360_urls' THEN v_input.inline_360_urls ELSE inline_360_urls END,
        updated_by = p_actor_auth_uid,
        updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'changed_fields', pg_catalog.to_jsonb(v_changed_fields)
      );
    ELSE
      UPDATE public.civic_moments
      SET status = v_status, is_published = v_is_published,
          updated_by = p_actor_auth_uid, updated_at = pg_catalog.now()
      WHERE id = p_object_id
      RETURNING * INTO v_result;
      v_audit_metadata := pg_catalog.jsonb_build_object(
        'lifecycle', pg_catalog.jsonb_build_object(
          'from_status', v_old.status, 'from_is_published', v_old.is_published,
          'to_status', v_result.status, 'to_is_published', v_result.is_published
        )
      );
    END IF;
  END IF;

  v_audit_id := public.civic_write_lifecycle_audit(
    p_actor_admin_id, p_actor_auth_uid, v_role, p_operation,
    'civic_moments', v_result.id, v_result.city_id, v_audit_metadata
  );
  RETURN pg_catalog.jsonb_build_object(
    'moment_id', v_result.id, 'city_id', v_result.city_id,
    'operation', p_operation, 'audit_id', v_audit_id,
    'status', v_result.status, 'is_published', v_result.is_published
  );
END;
$function$;

ALTER FUNCTION public.admin_mutate_civic_moment(uuid, uuid, uuid, text, uuid, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_mutate_civic_moment(uuid, uuid, uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_civic_moment(uuid, uuid, uuid, text, uuid, jsonb) TO service_role;

DO $check_permissions$
DECLARE
  v_function oid;
  v_owner oid := (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres');
BEGIN
  FOREACH v_function IN ARRAY ARRAY[
    'public.admin_mutate_civic_entity(uuid,uuid,uuid,text,uuid,jsonb)'::regprocedure::oid,
    'public.admin_mutate_civic_event(uuid,uuid,uuid,text,uuid,jsonb)'::regprocedure::oid,
    'public.admin_mutate_civic_artifact(uuid,uuid,uuid,text,uuid,jsonb)'::regprocedure::oid,
    'public.admin_mutate_civic_neighborhood(uuid,uuid,uuid,text,uuid,jsonb)'::regprocedure::oid,
    'public.admin_mutate_civic_era(uuid,uuid,uuid,text,uuid,jsonb)'::regprocedure::oid,
    'public.admin_mutate_civic_moment(uuid,uuid,uuid,text,uuid,jsonb)'::regprocedure::oid
  ] LOOP
    IF v_owner IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc AS p
      WHERE p.oid = v_function AND p.proowner = v_owner AND p.prosecdef IS TRUE
        AND p.proconfig @> ARRAY['search_path=pg_catalog']::text[]
    ) OR pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
      OR pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
      OR NOT pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE')
      OR EXISTS (
        SELECT 1 FROM pg_catalog.pg_proc AS p
        CROSS JOIN LATERAL pg_catalog.aclexplode(
          COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
        ) AS acl
        WHERE p.oid = v_function AND acl.privilege_type = 'EXECUTE'
          AND acl.grantee NOT IN (
            p.proowner, (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
          )
      ) THEN
      RAISE EXCEPTION 'Unexpected civic mutation function security or privileges: %', v_function::regprocedure;
    END IF;
  END LOOP;
END;
$check_permissions$;

COMMIT;
