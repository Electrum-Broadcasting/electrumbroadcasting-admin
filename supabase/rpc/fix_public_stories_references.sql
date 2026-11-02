-- The civic story table was renamed to public.civic_stories.
-- Leftover functions (including search-index triggers on civic_stories)
-- still name public.stories, so every insert/update fails with:
--   relation "public.stories" does not exist
-- This rewrites those function bodies in place. It does not recreate stories.

DO $eb_stories_rewrite_20261102$
DECLARE
  rec record;
  src text;
  rewritten text;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_functiondef(p.oid) AS definition
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  LOOP
    src := rec.definition;
    IF src !~ '(^|[^[:alnum:]_])stories([^[:alnum:]_]|$)' THEN
      CONTINUE;
    END IF;

    rewritten := src;
    rewritten := replace(rewritten, 'civic_stories', '___CIVIC_STORIES___');
    rewritten := replace(rewritten, 'moment_stories', '___MOMENT_STORIES___');
    rewritten := replace(rewritten, 'public_civic_stories', '___PUBLIC_CIVIC_STORIES___');
    rewritten := replace(rewritten, 'public.stories', 'public.civic_stories');
    rewritten := regexp_replace(
      rewritten,
      '(^|[^[:alnum:]_])stories([^[:alnum:]_]|$)',
      '\1civic_stories\2',
      'g'
    );
    rewritten := replace(rewritten, '___PUBLIC_CIVIC_STORIES___', 'public_civic_stories');
    rewritten := replace(rewritten, '___MOMENT_STORIES___', 'moment_stories');
    rewritten := replace(rewritten, '___CIVIC_STORIES___', 'civic_stories');

    IF rewritten IS DISTINCT FROM src THEN
      EXECUTE rewritten;
      RAISE NOTICE 'Rewrote %.% to use civic_stories', rec.schema_name, rec.function_name;
    END IF;
  END LOOP;
END
$eb_stories_rewrite_20261102$;
