create or replace function public.admin_update_user(
  p_user_id uuid,
  p_role text,
  p_city_ids uuid[],
  p_status text,
  p_primary_city_slug text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.admin_users admin_actor
    where admin_actor.user_id = auth.uid()
      and admin_actor.status = 'active'
      and admin_actor.role in ('CEO', 'PLATFORM_ADMIN')
  ) then
    raise exception 'Insufficient privileges';
  end if;

  update public.admin_users
  set role = p_role,
      city_ids = coalesce(p_city_ids, '{}'::uuid[]),
      status = p_status,
      primary_city_slug = nullif(trim(coalesce(p_primary_city_slug, '')), '')
  where user_id = p_user_id;

  if not found then
    raise exception 'Admin user not found';
  end if;
end;
$$;

grant execute on function public.admin_update_user(uuid, text, uuid[], text, text) to authenticated;