-- PHASE 6 DRAFT: Do not add this file to the automatic migration sequence until
-- all six object workflows and other legitimate writers use the guarded RPCs.
-- Applying it now would break the existing direct-write admin workflows.
--
-- This revokes client table writes only. Trusted service-role direct writes
-- must be inventoried and retired separately; service_role bypasses RLS.
-- Existing policies are retained so SELECT behavior is not changed.
--
-- Rollback must restore the exact grants recorded immediately before rollout.
-- Restoring writes also restores unaudited legacy mutation paths.
BEGIN;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
  public.civic_entities,
  public.civic_events,
  public.civic_artifacts,
  public.civic_neighborhoods,
  public.civic_eras,
  public.civic_moments
FROM PUBLIC, anon, authenticated;

DO $check_permissions$
DECLARE
  v_table regclass;
  v_role text;
  v_privilege text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'public.civic_entities'::regclass,
    'public.civic_events'::regclass,
    'public.civic_artifacts'::regclass,
    'public.civic_neighborhoods'::regclass,
    'public.civic_eras'::regclass,
    'public.civic_moments'::regclass
  ] LOOP
    FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      FOREACH v_privilege IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] LOOP
        IF pg_catalog.has_table_privilege(v_role, v_table, v_privilege) THEN
          RAISE EXCEPTION 'Remaining % privilege for % on %', v_privilege, v_role, v_table;
        END IF;
      END LOOP;
      IF pg_catalog.has_any_column_privilege(v_role, v_table, 'INSERT')
         OR pg_catalog.has_any_column_privilege(v_role, v_table, 'UPDATE') THEN
        RAISE EXCEPTION 'Remaining column write privilege for % on %', v_role, v_table;
      END IF;
    END LOOP;
    IF NOT pg_catalog.has_table_privilege('authenticated', v_table, 'SELECT') THEN
      RAISE EXCEPTION 'Authenticated SELECT missing on %', v_table;
    END IF;
  END LOOP;
END;
$check_permissions$;

COMMIT;
