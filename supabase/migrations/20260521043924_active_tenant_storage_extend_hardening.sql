-- =============================================================
-- kostly · active_tenant_storage_extend_hardening.sql
-- Blocks archived tenants from tenant-only app data, tightens
-- payment proof uploads, and reviews extend requests atomically.
-- =============================================================

create or replace function private.is_active_tenant()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'tenant'
      and users.tenant_status = 'active'
  );
$$;

revoke all on function private.is_active_tenant() from public;
revoke all on function private.is_active_tenant() from anon;
revoke all on function private.is_active_tenant() from authenticated;
grant execute on function private.is_active_tenant() to anon, authenticated, service_role;

-- Tenant policies keep self-profile SELECT open so login can read
-- tenant_status and show archived/account-state errors correctly.
drop policy if exists "tenant_update_own_user" on public.users;
drop policy if exists "tenant_select_ticket_reply_senders" on public.users;

drop policy if exists "tenant_select_own_room" on public.rooms;

drop policy if exists "tenant_select_own_contracts" on public.contracts;

drop policy if exists "tenant_select_own_invoices" on public.invoices;

drop policy if exists "tenant_select_own_payments" on public.payments;
drop policy if exists "tenant_insert_payment" on public.payments;

drop policy if exists "tenant_select_own_tickets" on public.maintenance_tickets;
drop policy if exists "tenant_insert_ticket" on public.maintenance_tickets;

drop policy if exists "tenant_select_own_replies" on public.ticket_replies;
drop policy if exists "tenant_insert_reply" on public.ticket_replies;

drop policy if exists "tenant_select_own_extend_requests" on public.extend_requests;
drop policy if exists "tenant_insert_extend_request" on public.extend_requests;

create policy "tenant_update_own_user"
  on public.users
  for update
  using (
    auth.uid() = id
    and role = 'tenant'
    and private.is_active_tenant()
  )
  with check (
    auth.uid() = id
    and role = 'tenant'
    and tenant_status = 'active'
  );

create policy "tenant_select_ticket_reply_senders"
  on public.users
  for select
  using (
    private.is_active_tenant()
    and exists (
      select 1
      from public.ticket_replies
      join public.maintenance_tickets
        on maintenance_tickets.id = ticket_replies.ticket_id
      where ticket_replies.sender_id = users.id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

create policy "tenant_select_own_room"
  on public.rooms
  for select
  using (
    private.is_active_tenant()
    and exists (
      select 1
      from public.contracts
      where contracts.room_id = rooms.id
        and contracts.tenant_id = auth.uid()
        and contracts.status = 'active'
    )
  );

create policy "tenant_select_own_contracts"
  on public.contracts
  for select
  using (
    private.is_active_tenant()
    and auth.uid() = tenant_id
  );

create policy "tenant_select_own_invoices"
  on public.invoices
  for select
  using (
    private.is_active_tenant()
    and auth.uid() = tenant_id
  );

create policy "tenant_select_own_payments"
  on public.payments
  for select
  using (
    private.is_active_tenant()
    and auth.uid() = tenant_id
  );

create policy "tenant_insert_payment"
  on public.payments
  for insert
  with check (
    private.is_active_tenant()
    and auth.uid() = tenant_id
    and status = 'not_verified'
    and is_verified = false
    and verified_by is null
    and verified_at is null
    and proof_images like ('payments/' || auth.uid()::text || '/%')
    and exists (
      select 1 from public.invoices
      where invoices.id = invoice_id
        and invoices.tenant_id = auth.uid()
        and invoices.status <> 'paid'
    )
  );

create policy "tenant_select_own_tickets"
  on public.maintenance_tickets
  for select
  using (
    private.is_active_tenant()
    and auth.uid() = reported_by_user_id
  );

create policy "tenant_insert_ticket"
  on public.maintenance_tickets
  for insert
  with check (
    private.is_active_tenant()
    and auth.uid() = reported_by_user_id
    and length(trim(description)) between 10 and 1000
    and exists (
      select 1 from public.contracts
      where contracts.room_id = maintenance_tickets.room_id
        and contracts.tenant_id = auth.uid()
        and contracts.status = 'active'
    )
  );

create policy "tenant_select_own_replies"
  on public.ticket_replies
  for select
  using (
    private.is_active_tenant()
    and exists (
      select 1 from public.maintenance_tickets
      where maintenance_tickets.id = ticket_replies.ticket_id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

create policy "tenant_insert_reply"
  on public.ticket_replies
  for insert
  with check (
    private.is_active_tenant()
    and auth.uid() = sender_id
    and length(trim(message)) between 1 and 1000
    and exists (
      select 1 from public.maintenance_tickets
      where maintenance_tickets.id = ticket_replies.ticket_id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

create policy "tenant_select_own_extend_requests"
  on public.extend_requests
  for select
  using (
    private.is_active_tenant()
    and auth.uid() = tenant_id
  );

create policy "tenant_insert_extend_request"
  on public.extend_requests
  for insert
  with check (
    private.is_active_tenant()
    and auth.uid() = tenant_id
    and exists (
      select 1 from public.contracts
      where contracts.id = extend_requests.contract_id
        and contracts.tenant_id = auth.uid()
        and contracts.status = 'active'
        and extend_requests.requested_end_date > contracts.end_date
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tenant_upload_own_payment_proofs" on storage.objects;
drop policy if exists "tenant_read_own_payment_proofs" on storage.objects;
drop policy if exists "owner_read_payment_proofs" on storage.objects;

create policy "tenant_upload_own_payment_proofs"
  on storage.objects
  for insert
  to authenticated
  with check (
    private.is_active_tenant()
    and bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = 'payments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "tenant_read_own_payment_proofs"
  on storage.objects
  for select
  to authenticated
  using (
    private.is_active_tenant()
    and bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = 'payments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "owner_read_payment_proofs"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and private.is_owner()
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

    update public.contracts
    set end_date = v_request.requested_end_date
    where id = v_contract.id;

    update public.extend_requests
    set status = 'approved',
        reviewed_by = p_owner_id,
        reviewed_at = now()
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
