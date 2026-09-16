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
        name = admin_update_city.name,
        slug = admin_update_city.slug,
        domain = COALESCE(admin_update_city.domain, ''),
        status = admin_update_city.status,
        incorporated_year = admin_update_city.incorporated_year,
        country = admin_update_city.country,
        state_province = admin_update_city.state_province,
        latitude = admin_update_city.latitude,
        longitude = admin_update_city.longitude,
        population = admin_update_city.population,
        updated_by = auth.uid(),
        updated_at = now()
    WHERE c.id = admin_update_city.city_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'City not found';
    END IF;

    INSERT INTO public.admin_override_logs (
        admin_id, action, target_type, target_id, city_id, metadata
    )
    VALUES (
        v_admin_id, 'update_city', 'city', city_id::text, city_id,
        COALESCE(metadata, jsonb_build_object('city_id', city_id))
    );
END;
$function$;