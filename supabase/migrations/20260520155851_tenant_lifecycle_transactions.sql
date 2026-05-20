-- =============================================================
-- kostly · tenant_lifecycle_transactions.sql
-- Keeps tenant placement/archive lifecycle writes atomic.
-- Edge Functions call these RPCs with the service_role key.
-- =============================================================

create or replace function public.assign_tenant_room_tx(
  p_tenant_id uuid,
  p_room_id uuid,
  p_start_date date,
  p_end_date date
)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant public.users%rowtype;
  v_room public.rooms%rowtype;
  v_contract public.contracts%rowtype;
begin
  if p_end_date <= p_start_date then
    raise exception 'End date must be after start date';
  end if;

  select *
  into v_tenant
  from public.users
  where id = p_tenant_id
  for update;

  if not found or v_tenant.role <> 'tenant' then
    raise exception 'Tenant account not found';
  end if;

  if v_tenant.tenant_status = 'archived' then
    raise exception 'Archived tenants cannot be assigned to a room';
  end if;

  if exists (
    select 1
    from public.contracts
    where tenant_id = p_tenant_id
      and status = 'active'
  ) then
    raise exception 'Tenant already has an active contract';
  end if;

  select *
  into v_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.status <> 'available' then
    raise exception 'Room is not available';
  end if;

  if exists (
    select 1
    from public.contracts
    where room_id = p_room_id
      and status = 'active'
  ) then
    raise exception 'Room already has an active contract';
  end if;

  insert into public.contracts (
    tenant_id,
    room_id,
    start_date,
    end_date,
    monthly_rate,
    status
  )
  values (
    p_tenant_id,
    p_room_id,
    p_start_date,
    p_end_date,
    v_room.price,
    'active'
  )
  returning * into v_contract;

  update public.rooms
  set status = 'occupied'
  where id = p_room_id;

  return v_contract;
end;
$$;

create or replace function public.archive_tenant_tx(p_tenant_id uuid)
returns public.users
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant public.users%rowtype;
  v_contract public.contracts%rowtype;
begin
  select *
  into v_tenant
  from public.users
  where id = p_tenant_id
  for update;

  if not found or v_tenant.role <> 'tenant' then
    raise exception 'Tenant account not found';
  end if;

  for v_contract in
    select *
    from public.contracts
    where tenant_id = p_tenant_id
      and status = 'active'
    for update
  loop
    update public.contracts
    set status = 'terminated'
    where id = v_contract.id;

    update public.rooms
    set status = 'available'
    where id = v_contract.room_id
      and status = 'occupied';
  end loop;

  update public.users
  set tenant_status = 'archived'
  where id = p_tenant_id
  returning * into v_tenant;

  return v_tenant;
end;
$$;

revoke all on function public.assign_tenant_room_tx(uuid, uuid, date, date) from public;
revoke all on function public.assign_tenant_room_tx(uuid, uuid, date, date) from anon;
revoke all on function public.assign_tenant_room_tx(uuid, uuid, date, date) from authenticated;
grant execute on function public.assign_tenant_room_tx(uuid, uuid, date, date) to service_role;

revoke all on function public.archive_tenant_tx(uuid) from public;
revoke all on function public.archive_tenant_tx(uuid) from anon;
revoke all on function public.archive_tenant_tx(uuid) from authenticated;
grant execute on function public.archive_tenant_tx(uuid) to service_role;
