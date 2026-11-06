BEGIN;

REVOKE EXECUTE ON FUNCTION public.admin_freeze_story(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_unfreeze_story(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_hide_story(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_republish_story(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_story_status(uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated;

DO $check_grants$
DECLARE
  v_signature text;
  v_function oid;
  v_owner oid;
  v_service_role oid := (
    SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'service_role'
  );
  v_signatures text[] := ARRAY[
    'public.admin_freeze_story(uuid)',
    'public.admin_unfreeze_story(uuid)',
    'public.admin_hide_story(uuid)',
    'public.admin_republish_story(uuid)',
    'public.admin_update_story_status(uuid,text,jsonb)'
  ];
BEGIN
  IF v_service_role IS NULL THEN
    RAISE EXCEPTION 'service_role does not exist';
  END IF;

  FOREACH v_signature IN ARRAY v_signatures LOOP
    v_function := pg_catalog.to_regprocedure(v_signature);
    IF v_function IS NULL THEN
      RAISE EXCEPTION 'Expected function % does not exist', v_signature;
    END IF;

    SELECT proowner INTO v_owner
    FROM pg_catalog.pg_proc
    WHERE oid = v_function;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Expected function % does not exist', v_signature;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS p
      CROSS JOIN LATERAL pg_catalog.aclexplode(p.proacl) AS acl
      WHERE p.oid = v_function
        AND acl.privilege_type = 'EXECUTE'
        AND acl.grantee = 0
    ) THEN
      RAISE EXCEPTION 'PUBLIC retains explicit EXECUTE on %', v_signature;
    END IF;

    IF NOT pg_catalog.has_function_privilege(v_owner, v_function, 'EXECUTE') THEN
      RAISE EXCEPTION 'Function owner lost EXECUTE on %', v_signature;
    END IF;

    IF NOT pg_catalog.has_function_privilege(v_service_role, v_function, 'EXECUTE') THEN
      RAISE EXCEPTION 'service_role lost EXECUTE on %', v_signature;
    END IF;

    IF pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
       OR pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE') THEN
      RAISE EXCEPTION 'Client role retains effective EXECUTE on %', v_signature;
    END IF;
  END LOOP;
END;
$check_grants$;

COMMIT;
