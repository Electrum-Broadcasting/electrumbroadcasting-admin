-- One-time backfill: admin_users.user_id / auth_uid must equal the matching
-- auth.users.id. Run the diagnostic SELECTs first; only run the UPDATE once
-- you've confirmed the matches look correct. Rows with no matching email in
-- auth.users need a manual decision (create/link an auth user, or remove).

-- 1. Rows missing a linked auth user id
select id, email, role, status, user_id, auth_uid
from public.admin_users
where user_id is null or auth_uid is null;

-- 2. Preview the fix: admin_users rows matched to auth.users by email
select
  au.id as admin_users_id,
  au.email,
  au.user_id as current_user_id,
  au.auth_uid as current_auth_uid,
  u.id as auth_users_id
from public.admin_users au
join auth.users u on u.email = au.email
where au.user_id is distinct from u.id
   or au.auth_uid is distinct from u.id;

-- 3. Apply the fix (uncomment to run)
-- update public.admin_users au
-- set user_id = u.id,
--     auth_uid = u.id
-- from auth.users u
-- where u.email = au.email
--   and (au.user_id is distinct from u.id or au.auth_uid is distinct from u.id);

-- 4. Rows that still have no match in auth.users after the update above —
--    these admins cannot authenticate/write until an auth user is created
--    and linked (see app/admin/CEO/admin-users/new/actions.ts for the pattern).
select id, email, role, status
from public.admin_users
where user_id is null or auth_uid is null;
