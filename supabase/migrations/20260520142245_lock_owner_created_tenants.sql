-- =============================================================
-- kostly · lock_owner_created_tenants.sql
-- Auth identity alone is not app membership. Tenants must be
-- created by the Owner dashboard, which writes public.users.
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

delete from public.users
where email = 'user@example.com'
  and role = 'tenant'
  and not exists (
    select 1
    from public.contracts
    where contracts.tenant_id = users.id
  );
