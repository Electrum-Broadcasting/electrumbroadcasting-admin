BEGIN;

CREATE FUNCTION public.admin_moderate_story(
  p_story_id uuid,
  p_expected_city_id uuid,
  p_actor_admin_id uuid,
  p_actor_auth_uid uuid,
  p_operation text,
  p_reason text DEFAULT NULL,
  p_reference_log_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_story public.civic_stories%ROWTYPE;
  v_log_id uuid;
  v_action text;
  v_domain text;
  v_reason text := NULLIF(regexp_replace(p_reason, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
BEGIN
  IF p_story_id IS NULL OR p_expected_city_id IS NULL
     OR p_actor_admin_id IS NULL OR p_actor_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Missing required identifier';
  END IF;

  IF p_operation IS NULL OR p_operation NOT IN (
    'unpublish', 'emergency_unpublish', 'hide', 'place_hold',
    'lift_hold', 'escalate', 'resolve_escalation'
  ) THEN
    RAISE EXCEPTION 'Unsupported moderation operation';
  END IF;

  IF p_operation IN ('emergency_unpublish', 'place_hold', 'escalate', 'resolve_escalation')
     AND v_reason IS NULL THEN
    RAISE EXCEPTION 'A reason or hold note is required';
  END IF;
  IF p_operation = 'resolve_escalation' AND p_reference_log_id IS NULL THEN
    RAISE EXCEPTION 'An escalation reference is required';
  END IF;
  IF p_operation <> 'resolve_escalation' AND p_reference_log_id IS NOT NULL THEN
    RAISE EXCEPTION 'Unexpected escalation reference';
  END IF;

  SELECT * INTO v_admin
  FROM public.admin_users
  WHERE id = p_actor_admin_id
  FOR SHARE;

  IF NOT FOUND OR v_admin.auth_uid IS DISTINCT FROM p_actor_auth_uid::text
     OR v_admin.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Actor is not an active linked administrator';
  END IF;

  SELECT * INTO v_story
  FROM public.civic_stories
  WHERE id = p_story_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Story not found';
  END IF;
  IF v_story.city_id IS NULL OR v_story.city_id IS DISTINCT FROM p_expected_city_id THEN
    RAISE EXCEPTION 'Story city changed or is unavailable';
  END IF;

  IF v_admin.role = 'CITY_ADMIN' THEN
    IF NOT COALESCE(v_story.city_id = ANY(v_admin.city_ids), false) THEN
      RAISE EXCEPTION 'Story is outside the administrator city scope';
    END IF;
    IF p_operation NOT IN ('unpublish', 'hide', 'place_hold', 'lift_hold', 'escalate') THEN
      RAISE EXCEPTION 'Operation is not allowed for this role';
    END IF;
  ELSIF v_admin.role IN ('CEO', 'PLATFORM_ADMIN') THEN
    IF p_operation NOT IN ('emergency_unpublish', 'hide', 'place_hold', 'lift_hold', 'resolve_escalation') THEN
      RAISE EXCEPTION 'Operation is not allowed for this role';
    END IF;
  ELSE
    RAISE EXCEPTION 'Operation is not allowed for this role';
  END IF;

  IF p_operation = 'unpublish' THEN
    IF v_story.is_published IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Story is not currently published';
    END IF;
    UPDATE public.civic_stories
    SET is_published = false, review_status = 'approved'
    WHERE id = p_story_id;
  ELSIF p_operation IN ('emergency_unpublish', 'hide') THEN
    UPDATE public.civic_stories SET is_published = false WHERE id = p_story_id;
  ELSIF p_operation = 'place_hold' THEN
    UPDATE public.civic_stories
    SET safety_hold = true,
        safety_hold_notes = v_reason,
        is_published = CASE WHEN is_published IS TRUE THEN false ELSE is_published END
    WHERE id = p_story_id;
  ELSIF p_operation = 'lift_hold' THEN
    UPDATE public.civic_stories SET safety_hold = false WHERE id = p_story_id;
  ELSIF p_operation = 'resolve_escalation' THEN
    PERFORM 1 FROM public.admin_action_logs
    WHERE id = p_reference_log_id
      AND action = 'escalated_to_ceo'
      AND domain = 'safety'
      AND entity_type = 'story'
      AND entity_id = p_story_id
      AND metadata->>'city_id' = v_story.city_id::text
    FOR KEY SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Matching escalation not found';
    END IF;
  END IF;

  IF p_operation IN ('unpublish', 'emergency_unpublish', 'hide', 'place_hold', 'lift_hold')
     AND NOT FOUND THEN
    RAISE EXCEPTION 'Story update did not persist';
  END IF;

  v_action := CASE p_operation
    WHEN 'unpublish' THEN 'story_unpublished'
    WHEN 'emergency_unpublish' THEN 'story_emergency_unpublished'
    WHEN 'hide' THEN 'story_hidden'
    WHEN 'place_hold' THEN 'safety_hold_placed'
    WHEN 'lift_hold' THEN 'safety_hold_lifted'
    WHEN 'escalate' THEN 'escalated_to_ceo'
    WHEN 'resolve_escalation' THEN 'escalation_resolved'
  END;
  v_domain := CASE WHEN p_operation = 'unpublish' THEN 'editorial' ELSE 'safety' END;

  INSERT INTO public.admin_action_logs (
    actor_user_id, actor_admin_id, actor_role, action,
    domain, entity_type, entity_id, metadata
  ) VALUES (
    p_actor_auth_uid, v_admin.id, v_admin.role, v_action,
    v_domain, 'story', p_story_id,
    jsonb_build_object('city_id', v_story.city_id, 'reason', v_reason,
                       'reference_log_id', p_reference_log_id)
  ) RETURNING id INTO v_log_id;
  IF v_log_id IS NULL THEN
    RAISE EXCEPTION 'Audit entry was not persisted';
  END IF;

  SELECT * INTO STRICT v_story FROM public.civic_stories WHERE id = p_story_id;
  RETURN jsonb_build_object(
    'story_id', v_story.id, 'city_id', v_story.city_id,
    'operation', p_operation, 'audit_id', v_log_id,
    'is_published', v_story.is_published, 'review_status', v_story.review_status,
    'safety_hold', v_story.safety_hold, 'safety_hold_notes', v_story.safety_hold_notes
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_moderate_story(uuid, uuid, uuid, uuid, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_story(uuid, uuid, uuid, uuid, text, text, uuid)
  TO service_role;

DO $check_grants$
DECLARE
  v_function oid := 'public.admin_moderate_story(uuid,uuid,uuid,uuid,text,text,uuid)'::regprocedure;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) AS acl
    WHERE p.oid = v_function AND acl.privilege_type = 'EXECUTE'
      AND acl.grantee NOT IN (
        p.proowner, (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
      )
  ) OR pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
    OR pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected moderation function EXECUTE privileges';
  END IF;
END;
$check_grants$;

COMMIT;
