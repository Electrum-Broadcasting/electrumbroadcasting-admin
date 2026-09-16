CREATE OR REPLACE FUNCTION public.admin_get_stories(city_uuid uuid)
 RETURNS SETOF civic_stories_admin
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select *
  from civic_stories_admin
  where city_id = city_uuid;
$function$
