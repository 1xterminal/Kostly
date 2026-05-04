-- =============================================================
-- kostly · rls_policies.sql
-- Enables RLS on every table and sets per-role policies.
-- Apply AFTER init_schema.sql in Supabase Dashboard → SQL Editor.
-- =============================================================

-- ─── ENABLE RLS ON ALL TABLES ─────────────────────────────────
alter table public.users               enable row level security;
alter table public.rooms               enable row level security;
alter table public.contracts           enable row level security;
alter table public.invoices            enable row level security;
alter table public.payments            enable row level security;
alter table public.maintenance_tickets enable row level security;
alter table public.ticket_replies      enable row level security;
alter table public.extend_requests     enable row level security;
alter table public.reports             enable row level security;

-- ─── HELPER: is_owner() ───────────────────────────────────────
-- Avoids repeating the sub-select in every policy.
create or replace function public.is_owner()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'owner'
  );
$$;

-- ══════════════════════════════════════════════════════════════
--  users
-- ══════════════════════════════════════════════════════════════
-- Owner: full access to all user rows (needed to onboard / archive tenants)
create policy "owner_all_users"
  on public.users
  for all
  using      (public.is_owner())
  with check (public.is_owner());

-- Tenant: can only read/update their own row
create policy "tenant_select_own_user"
  on public.users
  for select
  using (auth.uid() = id);

create policy "tenant_update_own_user"
  on public.users
  for update
  using      (auth.uid() = id)
  with check (auth.uid() = id);

-- ══════════════════════════════════════════════════════════════
--  rooms
-- ══════════════════════════════════════════════════════════════
-- Owner: full CRUD
create policy "owner_all_rooms"
  on public.rooms
  for all
  using      (public.is_owner())
  with check (public.is_owner());

-- Tenant: read the room associated with their active contract
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

-- ══════════════════════════════════════════════════════════════
--  contracts
-- ══════════════════════════════════════════════════════════════
-- Owner: full CRUD
create policy "owner_all_contracts"
  on public.contracts
  for all
  using      (public.is_owner())
  with check (public.is_owner());

-- Tenant: read own contracts only
create policy "tenant_select_own_contracts"
  on public.contracts
  for select
  using (auth.uid() = tenant_id);

-- ══════════════════════════════════════════════════════════════
--  invoices
-- ══════════════════════════════════════════════════════════════
-- Owner: full CRUD
create policy "owner_all_invoices"
  on public.invoices
  for all
  using      (public.is_owner())
  with check (public.is_owner());

-- Tenant: read own invoices only
create policy "tenant_select_own_invoices"
  on public.invoices
  for select
  using (auth.uid() = tenant_id);

-- ══════════════════════════════════════════════════════════════
--  payments
-- ══════════════════════════════════════════════════════════════
-- Owner: can update payments (verify / reject) — verified_by must be themselves
create policy "owner_update_payments"
  on public.payments
  for update
  using      (public.is_owner())
  with check (public.is_owner() and verified_by = auth.uid());

-- Owner: can select all payments (to view proof queue)
create policy "owner_select_payments"
  on public.payments
  for select
  using (public.is_owner());

-- Tenant: can read own payments
create policy "tenant_select_own_payments"
  on public.payments
  for select
  using (auth.uid() = tenant_id);

-- Tenant: can insert a payment only for their own invoices
create policy "tenant_insert_payment"
  on public.payments
  for insert
  with check (
    auth.uid() = tenant_id
    and exists (
      select 1 from public.invoices
      where invoices.id        = invoice_id
        and invoices.tenant_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════
--  maintenance_tickets
-- ══════════════════════════════════════════════════════════════
-- Owner: full access
create policy "owner_all_tickets"
  on public.maintenance_tickets
  for all
  using      (public.is_owner())
  with check (public.is_owner());

-- Tenant: read own tickets
create policy "tenant_select_own_tickets"
  on public.maintenance_tickets
  for select
  using (auth.uid() = reported_by_user_id);

-- Tenant: create a ticket for their own room (active contract required)
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

-- ══════════════════════════════════════════════════════════════
--  ticket_replies
-- ══════════════════════════════════════════════════════════════
-- Owner: read all replies
create policy "owner_select_replies"
  on public.ticket_replies
  for select
  using (public.is_owner());

-- Owner: insert reply (sender_id must be themselves)
create policy "owner_insert_reply"
  on public.ticket_replies
  for insert
  with check (
    auth.uid() = sender_id
    and public.is_owner()
  );

-- Tenant: read replies on their own tickets only
create policy "tenant_select_own_replies"
  on public.ticket_replies
  for select
  using (
    exists (
      select 1 from public.maintenance_tickets
      where maintenance_tickets.id                 = ticket_id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

-- Tenant: insert reply on their own tickets only
create policy "tenant_insert_reply"
  on public.ticket_replies
  for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.maintenance_tickets
      where maintenance_tickets.id                 = ticket_id
        and maintenance_tickets.reported_by_user_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════
--  extend_requests
-- ══════════════════════════════════════════════════════════════
-- Owner: read all + update (approve/reject) — reviewed_by must be themselves
create policy "owner_select_extend_requests"
  on public.extend_requests
  for select
  using (public.is_owner());

create policy "owner_update_extend_requests"
  on public.extend_requests
  for update
  using      (public.is_owner())
  with check (public.is_owner() and reviewed_by = auth.uid());

-- Tenant: read own requests
create policy "tenant_select_own_extend_requests"
  on public.extend_requests
  for select
  using (auth.uid() = tenant_id);

-- Tenant: submit a request only for their own active contracts
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

-- ══════════════════════════════════════════════════════════════
--  reports
-- ══════════════════════════════════════════════════════════════
-- Owner only: full access
create policy "owner_all_reports"
  on public.reports
  for all
  using      (public.is_owner())
  with check (public.is_owner());
