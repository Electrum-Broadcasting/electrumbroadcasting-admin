BEGIN;

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
    IF v_key NOT IN ('label', 'description', 'pan_x_initial', 'pan_y_initial', 'capture_date', 'capture_attribution', 'metadata') THEN
      RAISE EXCEPTION 'Unsupported panorama field: %', v_key;
    ELSIF v_key IN ('pan_x_initial', 'pan_y_initial') THEN
      IF v_type <> 'number' THEN
        RAISE EXCEPTION 'Panorama field % must be a number', v_key;
      END IF;
      IF (p_data ->> v_key)::numeric NOT BETWEEN 0 AND 1 THEN
        RAISE EXCEPTION 'Panorama field % must be a number between 0 and 1', v_key;
      END IF;
    ELSIF v_key = 'label' THEN
      IF v_type <> 'string' OR btrim(p_data ->> v_key) = '' THEN
        RAISE EXCEPTION 'Panorama label must be nonblank';
      END IF;
    ELSIF v_key IN ('description', 'capture_date', 'capture_attribution') AND v_type NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Panorama field % must be a string or null', v_key;
    ELSIF v_key = 'metadata' AND v_type <> 'object' THEN
      RAISE EXCEPTION 'Panorama field metadata must be an object';
    END IF;
  END LOOP;

  SELECT * INTO v_old FROM public.panoramas WHERE id = p_panorama_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Panorama not found'; END IF;
  IF v_old.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Panorama is outside the expected city';
  END IF;
  UPDATE public.panoramas
  SET label = CASE WHEN p_data ? 'label' THEN p_data ->> 'label' ELSE label END,
      description = CASE WHEN p_data ? 'description' THEN p_data ->> 'description' ELSE description END,
      pan_x_initial = CASE WHEN p_data ? 'pan_x_initial' THEN (p_data ->> 'pan_x_initial')::numeric ELSE pan_x_initial END,
      pan_y_initial = CASE WHEN p_data ? 'pan_y_initial' THEN (p_data ->> 'pan_y_initial')::numeric ELSE pan_y_initial END,
      capture_date = CASE WHEN p_data ? 'capture_date' THEN (p_data ->> 'capture_date')::date ELSE capture_date END,
      capture_attribution = CASE WHEN p_data ? 'capture_attribution' THEN p_data ->> 'capture_attribution' ELSE capture_attribution END,
      metadata = CASE WHEN p_data ? 'metadata' THEN p_data -> 'metadata' ELSE metadata END,
      updated_by = p_actor_admin_id
  WHERE id = v_old.id
  RETURNING * INTO v_new;

  v_changes := public.media_changed_fields(
    to_jsonb(v_old), to_jsonb(v_new),
    ARRAY['label', 'description', 'pan_x_initial', 'pan_y_initial', 'capture_date', 'capture_attribution', 'metadata']
  );
  v_audit_id := public.media_audit(
    p_actor_admin_id, v_actor_role, p_actor_auth_uid, 'panorama_metadata_edited', 'navigation',
    'panoramas', v_new.id,
    jsonb_build_object('city_id', v_new.city_id, 'civic_object_type', v_new.civic_object_type,
      'civic_object_id', v_new.civic_object_id, 'changed_fields', v_changes)
  );
  RETURN jsonb_build_object('id', v_new.id, 'audit_id', v_audit_id);
END;
$function$;

-- Existing permissive bucket policies must not allow browser writes to panorama paths.
CREATE POLICY panorama_paths_insert_server_only ON storage.objects AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'universal-media' OR (storage.foldername(name))[3] IS DISTINCT FROM 'panoramas');
CREATE POLICY panorama_paths_update_server_only ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (bucket_id <> 'universal-media' OR (storage.foldername(name))[3] IS DISTINCT FROM 'panoramas')
  WITH CHECK (bucket_id <> 'universal-media' OR (storage.foldername(name))[3] IS DISTINCT FROM 'panoramas');
CREATE POLICY panorama_paths_delete_server_only ON storage.objects AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (bucket_id <> 'universal-media' OR (storage.foldername(name))[3] IS DISTINCT FROM 'panoramas');

COMMIT;
