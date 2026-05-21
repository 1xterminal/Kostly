-- =============================================================
-- kostly · payment_review_and_reply_sender_rls.sql
-- 1. Let tenants see sender profiles for replies on their own tickets.
-- 2. Review payment proofs in one trusted transaction.
-- =============================================================

drop policy if exists "tenant_select_ticket_reply_senders" on public.users;

create policy "tenant_select_ticket_reply_senders"
  on public.users
  for select
  using (
    exists (
      select 1
      from public.ticket_replies
      join public.maintenance_tickets
        on maintenance_tickets.id = ticket_replies.ticket_id
      where ticket_replies.sender_id = users.id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

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
