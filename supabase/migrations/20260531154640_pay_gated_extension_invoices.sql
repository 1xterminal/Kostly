-- =============================================================
-- kostly · pay_gated_extension_invoices.sql
-- Owner approval of an extension request creates a rent invoice.
-- The contract end date is extended only after that invoice payment
-- is verified by the owner.
-- =============================================================

alter type public.extend_req_status_enum add value if not exists 'awaiting_payment';

alter table public.extend_requests
  add column if not exists extension_invoice_id uuid
    references public.invoices (id) on delete set null;

create unique index if not exists extend_requests_extension_invoice_id_key
  on public.extend_requests (extension_invoice_id)
  where extension_invoice_id is not null;

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
      select 1 from public.contracts
      where contracts.id = extend_requests.contract_id
        and contracts.tenant_id = auth.uid()
        and contracts.status = 'active'
        and extend_requests.requested_end_date > contracts.end_date
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
    if v_request.requested_end_date <= v_contract.end_date then
      raise exception 'Requested end date must be after current end date';
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

create or replace function public.review_payment_tx(
  p_owner_id uuid,
  p_payment_id uuid,
  p_action text,
  p_rejection_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_request public.extend_requests%rowtype;
  v_contract public.contracts%rowtype;
begin
  if not exists (
    select 1
    from public.users
    where id = p_owner_id
      and role = 'owner'
  ) then
    raise exception 'Only owners can review payments';
  end if;

  select *
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  if v_payment.status <> 'not_verified' then
    raise exception 'Payment has already been reviewed';
  end if;

  if p_action = 'approve' then
    update public.payments
    set status = 'verified',
        is_verified = true,
        rejection_reason = null,
        verified_by = p_owner_id,
        verified_at = now()
    where id = p_payment_id
    returning * into v_payment;

    update public.invoices
    set status = 'paid'
    where id = v_payment.invoice_id;

    select *
    into v_request
    from public.extend_requests
    where extension_invoice_id = v_payment.invoice_id
      and status = 'awaiting_payment'
    for update;

    if found then
      select *
      into v_contract
      from public.contracts
      where id = v_request.contract_id
      for update;

      if not found or v_contract.status <> 'active' then
        raise exception 'Active contract not found for extension payment';
      end if;

      if v_request.requested_end_date <= v_contract.end_date then
        raise exception 'Requested end date must be after current end date';
      end if;

      update public.contracts
      set end_date = v_request.requested_end_date,
          updated_at = now()
      where id = v_contract.id;

      update public.extend_requests
      set status = 'approved',
          reviewed_by = coalesce(reviewed_by, p_owner_id),
          reviewed_at = coalesce(reviewed_at, now())
      where id = v_request.id;
    end if;
  elsif p_action = 'reject' then
    if nullif(trim(coalesce(p_rejection_reason, '')), '') is null then
      raise exception 'Rejection reason is required';
    end if;

    update public.payments
    set status = 'rejected',
        is_verified = false,
        rejection_reason = trim(p_rejection_reason),
        verified_by = p_owner_id,
        verified_at = now()
    where id = p_payment_id
    returning * into v_payment;

    update public.invoices
    set status = 'unpaid'
    where id = v_payment.invoice_id;
  else
    raise exception 'Invalid payment review action';
  end if;

  return v_payment;
end;
$$;

revoke all on function public.review_payment_tx(uuid, uuid, text, text) from public;
revoke all on function public.review_payment_tx(uuid, uuid, text, text) from anon;
revoke all on function public.review_payment_tx(uuid, uuid, text, text) from authenticated;
grant execute on function public.review_payment_tx(uuid, uuid, text, text) to service_role;
