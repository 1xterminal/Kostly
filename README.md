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
