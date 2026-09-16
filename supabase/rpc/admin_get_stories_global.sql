CREATE OR REPLACE FUNCTION public.admin_get_stories()
 RETURNS TABLE(id uuid, city_id uuid, city text, title text, author_name text, category text, is_published boolean, is_frozen boolean, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    s.id,
    s.city_id,
    s.city,
    s.title,
    coalesce(s.author_name, c.display_name) as author_name,
    s.category,
    s.is_published,
    s.is_frozen,
    s.created_at
  from civic_stories s
  left join contributors c on c.id = s.contributor_id
  order by s.created_at desc;
$function$
