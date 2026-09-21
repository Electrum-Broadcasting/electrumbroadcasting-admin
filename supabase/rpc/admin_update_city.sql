CREATE OR REPLACE FUNCTION public.admin_update_city(
    city_id uuid,
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
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_admin_id uuid;
    -- Local copies avoid ambiguity between parameter names and column names below.
    v_city_id uuid := city_id;
    v_name text := name;
    v_slug text := slug;
    v_domain text := domain;
    v_status text := status;
    v_incorporated_year integer := incorporated_year;
    v_country text := country;
    v_state_province text := state_province;
    v_latitude double precision := latitude;
    v_longitude double precision := longitude;
    v_population integer := population;
    v_metadata jsonb := metadata;
BEGIN
    SELECT au.id
    INTO v_admin_id
    FROM public.admin_users AS au
    WHERE au.user_id = auth.uid()
      AND au.status = 'active';

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Active admin account not found for the current user';
    END IF;

    UPDATE public.cities AS c
    SET
        name = v_name,
        slug = v_slug,
        domain = COALESCE(v_domain, ''),
        status = v_status,
        incorporated_year = v_incorporated_year,
        country = v_country,
        state_province = v_state_province,
        latitude = v_latitude,
        longitude = v_longitude,
        population = v_population,
        updated_by = auth.uid(),
        updated_at = now()
    WHERE c.id = v_city_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'City not found';
    END IF;

    INSERT INTO public.admin_override_logs (
        admin_id, action, target_type, target_id, city_id, metadata
    )
    VALUES (
        v_admin_id, 'update_city', 'city', v_city_id::text, v_city_id,
        COALESCE(v_metadata, jsonb_build_object('city_id', v_city_id))
    );
END;
$function$;