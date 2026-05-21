# Kostly

Kostly digitizes kost management with two clients sharing one Supabase backend.

| App | User | Stack |
|---|---|---|
| `apps/web` | Owner dashboard | React, Vite, TypeScript, Tailwind, TanStack Query |
| `apps/mobile` | Tenant app | Flutter, Riverpod, GoRouter, Supabase |
| `supabase` | Backend | Auth, Postgres, RLS, Storage, Edge Functions |

## Current Backend Flow

Tenant signup is not public. Owner creates tenant accounts from the web dashboard.

1. Add tenant account.
2. Tenant receives temporary password.
3. Assign tenant to a room, creating an active contract.
4. Tenant logs into mobile and changes password on first login.
5. Payments and room lifecycle changes go through trusted Edge Functions where multi-table writes must be atomic.

## Local Commands

```bash
pnpm --filter @kostly/web dev
pnpm --filter @kostly/web lint
pnpm --filter @kostly/web build

cd apps/mobile
flutter analyze
flutter test
flutter run
```

## Environment

Root `.env.example` documents shared Supabase values. Web uses Vite-prefixed variables:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Mobile reads its Supabase URL/key from `apps/mobile/assets/.env`.

## Post-Presentation Hardening

Completed in the hardening pass:

1. Form validation
   - Web validates tenant account, room, tenant edit, assign-room dates, owner profile/password, and payment reject reason.
   - Mobile validates login/reset/onboarding/change-password, profile edit, maintenance description, and payment proof type/size.

2. Auth and RLS hardening
   - Tenant app still reads own profile for clear archived/login errors.
   - Tenant-only data access is gated by `private.is_active_tenant()` so archived tenants cannot keep using existing sessions for app data.
   - Owner/tenant Edge Functions require JWT and still verify `public.users.role`.

3. Password reset/change
   - Web reset form rejects missing/expired reset sessions.
   - Mobile forgot password uses the `com.kostly.mobile://reset-password` deep link and reset rejects missing/expired sessions.
   - Owner and tenant password changes require current password.

4. Storage and payments
   - `payment-proofs` bucket is private, limited to 5 MB, and restricted to image MIME types.
   - Tenant uploads must stay under `payments/{auth.uid()}/*`.
   - Payment submit/review stays atomic through `submit_payment_tx` and `review_payment_tx`.

5. Contracts
   - Assign room, archive tenant, and extend-request review use transaction RPCs.
   - Approving an extend request extends `contracts.end_date`; payment approval does not extend contracts until billing-period/months-covered data exists.

Manual QA still worth doing before push: full owner-to-tenant happy path, rejected payment retry, archived tenant app block, expired reset link, and proof upload over 5 MB.
