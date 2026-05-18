-- Enable RLS on all admin-managed tables.
alter table if exists public.cities enable row level security;
alter table if exists public.themes enable row level security;
alter table if exists public.stories enable row level security;
alter table if exists public.places enable row level security;
alter table if exists public.scores enable row level security;
alter table if exists public.media_assets enable row level security;
alter table if exists public.admin_roles enable row level security;

-- Helper function: current user's admin role.
create or replace function public.current_admin_role()
returns text
language sql
stable
as $$
  select ar.role
  from public.admin_roles ar
  where ar.user_id = auth.uid()
  limit 1;
$$;

-- Read policy: viewers, editors, and admins can read all managed tables.
do $$
declare
  t text;
begin
  foreach t in array array['cities','themes','stories','places','scores','media_assets','admin_roles'] loop
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format(
      'create policy "%s_read" on public.%I for select using (public.current_admin_role() in (''viewer'',''editor'',''admin''))',
      t,
      t
    );
  end loop;
end $$;

-- Write policy for editor/admin.
do $$
declare
  t text;
begin
  foreach t in array array['cities','themes','stories','places','scores','media_assets'] loop
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);

    execute format(
      'create policy "%s_insert" on public.%I for insert with check (public.current_admin_role() in (''editor'',''admin''))',
      t,
      t
    );
    execute format(
      'create policy "%s_update" on public.%I for update using (public.current_admin_role() in (''editor'',''admin'')) with check (public.current_admin_role() in (''editor'',''admin''))',
      t,
      t
    );
    execute format(
      'create policy "%s_delete" on public.%I for delete using (public.current_admin_role() = ''admin'')',
      t,
      t
    );
  end loop;
end $$;

-- admin_roles is admin-only mutable.
drop policy if exists admin_roles_insert on public.admin_roles;
drop policy if exists admin_roles_update on public.admin_roles;
drop policy if exists admin_roles_delete on public.admin_roles;

create policy admin_roles_insert on public.admin_roles
for insert
with check (public.current_admin_role() = 'admin');

create policy admin_roles_update on public.admin_roles
for update
using (public.current_admin_role() = 'admin')
with check (public.current_admin_role() = 'admin');

create policy admin_roles_delete on public.admin_roles
for delete
using (public.current_admin_role() = 'admin');
