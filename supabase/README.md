# Kostly — Supabase Backend

This directory contains everything needed to initialize and manage the Kostly backend on Supabase.

---

## Directory Structure

```
supabase/
├── config.toml                   # Supabase CLI project config (local dev settings)
├── migrations/
│   ├── 20260428153347_init_schema.sql   # All tables, enums, indexes, and triggers
│   ├── 20260428153402_rls_policies.sql  # Row-Level Security policies
│   └── 20260428153410_cron_setup.sql    # pg_cron jobs for automated billing
└── functions/
    ├── monthly-report/           # Edge Function: generate a monthly report snapshot
    │   ├── index.ts
    │   └── deno.json
    └── generate-invoices/        # Edge Function: auto-generate monthly invoices
        ├── index.ts
        └── deno.json
```

---

## Initializing the Database (Fresh Setup)

> Run these commands from the project root (`/kostly`).

### 1. Push all migrations to the cloud project

```bash
supabase db push --project-ref <your-project-ref>
```

This runs all SQL files in `migrations/` in chronological order. It is **idempotent** — safe to re-run.

### 2. Deploy Edge Functions

```bash
supabase functions deploy monthly-report --project-ref <your-project-ref>
supabase functions deploy generate-invoices --project-ref <your-project-ref>
```

> Docker is **not** required for cloud deployments. The `WARNING: Docker is not running` message can be ignored.

### 3. Create the first Owner account

After deploying, sign up through the app UI normally. The `on_auth_user_created` trigger (see below) will automatically create the `public.users` row.

To make yourself an **owner** instead of a tenant, pass `{ role: 'owner' }` in the signup metadata. This is already handled in the app's auth flow.

If you need to manually promote an existing account:

```sql
UPDATE public.users SET role = 'owner' WHERE id = '<your-auth-user-id>';
```

---

## Key Design Decisions

### `auth.users` vs `public.users`

Supabase manages authentication in the `auth` schema (not accessible via the public API). Our application data lives in `public.users`.

| Table | Managed by | Contains |
|---|---|---|
| `auth.users` | Supabase Auth | Login credentials, OAuth tokens, email verification |
| `public.users` | Our migrations | Name, phone, role, onboarding status |

The two are linked by `public.users.id = auth.users.id` (FK with `ON DELETE CASCADE`).

### The `handle_new_user` Trigger

**Every** table in this schema ultimately references `public.users` through a foreign key chain. If `public.users` doesn't have a row for a user, **all** writes (rooms, contracts, invoices, reports) will fail with a FK violation.

The trigger solves this automatically:

```sql
-- Fires AFTER INSERT on auth.users
-- Works for: email/password, OAuth (Google, etc.), magic links, invites
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

The function reads `raw_user_meta_data` from the auth signup payload:
- `name` → used as the user's display name (falls back to email prefix)
- `role` → cast to `user_role` enum (`'owner'` or `'tenant'`, defaults to `'tenant'`)

### Row-Level Security (RLS)

All tables have RLS enabled. The general pattern is:

- **Owners** can read/write all rows they own (matched via `owner_id = auth.uid()`)
- **Tenants** can only read their own rows (matched via `tenant_id = auth.uid()`)
- **Edge Functions** that need to write across ownership boundaries use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)

### Edge Functions

| Function | Trigger | What it does |
|---|---|---|
| `monthly-report` | Manual (button in UI) | Aggregates rooms + paid invoices into a `reports` snapshot for a given month |
| `generate-invoices` | pg_cron (1st of month) | Creates `invoices` rows for all active contracts |

Both functions:
1. Verify the caller's JWT via `auth.getUser()`
2. Use the **service role key** for writes (to bypass RLS on internal tables)
3. Use the **user client** for reads (so RLS naturally scopes data to the owner)

---

## Environment Variables

These are **automatically injected** by Supabase into every Edge Function — no manual secret setup needed:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Project API URL |
| `SUPABASE_ANON_KEY` | Public anon key (use for user-scoped reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Full-access key (use for internal writes only, never expose to client) |
| `SUPABASE_DB_URL` | Direct Postgres connection string |

---

## Common Issues

### FK violation: `Key (owner_id)=(...) is not present in table "users"`
Your `auth.users` account exists but `public.users` is missing a row. Either:
- The `on_auth_user_created` trigger wasn't deployed when you signed up
- You manually created the auth user without going through the signup flow

**Fix:** Run the INSERT manually in SQL Editor:
```sql
INSERT INTO public.users (id, email, name, role)
SELECT id, email, split_part(email, '@', 1), 'owner'
FROM auth.users
WHERE id = '<your-user-id>'
ON CONFLICT (id) DO NOTHING;
```

### Edge Function returns 400
Check the function logs in Supabase Dashboard → Edge Functions → [function] → Logs. The functions emit `[function-name] Step X:` log lines at each stage to pinpoint the failure.
