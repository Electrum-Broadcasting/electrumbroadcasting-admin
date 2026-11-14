BEGIN;

-- Guarded media mutations. Every function is service-role only: the API route
-- authenticates the user and passes the verified actor IDs. Each function
-- authorizes the actor, enforces city scope, mutates, and writes
-- admin_action_logs in the same transaction.
--   media actions          -> domain 'civic'
--   panorama/hotspot       -> domain 'navigation'
--   city feature toggles   -> domain 'global'

-- ---------------------------------------------------------------------------
-- Shared internals
-- ---------------------------------------------------------------------------

-- Returns the actor's role after verifying identity, active status and city scope.
CREATE OR REPLACE FUNCTION public.media_authorize(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_city_id uuid,
  p_global_only boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_admin public.admin_users%ROWTYPE;
BEGIN
  IF p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL OR p_city_id IS NULL THEN
    RAISE EXCEPTION 'Missing required identity or city';
  END IF;

  SELECT * INTO v_admin
  FROM public.admin_users
  WHERE id = p_actor_admin_id
  FOR SHARE;

  IF NOT FOUND
     OR v_admin.user_id IS DISTINCT FROM p_actor_auth_uid
     OR v_admin.status IS DISTINCT FROM 'active'
     OR v_admin.role IS NULL
     OR v_admin.role NOT IN ('CEO', 'PLATFORM_ADMIN', 'CITY_ADMIN') THEN
    RAISE EXCEPTION 'Actor is not an active authorized administrator';
  END IF;

  IF p_global_only AND v_admin.role NOT IN ('CEO', 'PLATFORM_ADMIN') THEN
    RAISE EXCEPTION 'Role is not authorized for this operation';
  END IF;

  IF v_admin.role = 'CITY_ADMIN'
     AND NOT (p_city_id::text = ANY (COALESCE(v_admin.city_ids::text[], ARRAY[]::text[]))) THEN
    RAISE EXCEPTION 'Target is outside the administrator city scope';
  END IF;

  PERFORM 1 FROM public.cities WHERE id = p_city_id FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'City not found';
  END IF;

  RETURN v_admin.role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.media_audit(
  p_actor_admin_id uuid,
  p_actor_role text,
  p_actor_auth_uid uuid,
  p_action text,
  p_domain text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action,
    domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, p_actor_admin_id, p_actor_role, p_action,
    p_domain, p_entity_type, p_entity_id, p_metadata
  )
  RETURNING id INTO v_audit_id;
  RETURN v_audit_id;
END;
$function$;

-- Field-level diff of two row snapshots, restricted to the listed keys.
CREATE OR REPLACE FUNCTION public.media_changed_fields(p_old jsonb, p_new jsonb, p_keys text[])
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
  SELECT COALESCE(jsonb_object_agg(k, jsonb_build_object('old', p_old -> k, 'new', p_new -> k)), '{}'::jsonb)
  FROM unnest(p_keys) AS k
  WHERE (p_old -> k) IS DISTINCT FROM (p_new -> k)
$function$;

CREATE OR REPLACE FUNCTION public.hotspot_validate_payload(p_data jsonb, p_require_core boolean)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $function$
DECLARE
  v_key text;
  v_type text;
BEGIN
  IF p_data IS NULL OR jsonb_typeof(p_data) <> 'object' THEN
    RAISE EXCEPTION 'Hotspot data must be an object';
  END IF;

  FOR v_key, v_type IN
    SELECT s.key, jsonb_typeof(s.value) FROM jsonb_each(p_data) AS s(key, value)
  LOOP
    IF v_key NOT IN (
      'pan_x', 'pan_y', 'label', 'icon', 'target_type', 'target_id',
      'target_url', 'display_order', 'metadata', 'behavior'
    ) THEN
      RAISE EXCEPTION 'Unsupported hotspot field: %', v_key;
    END IF;
    IF v_key IN ('pan_x', 'pan_y', 'display_order') AND v_type <> 'number' THEN
      RAISE EXCEPTION 'Hotspot field % must be a number', v_key;
    END IF;
    IF v_key IN ('label', 'icon', 'target_type') AND v_type <> 'string' THEN
      RAISE EXCEPTION 'Hotspot field % must be a string', v_key;
    END IF;
    IF v_key IN ('target_id', 'target_url') AND v_type NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Hotspot field % must be a string or null', v_key;
    END IF;
    IF v_key IN ('metadata', 'behavior') AND v_type <> 'object' THEN
      RAISE EXCEPTION 'Hotspot field % must be an object', v_key;
    END IF;
  END LOOP;

  IF p_require_core AND NOT (
    p_data ? 'pan_x' AND p_data ? 'pan_y' AND p_data ? 'label' AND p_data ? 'target_type'
  ) THEN
    RAISE EXCEPTION 'pan_x, pan_y, label and target_type are required';
  END IF;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Media attachments
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_attach_civic_media(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_object_type text,
  p_object_id uuid,
  p_media_asset_id uuid,
  p_role text,
  p_display_order integer DEFAULT NULL,
  p_alt_text text DEFAULT NULL,
  p_caption text DEFAULT NULL,
  p_is_decorative boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_object_city uuid;
  v_att public.civic_media_attachments%ROWTYPE;
  v_old_asset uuid;
  v_action text;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  IF p_role IS NULL OR p_role NOT IN ('hero', 'thumbnail', 'gallery', 'evidence') THEN
    RAISE EXCEPTION 'Unsupported media role';
  END IF;

  v_object_city := public.civic_object_city_id(p_object_type, p_object_id);
  IF v_object_city IS NULL THEN
    RAISE EXCEPTION 'Civic object not found';
  END IF;
  IF v_object_city IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Civic object is outside the expected city';
  END IF;

  PERFORM 1 FROM public.media_assets WHERE id = p_media_asset_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Media asset not found';
  END IF;

  IF p_role IN ('hero', 'thumbnail') THEN
    SELECT * INTO v_att
    FROM public.civic_media_attachments
    WHERE city_id = p_expected_city_id
      AND civic_object_type = p_object_type
      AND civic_object_id = p_object_id
      AND role = p_role
    FOR UPDATE;

    IF FOUND THEN
      IF v_att.media_asset_id = p_media_asset_id THEN
        RAISE EXCEPTION 'Asset is already the % for this object', p_role;
      END IF;
      v_old_asset := v_att.media_asset_id;

      UPDATE public.civic_media_attachments
      SET media_asset_id = p_media_asset_id,
          alt_text = p_alt_text,
          caption = p_caption,
          is_decorative = COALESCE(p_is_decorative, false)
      WHERE id = v_att.id
      RETURNING * INTO v_att;
      v_action := 'media_primary_changed';
    ELSE
      INSERT INTO public.civic_media_attachments (
        city_id, civic_object_id, civic_object_type, media_asset_id, role,
        is_primary, display_order, alt_text, caption, is_decorative, created_by
      ) VALUES (
        p_expected_city_id, p_object_id, p_object_type, p_media_asset_id, p_role,
        true, 0, p_alt_text, p_caption, COALESCE(p_is_decorative, false), p_actor_admin_id
      )
      RETURNING * INTO v_att;
      v_action := 'media_attached';
    END IF;
  ELSE
    INSERT INTO public.civic_media_attachments (
      city_id, civic_object_id, civic_object_type, media_asset_id, role,
      is_primary, display_order, alt_text, caption, is_decorative, created_by
    ) VALUES (
      p_expected_city_id, p_object_id, p_object_type, p_media_asset_id, p_role,
      false,
      COALESCE(p_display_order, (
        SELECT COALESCE(max(a.display_order) + 1, 0)
        FROM public.civic_media_attachments AS a
        WHERE a.city_id = p_expected_city_id
          AND a.civic_object_type = p_object_type
          AND a.civic_object_id = p_object_id
          AND a.role = p_role
      )),
      p_alt_text, p_caption, COALESCE(p_is_decorative, false), p_actor_admin_id
    )
    RETURNING * INTO v_att;
    v_action := 'media_attached';
  END IF;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, v_action, 'civic',
    'civic_media_attachments', v_att.id,
    jsonb_build_object(
      'city_id', p_expected_city_id,
      'civic_object_type', p_object_type,
      'civic_object_id', p_object_id,
      'media_asset_id', p_media_asset_id,
      'role', p_role,
      'previous_media_asset_id', v_old_asset
    )
  );

  RETURN jsonb_build_object('id', v_att.id, 'action', v_action, 'audit_id', v_audit_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_detach_civic_media(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_attachment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_att public.civic_media_attachments%ROWTYPE;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  SELECT * INTO v_att
  FROM public.civic_media_attachments
  WHERE id = p_attachment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attachment not found';
  END IF;
  IF v_att.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Attachment is outside the expected city';
  END IF;

  DELETE FROM public.civic_media_attachments WHERE id = v_att.id;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'media_detached', 'civic',
    'civic_media_attachments', v_att.id,
    jsonb_build_object(
      'city_id', v_att.city_id,
      'civic_object_type', v_att.civic_object_type,
      'civic_object_id', v_att.civic_object_id,
      'media_asset_id', v_att.media_asset_id,
      'role', v_att.role
    )
  );

  RETURN jsonb_build_object('id', v_att.id, 'audit_id', v_audit_id);
END;
$function$;

-- p_attachment_ids must list every attachment of the role for the object, in the new order.
CREATE OR REPLACE FUNCTION public.admin_reorder_civic_media(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_object_type text,
  p_object_id uuid,
  p_role text,
  p_attachment_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_count integer;
  v_changed integer := 0;
  v_row record;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  IF p_role IS NULL OR p_role NOT IN ('gallery', 'evidence') THEN
    RAISE EXCEPTION 'Only gallery and evidence media can be reordered';
  END IF;
  IF p_attachment_ids IS NULL OR cardinality(p_attachment_ids) = 0 THEN
    RAISE EXCEPTION 'Attachment list is required';
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(p_attachment_ids) AS x) <> cardinality(p_attachment_ids) THEN
    RAISE EXCEPTION 'Attachment list contains duplicates';
  END IF;

  PERFORM 1
  FROM public.civic_media_attachments
  WHERE city_id = p_expected_city_id
    AND civic_object_type = p_object_type
    AND civic_object_id = p_object_id
    AND role = p_role
  ORDER BY id
  FOR UPDATE;

  SELECT count(*) INTO v_count
  FROM public.civic_media_attachments
  WHERE city_id = p_expected_city_id
    AND civic_object_type = p_object_type
    AND civic_object_id = p_object_id
    AND role = p_role;

  IF v_count <> cardinality(p_attachment_ids)
     OR (SELECT count(*) FROM public.civic_media_attachments
         WHERE id = ANY (p_attachment_ids)
           AND city_id = p_expected_city_id
           AND civic_object_type = p_object_type
           AND civic_object_id = p_object_id
           AND role = p_role) <> v_count THEN
    RAISE EXCEPTION 'Attachment list must contain exactly the object''s % attachments', p_role;
  END IF;

  FOR v_row IN
    SELECT a.id, a.display_order AS old_order, (o.ord - 1)::integer AS new_order
    FROM unnest(p_attachment_ids) WITH ORDINALITY AS o(id, ord)
    JOIN public.civic_media_attachments AS a ON a.id = o.id
    WHERE a.display_order IS DISTINCT FROM (o.ord - 1)::integer
  LOOP
    UPDATE public.civic_media_attachments
    SET display_order = v_row.new_order
    WHERE id = v_row.id;

    PERFORM public.media_audit(
      p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'media_reordered', 'civic',
      'civic_media_attachments', v_row.id,
      jsonb_build_object(
        'city_id', p_expected_city_id,
        'civic_object_type', p_object_type,
        'civic_object_id', p_object_id,
        'role', p_role,
        'old_order', v_row.old_order,
        'new_order', v_row.new_order
      )
    );
    v_changed := v_changed + 1;
  END LOOP;

  RETURN jsonb_build_object('changed', v_changed);
END;
$function$;

-- ---------------------------------------------------------------------------
-- Panoramas
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_create_panorama(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_object_type text,
  p_object_id uuid,
  p_equirectangular_url text,
  p_label text,
  p_thumbnail_url text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_display_order integer DEFAULT NULL,
  p_pan_x_initial numeric DEFAULT NULL,
  p_pan_y_initial numeric DEFAULT NULL,
  p_capture_date date DEFAULT NULL,
  p_capture_attribution text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_object_city uuid;
  v_pano public.panoramas%ROWTYPE;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  IF p_equirectangular_url IS NULL
     OR p_equirectangular_url !~* '^https://[^[:space:]]+$'
     OR position('/universal-media/' IN p_equirectangular_url) = 0 THEN
    RAISE EXCEPTION 'Panorama image must be an https URL in the universal-media bucket';
  END IF;

  v_object_city := public.civic_object_city_id(p_object_type, p_object_id);
  IF v_object_city IS NULL THEN
    RAISE EXCEPTION 'Civic object not found';
  END IF;
  IF v_object_city IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Civic object is outside the expected city';
  END IF;

  INSERT INTO public.panoramas (
    city_id, civic_object_id, civic_object_type, equirectangular_url, thumbnail_url,
    label, description, display_order, pan_x_initial, pan_y_initial,
    capture_date, capture_attribution, status, created_by, updated_by
  ) VALUES (
    p_expected_city_id, p_object_id, p_object_type, p_equirectangular_url, p_thumbnail_url,
    p_label, p_description,
    COALESCE(p_display_order, (
      SELECT COALESCE(max(p.display_order) + 1, 0)
      FROM public.panoramas AS p
      WHERE p.civic_object_type = p_object_type
        AND p.civic_object_id = p_object_id
        AND p.status <> 'archived'
    )),
    COALESCE(p_pan_x_initial, 0.5), COALESCE(p_pan_y_initial, 0.5),
    p_capture_date, p_capture_attribution, 'draft', p_actor_admin_id, p_actor_admin_id
  )
  RETURNING * INTO v_pano;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'panorama_created', 'navigation',
    'panoramas', v_pano.id,
    jsonb_build_object(
      'city_id', v_pano.city_id,
      'civic_object_type', v_pano.civic_object_type,
      'civic_object_id', v_pano.civic_object_id,
      'label', v_pano.label,
      'equirectangular_url', v_pano.equirectangular_url
    )
  );

  RETURN jsonb_build_object('id', v_pano.id, 'status', v_pano.status, 'audit_id', v_audit_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_update_panorama_metadata(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_panorama_id uuid,
  p_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_old public.panoramas%ROWTYPE;
  v_new public.panoramas%ROWTYPE;
  v_key text;
  v_type text;
  v_changes jsonb;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);
  IF p_data IS NULL OR jsonb_typeof(p_data) <> 'object' OR p_data = '{}'::jsonb THEN
    RAISE EXCEPTION 'Panorama metadata update must be a non-empty object';
  END IF;

  FOR v_key, v_type IN SELECT key, jsonb_typeof(value) FROM jsonb_each(p_data) LOOP
    IF v_key NOT IN ('pan_x_initial', 'pan_y_initial', 'capture_date', 'capture_attribution', 'metadata') THEN
      RAISE EXCEPTION 'Unsupported panorama field: %', v_key;
    ELSIF v_key IN ('pan_x_initial', 'pan_y_initial') THEN
      IF v_type <> 'number' THEN
        RAISE EXCEPTION 'Panorama field % must be a number', v_key;
      END IF;
      IF (p_data ->> v_key)::numeric NOT BETWEEN 0 AND 1 THEN
        RAISE EXCEPTION 'Panorama field % must be between 0 and 1', v_key;
      END IF;
    ELSIF v_key IN ('capture_date', 'capture_attribution') AND v_type NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Panorama field % must be a string or null', v_key;
    ELSIF v_key = 'metadata' AND v_type <> 'object' THEN
      RAISE EXCEPTION 'Panorama field metadata must be an object';
    END IF;
  END LOOP;

  SELECT * INTO v_old FROM public.panoramas WHERE id = p_panorama_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Panorama not found';
  END IF;
  IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Panorama is outside the expected city';
  END IF;

  UPDATE public.panoramas
  SET pan_x_initial = CASE WHEN p_data ? 'pan_x_initial' THEN (p_data ->> 'pan_x_initial')::numeric ELSE pan_x_initial END,
      pan_y_initial = CASE WHEN p_data ? 'pan_y_initial' THEN (p_data ->> 'pan_y_initial')::numeric ELSE pan_y_initial END,
      capture_date = CASE WHEN p_data ? 'capture_date' THEN (p_data ->> 'capture_date')::date ELSE capture_date END,
      capture_attribution = CASE WHEN p_data ? 'capture_attribution' THEN p_data ->> 'capture_attribution' ELSE capture_attribution END,
      metadata = CASE WHEN p_data ? 'metadata' THEN p_data -> 'metadata' ELSE metadata END,
      updated_by = p_actor_admin_id
  WHERE id = v_old.id
  RETURNING * INTO v_new;

  v_changes := public.media_changed_fields(
    to_jsonb(v_old), to_jsonb(v_new),
    ARRAY['pan_x_initial', 'pan_y_initial', 'capture_date', 'capture_attribution', 'metadata']
  );
  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'panorama_metadata_edited', 'navigation',
    'panoramas', v_new.id,
    jsonb_build_object(
      'city_id', v_new.city_id,
      'civic_object_type', v_new.civic_object_type,
      'civic_object_id', v_new.civic_object_id,
      'changed_fields', v_changes
    )
  );
  RETURN jsonb_build_object('id', v_new.id, 'audit_id', v_audit_id);
END;
$function$;

-- Lifecycle transitions are validated by the panoramas lifecycle trigger.
CREATE OR REPLACE FUNCTION public.admin_set_panorama_status(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_panorama_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_pano public.panoramas%ROWTYPE;
  v_old_status text;
  v_action text;
  v_hotspot_ids uuid[] := ARRAY[]::uuid[];
  v_hotspot_id uuid;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  IF p_status IS NULL OR p_status NOT IN ('draft', 'published', 'archived') THEN
    RAISE EXCEPTION 'Unsupported panorama status';
  END IF;

  SELECT * INTO v_pano FROM public.panoramas WHERE id = p_panorama_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Panorama not found';
  END IF;
  IF v_pano.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Panorama is outside the expected city';
  END IF;
  IF v_pano.status = p_status THEN
    RAISE EXCEPTION 'Panorama is already %', p_status;
  END IF;

  v_old_status := v_pano.status;
  v_action := CASE p_status
    WHEN 'published' THEN 'panorama_published'
    WHEN 'archived'  THEN 'panorama_archived'
    ELSE 'panorama_unpublished'
  END;

  IF p_status = 'archived' THEN
    SELECT COALESCE(array_agg(h.id ORDER BY h.id), ARRAY[]::uuid[]) INTO v_hotspot_ids
    FROM public.hotspots AS h
    WHERE h.panorama_id = v_pano.id AND h.is_active;
  END IF;

  UPDATE public.panoramas
  SET status = p_status,
      published_by = CASE WHEN p_status = 'published' THEN p_actor_admin_id ELSE published_by END,
      archived_by  = CASE WHEN p_status = 'archived'  THEN p_actor_admin_id ELSE archived_by END,
      updated_by   = p_actor_admin_id
  WHERE id = v_pano.id
  RETURNING * INTO v_pano;

  -- The archive trigger deactivates child hotspots; record each one.
  FOREACH v_hotspot_id IN ARRAY v_hotspot_ids LOOP
    PERFORM public.media_audit(
      p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'hotspot_deactivated', 'navigation',
      'hotspots', v_hotspot_id,
      jsonb_build_object(
        'city_id', v_pano.city_id,
        'panorama_id', v_pano.id,
        'reason', 'panorama_archived'
      )
    );
  END LOOP;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, v_action, 'navigation',
    'panoramas', v_pano.id,
    jsonb_build_object(
      'city_id', v_pano.city_id,
      'civic_object_type', v_pano.civic_object_type,
      'civic_object_id', v_pano.civic_object_id,
      'display_order', v_pano.display_order,
      'old_status', v_old_status,
      'new_status', v_pano.status,
      'hotspots_deactivated_count', cardinality(v_hotspot_ids)
    )
  );

  RETURN jsonb_build_object('id', v_pano.id, 'status', v_pano.status, 'audit_id', v_audit_id);
END;
$function$;

-- p_panorama_ids must list every non-archived panorama of the object, in the new order.
-- The lowest published display_order is the primary panorama.
CREATE OR REPLACE FUNCTION public.admin_reorder_panoramas(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_object_type text,
  p_object_id uuid,
  p_panorama_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_count integer;
  v_changed integer := 0;
  v_row record;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  IF p_panorama_ids IS NULL OR cardinality(p_panorama_ids) = 0 THEN
    RAISE EXCEPTION 'Panorama list is required';
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(p_panorama_ids) AS x) <> cardinality(p_panorama_ids) THEN
    RAISE EXCEPTION 'Panorama list contains duplicates';
  END IF;

  PERFORM 1
  FROM public.panoramas
  WHERE city_id = p_expected_city_id
    AND civic_object_type = p_object_type
    AND civic_object_id = p_object_id
    AND status <> 'archived'
  ORDER BY id
  FOR UPDATE;

  SELECT count(*) INTO v_count
  FROM public.panoramas
  WHERE city_id = p_expected_city_id
    AND civic_object_type = p_object_type
    AND civic_object_id = p_object_id
    AND status <> 'archived';

  IF v_count <> cardinality(p_panorama_ids)
     OR (SELECT count(*) FROM public.panoramas
         WHERE id = ANY (p_panorama_ids)
           AND city_id = p_expected_city_id
           AND civic_object_type = p_object_type
           AND civic_object_id = p_object_id
           AND status <> 'archived') <> v_count THEN
    RAISE EXCEPTION 'Panorama list must contain exactly the object''s non-archived panoramas';
  END IF;

  FOR v_row IN
    SELECT p.id, p.display_order AS old_order, (o.ord - 1)::integer AS new_order
    FROM unnest(p_panorama_ids) WITH ORDINALITY AS o(id, ord)
    JOIN public.panoramas AS p ON p.id = o.id
    WHERE p.display_order IS DISTINCT FROM (o.ord - 1)::integer
  LOOP
    UPDATE public.panoramas
    SET display_order = v_row.new_order,
        updated_by = p_actor_admin_id
    WHERE id = v_row.id;

    PERFORM public.media_audit(
      p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'panorama_reordered', 'navigation',
      'panoramas', v_row.id,
      jsonb_build_object(
        'city_id', p_expected_city_id,
        'civic_object_type', p_object_type,
        'civic_object_id', p_object_id,
        'old_order', v_row.old_order,
        'new_order', v_row.new_order
      )
    );
    v_changed := v_changed + 1;
  END LOOP;

  RETURN jsonb_build_object('changed', v_changed);
END;
$function$;

-- ---------------------------------------------------------------------------
-- Hotspots
-- ---------------------------------------------------------------------------

-- Hotspots are always placed inactive; activation is a separate action.
CREATE OR REPLACE FUNCTION public.admin_place_hotspot(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_panorama_id uuid,
  p_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_pano public.panoramas%ROWTYPE;
  v_hotspot public.hotspots%ROWTYPE;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);
  PERFORM public.hotspot_validate_payload(p_data, true);

  SELECT * INTO v_pano FROM public.panoramas WHERE id = p_panorama_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Panorama not found';
  END IF;
  IF v_pano.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Panorama is outside the expected city';
  END IF;
  IF v_pano.status = 'archived' THEN
    RAISE EXCEPTION 'Cannot place a hotspot on an archived panorama';
  END IF;

  INSERT INTO public.hotspots (
    panorama_id, city_id, pan_x, pan_y, label, icon, target_type, target_id,
    target_url, display_order, metadata, behavior, is_active, created_by, updated_by
  ) VALUES (
    v_pano.id, v_pano.city_id,
    (p_data ->> 'pan_x')::numeric, (p_data ->> 'pan_y')::numeric,
    p_data ->> 'label', COALESCE(p_data ->> 'icon', 'default'),
    p_data ->> 'target_type', NULLIF(p_data ->> 'target_id', '')::uuid,
    NULLIF(p_data ->> 'target_url', ''),
    COALESCE((p_data ->> 'display_order')::integer, 0),
    COALESCE(p_data -> 'metadata', '{}'::jsonb),
    COALESCE(p_data -> 'behavior', '{}'::jsonb),
    false, p_actor_admin_id, p_actor_admin_id
  )
  RETURNING * INTO v_hotspot;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'hotspot_placed', 'navigation',
    'hotspots', v_hotspot.id,
    jsonb_build_object(
      'city_id', v_hotspot.city_id,
      'panorama_id', v_hotspot.panorama_id,
      'target_type', v_hotspot.target_type,
      'target_id', v_hotspot.target_id,
      'pan_x', v_hotspot.pan_x,
      'pan_y', v_hotspot.pan_y,
      'label', v_hotspot.label
    )
  );

  RETURN jsonb_build_object('id', v_hotspot.id, 'is_active', v_hotspot.is_active, 'audit_id', v_audit_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_hotspot(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_hotspot_id uuid,
  p_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_old public.hotspots%ROWTYPE;
  v_new public.hotspots%ROWTYPE;
  v_changes jsonb;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);
  PERFORM public.hotspot_validate_payload(p_data, false);
  IF p_data = '{}'::jsonb THEN
    RAISE EXCEPTION 'Hotspot update must include at least one field';
  END IF;

  SELECT * INTO v_old FROM public.hotspots WHERE id = p_hotspot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hotspot not found';
  END IF;
  IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Hotspot is outside the expected city';
  END IF;

  UPDATE public.hotspots
  SET pan_x = CASE WHEN p_data ? 'pan_x' THEN (p_data ->> 'pan_x')::numeric ELSE pan_x END,
      pan_y = CASE WHEN p_data ? 'pan_y' THEN (p_data ->> 'pan_y')::numeric ELSE pan_y END,
      label = CASE WHEN p_data ? 'label' THEN p_data ->> 'label' ELSE label END,
      icon = CASE WHEN p_data ? 'icon' THEN p_data ->> 'icon' ELSE icon END,
      target_type = CASE WHEN p_data ? 'target_type' THEN p_data ->> 'target_type' ELSE target_type END,
      target_id = CASE WHEN p_data ? 'target_id' THEN NULLIF(p_data ->> 'target_id', '')::uuid ELSE target_id END,
      target_url = CASE WHEN p_data ? 'target_url' THEN NULLIF(p_data ->> 'target_url', '') ELSE target_url END,
      display_order = CASE WHEN p_data ? 'display_order' THEN (p_data ->> 'display_order')::integer ELSE display_order END,
      metadata = CASE WHEN p_data ? 'metadata' THEN p_data -> 'metadata' ELSE metadata END,
      behavior = CASE WHEN p_data ? 'behavior' THEN p_data -> 'behavior' ELSE behavior END,
      updated_by = p_actor_admin_id
  WHERE id = v_old.id
  RETURNING * INTO v_new;

  v_changes := public.media_changed_fields(
    to_jsonb(v_old), to_jsonb(v_new),
    ARRAY['pan_x', 'pan_y', 'label', 'icon', 'target_type', 'target_id',
          'target_url', 'display_order', 'metadata', 'behavior']
  );

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'hotspot_updated', 'navigation',
    'hotspots', v_new.id,
    jsonb_build_object(
      'city_id', v_new.city_id,
      'panorama_id', v_new.panorama_id,
      'changed_fields', v_changes
    )
  );

  RETURN jsonb_build_object('id', v_new.id, 'audit_id', v_audit_id);
END;
$function$;

-- Activation rules (published target, same city, live parent) are enforced by
-- the hotspots integrity trigger.
CREATE OR REPLACE FUNCTION public.admin_set_hotspot_active(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_hotspot_id uuid,
  p_active boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_hotspot public.hotspots%ROWTYPE;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  IF p_active IS NULL THEN
    RAISE EXCEPTION 'Active flag is required';
  END IF;

  SELECT * INTO v_hotspot FROM public.hotspots WHERE id = p_hotspot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hotspot not found';
  END IF;
  IF v_hotspot.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Hotspot is outside the expected city';
  END IF;
  IF v_hotspot.is_active = p_active THEN
    RAISE EXCEPTION 'Hotspot is already %', CASE WHEN p_active THEN 'active' ELSE 'inactive' END;
  END IF;

  UPDATE public.hotspots
  SET is_active = p_active,
      updated_by = p_actor_admin_id
  WHERE id = v_hotspot.id
  RETURNING * INTO v_hotspot;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid,
    CASE WHEN p_active THEN 'hotspot_activated' ELSE 'hotspot_deactivated' END,
    'navigation', 'hotspots', v_hotspot.id,
    jsonb_build_object('city_id', v_hotspot.city_id, 'panorama_id', v_hotspot.panorama_id)
  );

  RETURN jsonb_build_object('id', v_hotspot.id, 'is_active', v_hotspot.is_active, 'audit_id', v_audit_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_hotspot(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_expected_city_id uuid,
  p_hotspot_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_hotspot public.hotspots%ROWTYPE;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_expected_city_id);

  SELECT * INTO v_hotspot FROM public.hotspots WHERE id = p_hotspot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hotspot not found';
  END IF;
  IF v_hotspot.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Hotspot is outside the expected city';
  END IF;

  DELETE FROM public.hotspots WHERE id = v_hotspot.id;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'hotspot_deleted', 'navigation',
    'hotspots', v_hotspot.id,
    jsonb_build_object(
      'city_id', v_hotspot.city_id,
      'panorama_id', v_hotspot.panorama_id,
      'target_type', v_hotspot.target_type,
      'target_id', v_hotspot.target_id,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object('id', v_hotspot.id, 'audit_id', v_audit_id);
END;
$function$;

-- ---------------------------------------------------------------------------
-- City feature toggles (CEO and PLATFORM_ADMIN only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_set_city_feature_toggle(
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_city_id uuid,
  p_feature_name text,
  p_enabled boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_actor_role text;
  v_old boolean;
  v_toggle public.city_feature_toggles%ROWTYPE;
  v_audit_id uuid;
BEGIN
  v_actor_role := public.media_authorize(p_actor_admin_id, p_actor_auth_uid, p_city_id, true);

  IF p_feature_name IS NULL OR btrim(p_feature_name) = '' THEN
    RAISE EXCEPTION 'Feature name is required';
  END IF;
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'Enabled flag is required';
  END IF;

  SELECT enabled INTO v_old
  FROM public.city_feature_toggles
  WHERE city_id = p_city_id AND feature_name = p_feature_name
  FOR UPDATE;

  INSERT INTO public.city_feature_toggles (city_id, feature_name, enabled, updated_by)
  VALUES (p_city_id, p_feature_name, p_enabled, p_actor_auth_uid)
  ON CONFLICT (city_id, feature_name)
  DO UPDATE SET enabled = EXCLUDED.enabled,
                updated_by = EXCLUDED.updated_by,
                updated_at = pg_catalog.now()
  RETURNING * INTO v_toggle;

  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'city_feature_toggle_updated', 'global',
    'city_feature_toggles', v_toggle.id,
    jsonb_build_object(
      'city_id', p_city_id,
      'feature_name', p_feature_name,
      'old_enabled', COALESCE(v_old, false),
      'new_enabled', p_enabled
    )
  );

  RETURN jsonb_build_object('id', v_toggle.id, 'enabled', v_toggle.enabled, 'audit_id', v_audit_id);
END;
$function$;

-- ---------------------------------------------------------------------------
-- Execution rights: service role only.
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.media_authorize(uuid, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.media_audit(uuid, text, uuid, text, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.media_changed_fields(jsonb, jsonb, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hotspot_validate_payload(jsonb, boolean) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_attach_civic_media(uuid, uuid, uuid, text, uuid, uuid, text, integer, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_detach_civic_media(uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_reorder_civic_media(uuid, uuid, uuid, text, uuid, text, uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_create_panorama(uuid, uuid, uuid, text, uuid, text, text, text, text, integer, numeric, numeric, date, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_update_panorama_metadata(uuid, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_panorama_status(uuid, uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_reorder_panoramas(uuid, uuid, uuid, text, uuid, uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_place_hotspot(uuid, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_update_hotspot(uuid, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_hotspot_active(uuid, uuid, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_hotspot(uuid, uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_city_feature_toggle(uuid, uuid, uuid, text, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_attach_civic_media(uuid, uuid, uuid, text, uuid, uuid, text, integer, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_detach_civic_media(uuid, uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_reorder_civic_media(uuid, uuid, uuid, text, uuid, text, uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_panorama(uuid, uuid, uuid, text, uuid, text, text, text, text, integer, numeric, numeric, date, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_panorama_metadata(uuid, uuid, uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_panorama_status(uuid, uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_reorder_panoramas(uuid, uuid, uuid, text, uuid, uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_place_hotspot(uuid, uuid, uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_hotspot(uuid, uuid, uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_hotspot_active(uuid, uuid, uuid, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_hotspot(uuid, uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_city_feature_toggle(uuid, uuid, uuid, text, boolean) TO service_role;

COMMIT;
