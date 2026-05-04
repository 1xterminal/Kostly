-- =============================================================
-- kostly · cron_setup.sql
-- Enable pg_cron + pg_net extensions and schedule the
-- generate-invoices Edge Function to run on the 1st of each month.
--
-- ⚠  PREREQUISITES before running this:
--   1. Deploy the generate-invoices Edge Function first:
--        supabase functions deploy generate-invoices
--   2. Store your service_role key in Supabase Vault:
--        Dashboard → Vault → New secret
--        Name: service_role_key   Value: <your service role key>
--   3. Replace the placeholder URL below with your real project URL.
--      Format: https://<project-ref>.supabase.co/functions/v1/generate-invoices
--
-- Apply in Supabase Dashboard → SQL Editor (run once).
-- =============================================================

-- ─── EXTENSIONS ───────────────────────────────────────────────
create extension if not exists pg_net  with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Give the postgres role permission to use the cron schema
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- ─── CALLER FUNCTION ──────────────────────────────────────────
-- Reads the service_role key from Vault at runtime (never hard-coded).
-- Calls the generate-invoices Edge Function via HTTP POST.
create or replace function public.call_generate_invoices()
returns void language plpgsql security definer as $$
declare
  _service_role_key text;
  _url              text := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/generate-invoices';
begin
  -- Retrieve key from Vault — set this up before running the cron job
  select decrypted_secret
  into   _service_role_key
  from   vault.decrypted_secrets
  where  name = 'service_role_key'
  limit  1;

  if _service_role_key is null then
    raise exception 'service_role_key not found in Vault';
  end if;

  -- Fire-and-forget HTTP POST to the Edge Function
  perform net.http_post(
    url     := _url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    ),
    body    := '{}'::jsonb
  );
end;
$$;

-- ─── SCHEDULE WITH pg_cron ────────────────────────────────────
-- Runs at 08:00 UTC on the 1st of every month.
-- Cron expression: minute hour day-of-month month day-of-week
select cron.schedule(
  'generate-invoices-monthly',   -- job name (unique)
  '0 8 1 * *',                   -- every 1st of the month at 08:00 UTC
  $$ select public.call_generate_invoices(); $$
);

-- ─── VERIFY ───────────────────────────────────────────────────
-- Uncomment to confirm the job was registered:
-- select jobid, jobname, schedule, command from cron.job;
--
-- Monitor run history in:
--   Dashboard → Integrations → Cron → Job run details
-- or:
-- select * from cron.job_run_details order by start_time desc limit 20;
