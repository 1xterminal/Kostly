-- =============================================================
-- kostly · deadline_hardening_first_invoice.sql
-- Create the first monthly invoice as part of room assignment so
-- newly assigned tenants can immediately submit a payment proof.
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
  v_invoice_date date;
  v_billing_month date;
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

  v_invoice_date := greatest(p_start_date, current_date);
  v_billing_month := date_trunc('month', v_invoice_date)::date;

  insert into public.invoices (
    contract_id,
    tenant_id,
    invoice_date,
    due_date,
    total_amount,
    billing_month,
    status
  )
  values (
    v_contract.id,
    p_tenant_id,
    v_invoice_date,
    v_invoice_date + 5,
    v_room.price,
    v_billing_month,
    'unpaid'
  )
  on conflict (contract_id, billing_month) do nothing;

  update public.rooms
  set status = 'occupied'
  where id = p_room_id;

  return v_contract;
end;
$$;

revoke all on function public.assign_tenant_room_tx(uuid, uuid, date, date) from public;
revoke all on function public.assign_tenant_room_tx(uuid, uuid, date, date) from anon;
revoke all on function public.assign_tenant_room_tx(uuid, uuid, date, date) from authenticated;
grant execute on function public.assign_tenant_room_tx(uuid, uuid, date, date) to service_role;
