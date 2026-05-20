-- =============================================================
-- kostly · harden_rls_storage_auth.sql
-- Tightens role checks, protects tenant self-updates, and adds
-- private Storage policies for payment proof uploads.
-- =============================================================

-- ─── PRIVATE AUTH HELPERS ─────────────────────────────────────
-- Keep RLS helper functions outside exposed public schema.
create schema if not exists private;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'owner'
  );
$$;

revoke all on function private.is_owner() from public;
grant execute on function private.is_owner() to authenticated, service_role;

-- New auth users always start as tenants. Owner accounts are promoted manually
-- in public.users by an existing owner/admin, matching the MVP: no public owner signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'tenant'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Tenants can maintain profile/onboarding fields, but cannot promote
-- themselves or change lifecycle/auth identity fields through public.users.
create or replace function private.prevent_tenant_privilege_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() = old.id and not private.is_owner() then
    if new.role is distinct from old.role then
      raise exception 'Tenants cannot change their role';
    end if;

    if new.tenant_status is distinct from old.tenant_status then
      raise exception 'Tenants cannot change their tenant status';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Tenants cannot change their email here';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_tenant_privilege_update on public.users;
create trigger trg_prevent_tenant_privilege_update
  before update on public.users
  for each row execute function private.prevent_tenant_privilege_update();

-- ─── RECREATE APP RLS POLICIES WITH PRIVATE HELPER ────────────
drop policy if exists "owner_all_users" on public.users;
drop policy if exists "tenant_select_own_user" on public.users;
drop policy if exists "tenant_update_own_user" on public.users;

drop policy if exists "owner_all_rooms" on public.rooms;
drop policy if exists "tenant_select_own_room" on public.rooms;

drop policy if exists "owner_all_contracts" on public.contracts;
drop policy if exists "tenant_select_own_contracts" on public.contracts;

drop policy if exists "owner_all_invoices" on public.invoices;
drop policy if exists "tenant_select_own_invoices" on public.invoices;

drop policy if exists "owner_update_payments" on public.payments;
drop policy if exists "owner_select_payments" on public.payments;
drop policy if exists "tenant_select_own_payments" on public.payments;
drop policy if exists "tenant_insert_payment" on public.payments;

drop policy if exists "owner_all_tickets" on public.maintenance_tickets;
drop policy if exists "tenant_select_own_tickets" on public.maintenance_tickets;
drop policy if exists "tenant_insert_ticket" on public.maintenance_tickets;

drop policy if exists "owner_select_replies" on public.ticket_replies;
drop policy if exists "owner_insert_reply" on public.ticket_replies;
drop policy if exists "tenant_select_own_replies" on public.ticket_replies;
drop policy if exists "tenant_insert_reply" on public.ticket_replies;

drop policy if exists "owner_select_extend_requests" on public.extend_requests;
drop policy if exists "owner_update_extend_requests" on public.extend_requests;
drop policy if exists "tenant_select_own_extend_requests" on public.extend_requests;
drop policy if exists "tenant_insert_extend_request" on public.extend_requests;

drop policy if exists "owner_all_reports" on public.reports;

create policy "owner_all_users"
  on public.users
  for all
  using      (private.is_owner())
  with check (private.is_owner());

create policy "tenant_select_own_user"
  on public.users
  for select
  using (auth.uid() = id);

create policy "tenant_update_own_user"
  on public.users
  for update
  using      (auth.uid() = id and role = 'tenant')
  with check (auth.uid() = id and role = 'tenant');

create policy "owner_all_rooms"
  on public.rooms
  for all
  using      (private.is_owner())
  with check (private.is_owner());

create policy "tenant_select_own_room"
  on public.rooms
  for select
  using (
    exists (
      select 1 from public.contracts
      where contracts.room_id  = rooms.id
        and contracts.tenant_id = auth.uid()
        and contracts.status    = 'active'
    )
  );

create policy "owner_all_contracts"
  on public.contracts
  for all
  using      (private.is_owner())
  with check (private.is_owner());

create policy "tenant_select_own_contracts"
  on public.contracts
  for select
  using (auth.uid() = tenant_id);

create policy "owner_all_invoices"
  on public.invoices
  for all
  using      (private.is_owner())
  with check (private.is_owner());

create policy "tenant_select_own_invoices"
  on public.invoices
  for select
  using (auth.uid() = tenant_id);

create policy "owner_update_payments"
  on public.payments
  for update
  using      (private.is_owner())
  with check (private.is_owner() and verified_by = auth.uid());

create policy "owner_select_payments"
  on public.payments
  for select
  using (private.is_owner());

create policy "tenant_select_own_payments"
  on public.payments
  for select
  using (auth.uid() = tenant_id);

create policy "tenant_insert_payment"
  on public.payments
  for insert
  with check (
    auth.uid() = tenant_id
    and status = 'not_verified'
    and is_verified = false
    and verified_by is null
    and verified_at is null
    and proof_images like ('payments/' || auth.uid()::text || '/%')
    and exists (
      select 1 from public.invoices
      where invoices.id        = invoice_id
        and invoices.tenant_id = auth.uid()
        and invoices.status   <> 'paid'
    )
  );

create policy "owner_all_tickets"
  on public.maintenance_tickets
  for all
  using      (private.is_owner())
  with check (private.is_owner());

create policy "tenant_select_own_tickets"
  on public.maintenance_tickets
  for select
  using (auth.uid() = reported_by_user_id);

create policy "tenant_insert_ticket"
  on public.maintenance_tickets
  for insert
  with check (
    auth.uid() = reported_by_user_id
    and exists (
      select 1 from public.contracts
      where contracts.room_id   = room_id
        and contracts.tenant_id = auth.uid()
        and contracts.status    = 'active'
    )
  );

create policy "owner_select_replies"
  on public.ticket_replies
  for select
  using (private.is_owner());

create policy "owner_insert_reply"
  on public.ticket_replies
  for insert
  with check (
    auth.uid() = sender_id
    and private.is_owner()
  );

create policy "tenant_select_own_replies"
  on public.ticket_replies
  for select
  using (
    exists (
      select 1 from public.maintenance_tickets
      where maintenance_tickets.id                  = ticket_id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

create policy "tenant_insert_reply"
  on public.ticket_replies
  for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.maintenance_tickets
      where maintenance_tickets.id                  = ticket_id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

create policy "owner_select_extend_requests"
  on public.extend_requests
  for select
  using (private.is_owner());

create policy "owner_update_extend_requests"
  on public.extend_requests
  for update
  using      (private.is_owner())
  with check (private.is_owner() and reviewed_by = auth.uid());

create policy "tenant_select_own_extend_requests"
  on public.extend_requests
  for select
  using (auth.uid() = tenant_id);

create policy "tenant_insert_extend_request"
  on public.extend_requests
  for insert
  with check (
    auth.uid() = tenant_id
    and exists (
      select 1 from public.contracts
      where contracts.id        = contract_id
        and contracts.tenant_id = auth.uid()
        and contracts.status    = 'active'
    )
  );

create policy "owner_all_reports"
  on public.reports
  for all
  using      (private.is_owner())
  with check (private.is_owner());

-- ─── PAYMENT PROOF STORAGE ───────────────────────────────────
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists "tenant_upload_own_payment_proofs" on storage.objects;
drop policy if exists "tenant_read_own_payment_proofs" on storage.objects;
drop policy if exists "owner_read_payment_proofs" on storage.objects;

create policy "tenant_upload_own_payment_proofs"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = 'payments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "tenant_read_own_payment_proofs"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
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
