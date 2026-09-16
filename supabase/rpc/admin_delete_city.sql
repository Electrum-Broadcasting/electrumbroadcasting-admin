CREATE OR REPLACE FUNCTION public.admin_delete_city(
    city_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_admin_id uuid;
BEGIN
    SELECT au.id INTO v_admin_id FROM public.admin_users AS au
    WHERE au.user_id = auth.uid() AND au.status = 'active';
    IF v_admin_id IS NULL THEN RAISE EXCEPTION 'Active admin account not found for the current user'; END IF;

    DELETE FROM public.cities WHERE id = city_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'City not found'; END IF;

    INSERT INTO public.admin_override_logs (admin_id, action, target_type, target_id, city_id, metadata)
    VALUES (v_admin_id, 'delete_city', 'city', city_id::text, city_id, COALESCE(metadata, jsonb_build_object('city_id', city_id)));
END;
$function$;