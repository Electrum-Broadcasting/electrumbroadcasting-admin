BEGIN;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_users_insert_admins
  ON public.admin_users;

DROP POLICY IF EXISTS admin_users_read_admins
  ON public.admin_users;

DROP POLICY IF EXISTS admin_users_read_city_roles
  ON public.admin_users;

DROP POLICY IF EXISTS admin_users_update_admins
  ON public.admin_users;

DROP POLICY IF EXISTS temporary_admin_users_read
  ON public.admin_users;

REVOKE ALL PRIVILEGES ON TABLE public.admin_users
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION
  public.admin_update_user(uuid, text, uuid[], text, text)
  FROM PUBLIC, anon, authenticated;

COMMIT;
