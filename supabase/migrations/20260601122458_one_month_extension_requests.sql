-- Keep extensions aligned with the monthly billing model.
-- A tenant requests exactly one extra month; owner approval creates the
-- extension invoice, and payment verification activates the new end date.

drop policy if exists "tenant_insert_extend_request" on public.extend_requests;

create policy "tenant_insert_extend_request"
  on public.extend_requests
  for insert
  with check (
    private.is_active_tenant()
    and auth.uid() = tenant_id
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and extension_invoice_id is null
    and exists (
      select 1
      from public.contracts
      where contracts.id = extend_requests.contract_id
        and contracts.tenant_id = auth.uid()
        and contracts.status = 'active'
        and extend_requests.requested_end_date = (contracts.end_date + interval '1 month')::date
    )
  );

create or replace function public.review_extend_request_tx(
  p_owner_id uuid,
  p_request_id uuid,
  p_action text
)
returns public.extend_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.extend_requests%rowtype;
  v_contract public.contracts%rowtype;
  v_invoice public.invoices%rowtype;
  v_invoice_id uuid;
  v_billing_month date;
  v_invoice_date date;
  v_expected_end_date date;
begin
  if not exists (
    select 1
    from public.users
    where id = p_owner_id
      and role = 'owner'
  ) then
    raise exception 'Only owners can review extend requests';
  end if;

  select *
  into v_request
  from public.extend_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Extend request not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Extend request has already been reviewed';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = v_request.contract_id
  for update;

  if not found or v_contract.status <> 'active' then
    raise exception 'Active contract not found';
  end if;

  if p_action = 'approved' then
    v_expected_end_date := (v_contract.end_date + interval '1 month')::date;

    if v_request.requested_end_date <> v_expected_end_date then
      raise exception 'Extension requests must add exactly one month';
    end if;

    v_billing_month := date_trunc('month', v_contract.end_date + interval '1 month')::date;
    v_invoice_date := current_date;

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
      v_contract.tenant_id,
      v_invoice_date,
      v_invoice_date + 5,
      v_contract.monthly_rate,
      v_billing_month,
      'unpaid'
    )
    on conflict (contract_id, billing_month) do nothing
    returning id into v_invoice_id;

    if v_invoice_id is null then
      select *
      into v_invoice
      from public.invoices
      where contract_id = v_contract.id
        and billing_month = v_billing_month
      for update;

      if not found then
        raise exception 'Extension invoice could not be created';
      end if;

      if v_invoice.status <> 'unpaid' then
        raise exception 'Extension invoice must be unpaid before it can be attached to an extension request';
      end if;

      v_invoice_id := v_invoice.id;
    end if;

    update public.extend_requests
    set status = 'awaiting_payment',
        reviewed_by = p_owner_id,
        reviewed_at = now(),
        extension_invoice_id = v_invoice_id
    where id = p_request_id
    returning * into v_request;
  elsif p_action = 'rejected' then
    update public.extend_requests
    set status = 'rejected',
        reviewed_by = p_owner_id,
        reviewed_at = now()
    where id = p_request_id
    returning * into v_request;
  else
    raise exception 'Invalid extend request action';
  end if;

  return v_request;
end;
$$;

revoke all on function public.review_extend_request_tx(uuid, uuid, text) from public;
revoke all on function public.review_extend_request_tx(uuid, uuid, text) from anon;
revoke all on function public.review_extend_request_tx(uuid, uuid, text) from authenticated;
grant execute on function public.review_extend_request_tx(uuid, uuid, text) to service_role;
