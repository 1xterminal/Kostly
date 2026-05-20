-- =============================================================
-- kostly · submit_payment_transaction.sql
-- Tenant payment submission must insert payment + mark invoice
-- pending in one trusted server-side transaction.
-- =============================================================

create or replace function public.submit_payment_tx(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_proof_images text,
  p_transaction_date date
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.invoices%rowtype;
  v_payment public.payments%rowtype;
begin
  if p_proof_images is null
    or p_proof_images not like ('payments/' || p_tenant_id::text || '/%') then
    raise exception 'Invalid payment proof path';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
    and tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  if v_invoice.status = 'paid' then
    raise exception 'Invoice is already paid';
  end if;

  if exists (
    select 1
    from public.payments
    where invoice_id = p_invoice_id
      and tenant_id = p_tenant_id
      and status = 'not_verified'
  ) then
    raise exception 'Invoice already has a pending payment proof';
  end if;

  insert into public.payments (
    invoice_id,
    tenant_id,
    proof_images,
    transaction_date,
    status,
    is_verified
  )
  values (
    p_invoice_id,
    p_tenant_id,
    p_proof_images,
    p_transaction_date,
    'not_verified',
    false
  )
  returning * into v_payment;

  update public.invoices
  set status = 'pending'
  where id = p_invoice_id;

  return v_payment;
end;
$$;

revoke all on function public.submit_payment_tx(uuid, uuid, text, date) from public;
revoke all on function public.submit_payment_tx(uuid, uuid, text, date) from anon;
revoke all on function public.submit_payment_tx(uuid, uuid, text, date) from authenticated;
grant execute on function public.submit_payment_tx(uuid, uuid, text, date) to service_role;
