-- keep RLS enabled, do not bypass it
alter table if exists public.cities enable row level security;
alter table if exists public.city_design_system enable row level security;
alter table if exists public.city_branding_settings enable row level security;
alter table if exists public.themes enable row level security;
alter table if exists public.admin_users enable row level security;

create or replace function public.current_admin_role()
returns text
language sql
stable
as $$
  select role
  from public.admin_users
  where auth_uid = auth.uid()
  limit 1;
$$;

create or replace function public.is_ceo_or_platform_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_admin_role() in ('CEO', 'PLATFORM_ADMIN'), false);
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_admin_role() is not null, false);
$$;

create policy "cities_public_read" on public.cities
for select
using (
  status = 'published'
  or public.is_admin_user()
);

create policy "cities_admin_write" on public.cities
for insert
with check (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "cities_admin_update" on public.cities
for update
using (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN')
with check (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "cities_admin_delete" on public.cities
for delete
using (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "city_design_system_public_read" on public.city_design_system
for select
using (
  jsonb_typeof(published_theme) = 'object'
  or public.is_admin_user()
);

create policy "city_design_system_admin_write" on public.city_design_system
for insert
with check (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "city_design_system_admin_update" on public.city_design_system
for update
using (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN')
with check (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "city_design_system_admin_delete" on public.city_design_system
for delete
using (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "themes_public_read" on public.themes
for select
using (
  is_published = true
  or public.is_admin_user()
);

create policy "themes_admin_write" on public.themes
for insert
with check (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "themes_admin_update" on public.themes
for update
using (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN')
with check (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "themes_admin_delete" on public.themes
for delete
using (public.is_ceo_or_platform_admin() or public.current_admin_role() = 'CITY_ADMIN');

create policy "admin_users_admin_read" on public.admin_users
for select
using (public.is_ceo_or_platform_admin());

create policy "admin_users_admin_write" on public.admin_users
for insert
with check (public.is_ceo_or_platform_admin());

create policy "admin_users_admin_update" on public.admin_users
for update
using (public.is_ceo_or_platform_admin())
with check (public.is_ceo_or_platform_admin());

create policy "admin_users_admin_delete" on public.admin_users
for delete
using (public.is_ceo_or_platform_admin());
