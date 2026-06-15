-- =============================================================
-- kostly · payment_dispute_tickets.sql
-- Links rejected payment discussions to Maintenance Center tickets.
-- =============================================================

alter table public.maintenance_tickets
  add column ticket_category text not null default 'maintenance',
  add column payment_id uuid references public.payments (id) on delete restrict;

alter table public.maintenance_tickets
  add constraint maintenance_tickets_category_check
  check (
    (
      ticket_category = 'maintenance'
      and payment_id is null
    )
    or (
      ticket_category = 'payment_dispute'
      and payment_id is not null
    )
  );

create index idx_tickets_category
  on public.maintenance_tickets (ticket_category);

create index idx_tickets_payment_id
  on public.maintenance_tickets (payment_id)
  where payment_id is not null;

create unique index maintenance_tickets_one_dispute_per_payment
  on public.maintenance_tickets (payment_id)
  where ticket_category = 'payment_dispute'
    and payment_id is not null;

drop policy if exists "tenant_select_own_tickets" on public.maintenance_tickets;
drop policy if exists "tenant_insert_ticket" on public.maintenance_tickets;

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
    and (
      (
        ticket_category = 'maintenance'
        and payment_id is null
        and exists (
          select 1
          from public.contracts
          where contracts.room_id = maintenance_tickets.room_id
            and contracts.tenant_id = auth.uid()
            and contracts.status = 'active'
        )
      )
      or (
        ticket_category = 'payment_dispute'
        and payment_id is not null
        and exists (
          select 1
          from public.payments
          join public.invoices
            on invoices.id = payments.invoice_id
          join public.contracts
            on contracts.id = invoices.contract_id
          where payments.id = maintenance_tickets.payment_id
            and payments.tenant_id = auth.uid()
            and payments.status = 'rejected'
            and invoices.tenant_id = auth.uid()
            and contracts.tenant_id = auth.uid()
            and contracts.room_id = maintenance_tickets.room_id
            and contracts.status = 'active'
        )
      )
    )
  );
