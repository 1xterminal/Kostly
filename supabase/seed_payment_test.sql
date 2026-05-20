-- ============================================================
-- TEST SEED: Payment System
-- Run this in Supabase SQL Editor to populate test data.
-- It creates a test owner, test tenant, property, room,
-- contract, invoices, and sample payments.
-- ============================================================

-- ── 1. Auth users (run as service_role) ─────────────────────
-- NOTE: You can also create these via Supabase Dashboard > Authentication > Users
-- and then copy the generated UUIDs below.

-- If you have an existing owner & tenant user, skip step 1 and
-- replace the UUIDs below with your real UUIDs.

DO $$
DECLARE
  owner_id  uuid := '00000000-0000-0000-0000-000000000001';
  tenant_id uuid := '00000000-0000-0000-0000-000000000002';
  prop_id   uuid;
  room_id   uuid;
  contract_id uuid;
  inv1_id   uuid;
  inv2_id   uuid;
  inv3_id   uuid;
BEGIN

  -- ── 2. Insert into public.users ─────────────────────────────
  INSERT INTO public.users (id, name, email, role, phone_number)
  VALUES
    (owner_id,  'Owner Test',  'owner@test.com',  'owner',  '081234567890'),
    (tenant_id, 'User1234',    'tenant@test.com', 'tenant', '089876543210')
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. Property ─────────────────────────────────────────────
  INSERT INTO public.properties (id, owner_id, name, address)
  VALUES (gen_random_uuid(), owner_id, 'Kos Mawar', 'Jl. Mawar No. 1, Jakarta')
  RETURNING id INTO prop_id;

  -- ── 4. Room ─────────────────────────────────────────────────
  INSERT INTO public.rooms (id, property_id, number, monthly_price, status)
  VALUES (gen_random_uuid(), prop_id, '1', 700000, 'occupied')
  RETURNING id INTO room_id;

  -- ── 5. Contract ─────────────────────────────────────────────
  INSERT INTO public.contracts (id, room_id, tenant_id, start_date, end_date, status, monthly_price)
  VALUES (
    gen_random_uuid(),
    room_id,
    tenant_id,
    '2026-03-01',
    '2026-06-30',
    'active',
    700000
  )
  RETURNING id INTO contract_id;

  -- ── 6. Invoices ─────────────────────────────────────────────
  -- Invoice 1: UNVERIFIED (has a pending payment)
  INSERT INTO public.invoices (id, contract_id, tenant_id, billing_month, invoice_date, due_date, total_amount, status)
  VALUES (
    gen_random_uuid(), contract_id, tenant_id,
    '2026-04-01', '2026-04-01', '2026-04-05', 700000, 'pending'
  ) RETURNING id INTO inv1_id;

  -- Invoice 2: PAID (has a verified payment)
  INSERT INTO public.invoices (id, contract_id, tenant_id, billing_month, invoice_date, due_date, total_amount, status)
  VALUES (
    gen_random_uuid(), contract_id, tenant_id,
    '2026-03-01', '2026-03-01', '2026-03-05', 700000, 'paid'
  ) RETURNING id INTO inv2_id;

  -- Invoice 3: UNPAID (no payment yet — will appear in "New payment" dropdown)
  INSERT INTO public.invoices (id, contract_id, tenant_id, billing_month, invoice_date, due_date, total_amount, status)
  VALUES (
    gen_random_uuid(), contract_id, tenant_id,
    '2026-05-01', '2026-05-01', '2026-05-05', 700000, 'unpaid'
  ) RETURNING id INTO inv3_id;

  -- ── 7. Payments ─────────────────────────────────────────────
  -- Payment for inv1 → not_verified (UNVERIFIED)
  INSERT INTO public.payments (invoice_id, tenant_id, proof_images, transaction_date, status, is_verified)
  VALUES (
    inv1_id, tenant_id,
    -- Use a placeholder path; replace with real storage path after uploading
    'placeholder/proof_unverified.jpg',
    '2026-04-02',
    'not_verified',
    false
  );

  -- Payment for inv2 → verified
  INSERT INTO public.payments (invoice_id, tenant_id, proof_images, transaction_date, status, is_verified, verified_at)
  VALUES (
    inv2_id, tenant_id,
    'placeholder/proof_verified.jpg',
    '2026-03-02',
    'verified',
    true,
    now()
  );

  -- (Optional) A rejected payment example:
  -- INSERT INTO public.payments (invoice_id, tenant_id, proof_images, transaction_date, status, is_verified, rejection_reason)
  -- VALUES (inv1_id, tenant_id, 'placeholder/proof_rejected.jpg', '2026-04-01', 'rejected', false, 'Proof image is blurry');

  RAISE NOTICE 'Seed completed. Owner: %, Tenant: %, Property: %, Room: %',
    owner_id, tenant_id, prop_id, room_id;

END $$;

-- ── Verify seed ───────────────────────────────────────────────
SELECT 'users'     AS tbl, count(*) FROM public.users     WHERE email IN ('owner@test.com', 'tenant@test.com')
UNION ALL
SELECT 'invoices'  AS tbl, count(*) FROM public.invoices  WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
UNION ALL
SELECT 'payments'  AS tbl, count(*) FROM public.payments  WHERE tenant_id = '00000000-0000-0000-0000-000000000002';
