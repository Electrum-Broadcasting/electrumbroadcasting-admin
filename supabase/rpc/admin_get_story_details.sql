CREATE OR REPLACE FUNCTION public.admin_get_story_details(story_id uuid)
RETURNS TABLE (
    id uuid,
    city_id uuid,
    city text,
    title text,
    body text,
    summary text,
    author_name text,
    category text,
    tags text[],
    year integer,
    date_range text,
    neighborhood text,
    image_description text,
    related_place_ids uuid[],
    related_entity_ids uuid[],
    related_moment_ids uuid[],
    is_published boolean,
    is_frozen boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT
        s.id,
        s.city_id,
        s.city,
        s.title,
        s.body,
        s.summary,
        COALESCE(s.author_name, c.display_name) AS author_name,
        s.category,
        s.tags,
        s.year,
        s.date_range,
        s.neighborhood,
        s.image_description,
        s.related_place_ids,
        s.related_entity_ids,
        s.related_moment_ids,
        s.is_published,
        s.is_frozen,
        s.created_at,
        s.updated_at
    FROM public.civic_stories AS s
    LEFT JOIN public.contributors AS c
        ON c.id = s.contributor_id
    WHERE s.id = story_id;
$function$;