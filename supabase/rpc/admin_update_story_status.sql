CREATE OR REPLACE FUNCTION public.admin_update_story_status(
    story_id uuid,
    action text,
    metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_admin_id uuid;
    v_city_id uuid;
BEGIN
    -- Validate active admin
    SELECT au.id
    INTO v_admin_id
    FROM public.admin_users AS au
    WHERE au.user_id = auth.uid()
      AND au.status = 'active';

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Active admin account not found for the current user';
    END IF;

    -- Derive city_id from the story itself
    SELECT cs.city_id
    INTO v_city_id
    FROM public.civic_stories AS cs
    WHERE cs.id = story_id;

    IF v_city_id IS NULL THEN
        RAISE EXCEPTION 'Story not found';
    END IF;

    -- Update story
    UPDATE public.civic_stories AS cs
    SET
        is_published = CASE
            WHEN action = 'republish' THEN true
            WHEN action = 'hide' THEN false
            ELSE cs.is_published
        END,
        is_frozen = CASE
            WHEN action = 'freeze' THEN true
            WHEN action = 'unfreeze' THEN false
            ELSE cs.is_frozen
        END,
        updated_by = auth.uid(),
        updated_at = now()
    WHERE cs.id = story_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Story not found';
    END IF;

    -- Delete branch
    IF action = 'delete' THEN
        DELETE FROM public.civic_stories
        WHERE id = story_id;

        INSERT INTO public.admin_override_logs (
            admin_id,
            action,
            target_type,
            target_id,
            city_id,
            metadata
        )
        VALUES (
            v_admin_id,
            'delete_story',
            'story',
            story_id::text,
            v_city_id,
            metadata
        );

        RETURN;
    END IF;

    -- Log override
    INSERT INTO public.admin_override_logs (
        admin_id,
        action,
        target_type,
        target_id,
        city_id,
        metadata
    )
    VALUES (
        v_admin_id,
        action,
        'story',
        story_id::text,
        v_city_id,
        metadata
    );
END;
$function$;
