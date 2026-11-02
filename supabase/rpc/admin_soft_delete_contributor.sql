-- Soft delete a contributor. Never removes the row.
-- Requires contributors.deleted_at (timestamptz) and contributors.deleted_by (uuid).
-- Actor identity is passed explicitly by the trusted admin server, so execution is
-- restricted to service_role below.
CREATE OR REPLACE FUNCTION public.admin_soft_delete_contributor(
    p_contributor_id uuid,
    p_actor_user_id uuid,
    p_actor_admin_id uuid,
    p_actor_role text,
    p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_city_id uuid;
BEGIN
    IF p_actor_role NOT IN ('CEO', 'PLATFORM_ADMIN') THEN
        RAISE EXCEPTION 'Only the CEO or a platform admin may delete contributors';
    END IF;

    UPDATE public.contributors AS c
    SET deleted_at = now(),
        deleted_by = p_actor_user_id,
        is_active = false,
        updated_by = p_actor_user_id,
        updated_at = now()
    WHERE c.id = p_contributor_id
      AND c.deleted_at IS NULL
    RETURNING c.city_id INTO v_city_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contributor not found or already deleted';
    END IF;

    PERFORM public.log_admin_action(
        actor_user_id := p_actor_user_id,
        actor_admin_id := p_actor_admin_id,
        actor_role := p_actor_role,
        action := 'contributor_soft_deleted',
        domain := 'contributors',
        entity_type := 'contributor',
        entity_id := p_contributor_id,
        metadata := jsonb_build_object(
            'city_id', v_city_id,
            'reason', p_reason,
            'soft_delete', true
        )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_soft_delete_contributor(uuid, uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_contributor(uuid, uuid, uuid, text, text) TO service_role;
