# Kostly Supabase Backend

Supabase is the shared backend for the owner web dashboard and tenant mobile app.

## Structure

```txt
supabase/
  config.toml
  migrations/
  functions/
    create-tenant-account/
    assign-tenant-room/
    archive-tenant/
    submit-payment/
    review-payment/
    review-extend-request/
    generate-invoices/
    monthly-report/
```

## Auth And App Users

`auth.users` is only the Supabase login identity. `public.users` is the trusted app membership row.

Tenant accounts are owner-created only:

1. Owner calls `create-tenant-account`.
2. Function creates the Supabase Auth user.
3. Function writes `public.users` with `role = 'tenant'`, `tenant_status = 'active'`, and `onboarding = false`.
4. Tenant logs into mobile with the temporary password and must change it.
5. Mobile sets `public.users.onboarding = true`.

The auth trigger `public.handle_new_user()` is intentionally a no-op now. Random Auth signups must not become Kostly tenants.

Owner accounts are still created/promoted manually:

```sql
insert into public.users (id, email, name, role)
select id, email, split_part(email, '@', 1), 'owner'
from auth.users
where id = '<owner-auth-user-id>'
on conflict (id) do update set role = 'owner';
```

## Lifecycle Functions

| Function | Purpose |
|---|---|
| `create-tenant-account` | Owner-only. Creates tenant Auth account + `public.users` profile. |
| `assign-tenant-room` | Owner-only. Calls `assign_tenant_room_tx` to create contract and occupy room atomically. |
| `archive-tenant` | Owner-only. Calls `archive_tenant_tx` to terminate active contracts, release rooms, and archive tenant atomically. |
| `submit-payment` | Tenant-only. Calls `submit_payment_tx` to create payment and set invoice pending atomically. |
| `review-payment` | Owner-only. Calls `review_payment_tx` to approve/reject payment and update invoice status atomically. |
| `review-extend-request` | Owner-only. Calls `review_extend_request_tx` to approve/reject extend requests and update contract end date atomically. |
| `generate-invoices` | Cron/service-role billing generation. |
| `monthly-report` | Owner-only report snapshot generation. |
| `create-tenant` | Retired legacy endpoint. Returns `410`. |

## Storage

Payment proof files use the private `payment-proofs` bucket.

Bucket restrictions:

- `public = false`
- `file_size_limit = 5242880`
- `allowed_mime_types = image/jpeg, image/png, image/webp, image/heic, image/heif`

Stored paths must follow:

```txt
payments/{tenant-auth-uid}/{filename}
```

The `payments.proof_images` column stores that object path, not a public URL. Web/mobile generate signed URLs when reading proofs.

## RLS

All public tables have RLS enabled.

- Owners manage dashboard data through `private.is_owner()`.
- Tenants read their own rows only while `private.is_active_tenant()` is true.
- Tenant profile updates cannot change `role`, `email`, or `tenant_status`.
- Archived tenants are blocked in mobile login and by database policies for app data.
- Cross-row lifecycle writes use Edge Functions with service role plus SQL transaction functions.

## Deploy

```bash
supabase db push --project-ref <project-ref>

supabase functions deploy create-tenant-account --project-ref <project-ref>
supabase functions deploy assign-tenant-room --project-ref <project-ref>
supabase functions deploy archive-tenant --project-ref <project-ref>
supabase functions deploy submit-payment --project-ref <project-ref>
supabase functions deploy review-payment --project-ref <project-ref>
supabase functions deploy review-extend-request --project-ref <project-ref>
supabase functions deploy generate-invoices --project-ref <project-ref>
supabase functions deploy monthly-report --project-ref <project-ref>
```

All active app functions should keep JWT verification enabled. The retired `create-tenant` endpoint may stay deployed only as a compatibility `410` response.
