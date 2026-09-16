CREATE OR REPLACE FUNCTION public.admin_create_city(
    name text,
    slug text,
    domain text,
    status text,
    incorporated_year integer,
    country text,
    state_province text,
    latitude double precision,
    longitude double precision,
    population integer,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_admin_id uuid;
    v_city_id uuid;
BEGIN
    SELECT au.id
    INTO v_admin_id
    FROM public.admin_users AS au
    WHERE au.user_id = auth.uid()
      AND au.status = 'active';

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Active admin account not found for the current user';
    END IF;

    INSERT INTO public.cities (
        name, slug, domain, status, incorporated_year, country,
        state_province, latitude, longitude, population, updated_by, updated_at
    )
    VALUES (
        name, slug, COALESCE(domain, ''), status, incorporated_year, country,
        state_province, latitude, longitude, population, auth.uid(), now()
    )
    RETURNING id INTO v_city_id;

    INSERT INTO public.admin_override_logs (
        admin_id, action, target_type, target_id, city_id, metadata
    )
    VALUES (
        v_admin_id, 'create_city', 'city', v_city_id::text, v_city_id,
        COALESCE(metadata, jsonb_build_object('city_id', v_city_id))
    );

    RETURN v_city_id;
END;
$function$;