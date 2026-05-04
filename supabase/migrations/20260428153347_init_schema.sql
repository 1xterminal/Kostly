-- =============================================================
-- kostly · init_schema.sql
-- Creates all enums, tables, foreign keys, and indexes.
-- Apply in Supabase Dashboard → SQL Editor (run once).
-- =============================================================

-- ─── EXTENSIONS ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUMS ────────────────────────────────────────────────────
create type user_role              as enum ('owner', 'tenant');
create type tenant_status_enum     as enum ('active', 'archived');
create type room_status_enum       as enum ('available', 'occupied', 'maintenance');
create type contract_status_enum   as enum ('active', 'expired', 'terminated');
create type invoice_status_enum    as enum ('unpaid', 'pending', 'paid');
create type payment_status_enum    as enum ('not_verified', 'verified', 'rejected');
create type ticket_status_enum     as enum ('reported', 'in_progress', 'resolved', 'closed');
create type extend_req_status_enum as enum ('pending', 'approved', 'rejected');

-- ─── TABLE: users ─────────────────────────────────────────────
-- Single-table inheritance for Owner and Tenant.
-- id mirrors auth.users.id so we can do auth.uid() = id lookups.
create table public.users (
  id             uuid                 primary key references auth.users (id) on delete cascade,
  email          text                 not null unique,
  name           text                 not null,
  phone_number   text,
  role           user_role            not null,
  -- tenant-only fields (null for owner)
  onboarding     boolean              default false,
  tenant_status  tenant_status_enum   default 'active',
  created_at     timestamptz          not null default now(),
  updated_at     timestamptz          not null default now()
);

-- ─── TABLE: rooms ─────────────────────────────────────────────
create table public.rooms (
  id             uuid                 primary key default gen_random_uuid(),
  owner_id       uuid                 not null references public.users (id) on delete restrict,
  number         varchar(20)          not null,
  price          numeric(12, 2)       not null check (price >= 0),
  status         room_status_enum     not null default 'available',
  wifi_password  text,
  created_at     timestamptz          not null default now(),
  updated_at     timestamptz          not null default now(),
  unique (owner_id, number)           -- room numbers unique per owner
);

-- ─── TABLE: contracts ─────────────────────────────────────────
create table public.contracts (
  id             uuid                 primary key default gen_random_uuid(),
  room_id        uuid                 not null references public.rooms (id) on delete restrict,
  tenant_id      uuid                 not null references public.users (id) on delete restrict,
  start_date     date                 not null,
  end_date       date                 not null,
  monthly_rate   numeric(12, 2)       not null check (monthly_rate >= 0),
  status         contract_status_enum not null default 'active',
  created_at     timestamptz          not null default now(),
  updated_at     timestamptz          not null default now(),
  check (end_date > start_date)
);

create index idx_contracts_tenant_id on public.contracts (tenant_id);
create index idx_contracts_room_id   on public.contracts (room_id);
create index idx_contracts_status    on public.contracts (status);

-- ─── TABLE: invoices ──────────────────────────────────────────
-- billing_month stored as YYYY-MM-01 for idempotency checks in the cron function.
create table public.invoices (
  id             uuid                 primary key default gen_random_uuid(),
  contract_id    uuid                 not null references public.contracts (id) on delete restrict,
  tenant_id      uuid                 not null references public.users (id) on delete restrict,
  invoice_date   date                 not null default current_date,
  due_date       date                 not null,
  total_amount   numeric(12, 2)       not null check (total_amount >= 0),
  billing_month  date                 not null,  -- first day of the billed month
  status         invoice_status_enum  not null default 'unpaid',
  created_at     timestamptz          not null default now(),
  updated_at     timestamptz          not null default now(),
  -- one invoice per contract per month
  unique (contract_id, billing_month)
);

create index idx_invoices_tenant_id     on public.invoices (tenant_id);
create index idx_invoices_contract_id   on public.invoices (contract_id);
create index idx_invoices_billing_month on public.invoices (billing_month);
create index idx_invoices_status        on public.invoices (status);

-- ─── TABLE: payments ──────────────────────────────────────────
-- proof_images stores the Supabase Storage object path, not a public URL.
create table public.payments (
  id                uuid                 primary key default gen_random_uuid(),
  invoice_id        uuid                 not null references public.invoices (id) on delete restrict,
  tenant_id         uuid                 not null references public.users (id) on delete restrict,
  proof_images      text                 not null,  -- storage path: payments/{uid}/filename
  transaction_date  date                 not null default current_date,
  is_verified       boolean              not null default false,
  status            payment_status_enum  not null default 'not_verified',
  rejection_reason  text,
  verified_by       uuid                 references public.users (id) on delete set null,
  verified_at       timestamptz,
  created_at        timestamptz          not null default now(),
  updated_at        timestamptz          not null default now()
);

create index idx_payments_tenant_id  on public.payments (tenant_id);
create index idx_payments_invoice_id on public.payments (invoice_id);
create index idx_payments_status     on public.payments (status);

-- ─── TABLE: maintenance_tickets ───────────────────────────────
create table public.maintenance_tickets (
  id                   uuid                 primary key default gen_random_uuid(),
  reported_by_user_id  uuid                 not null references public.users (id) on delete restrict,
  room_id              uuid                 not null references public.rooms (id) on delete restrict,
  date_created         date                 not null default current_date,
  description          text                 not null,
  ticket_status        ticket_status_enum   not null default 'reported',
  resolved_message     text,
  resolved_at          timestamptz,
  created_at           timestamptz          not null default now(),
  updated_at           timestamptz          not null default now()
);

create index idx_tickets_reporter on public.maintenance_tickets (reported_by_user_id);
create index idx_tickets_room_id  on public.maintenance_tickets (room_id);
create index idx_tickets_status   on public.maintenance_tickets (ticket_status);

-- ─── TABLE: ticket_replies ────────────────────────────────────
create table public.ticket_replies (
  id         uuid        primary key default gen_random_uuid(),
  ticket_id  uuid        not null references public.maintenance_tickets (id) on delete cascade,
  sender_id  uuid        not null references public.users (id) on delete restrict,
  message    text        not null,
  created_at timestamptz not null default now()
);

create index idx_ticket_replies_ticket_id on public.ticket_replies (ticket_id);

-- ─── TABLE: extend_requests ───────────────────────────────────
create table public.extend_requests (
  id                  uuid                   primary key default gen_random_uuid(),
  contract_id         uuid                   not null references public.contracts (id) on delete restrict,
  tenant_id           uuid                   not null references public.users (id) on delete restrict,
  requested_end_date  date                   not null,
  note                text,
  status              extend_req_status_enum not null default 'pending',
  reviewed_by         uuid                   references public.users (id) on delete set null,
  reviewed_at         timestamptz,
  created_at          timestamptz            not null default now()
);

create index idx_extend_requests_tenant_id   on public.extend_requests (tenant_id);
create index idx_extend_requests_contract_id on public.extend_requests (contract_id);
create index idx_extend_requests_status      on public.extend_requests (status);

-- ─── TABLE: reports ───────────────────────────────────────────
-- Aggregate snapshot per owner per month; YYYY-MM-01 date format for month_year.
create table public.reports (
  id                    uuid         primary key default gen_random_uuid(),
  owner_id              uuid         not null references public.users (id) on delete restrict,
  month_year            date         not null,  -- YYYY-MM-01
  total_revenue         numeric(14, 2) not null default 0,
  total_rooms           integer       not null default 0,
  occupied_rooms        integer       not null default 0,
  occupancy_rate        numeric(5, 2) not null default 0,  -- percentage 0-100
  total_paid_invoices   integer       not null default 0,
  created_at            timestamptz   not null default now(),
  unique (owner_id, month_year)
);

create index idx_reports_owner_id   on public.reports (owner_id);
create index idx_reports_month_year on public.reports (month_year);

-- ─── AUTO-UPDATE updated_at TRIGGER ───────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_rooms_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger trg_tickets_updated_at
  before update on public.maintenance_tickets
  for each row execute function public.set_updated_at();
