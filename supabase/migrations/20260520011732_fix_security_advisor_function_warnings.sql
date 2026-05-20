-- =============================================================
-- kostly · fix_security_advisor_function_warnings.sql
-- Resolves Supabase Security Advisor warnings for legacy public
-- SECURITY DEFINER helpers and mutable search_path functions.
-- =============================================================

-- Public helper is no longer referenced by current policies, but old projects
-- may still have it from the initial RLS migration. Lock it down and pin path.
create or replace function public.is_owner()
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

revoke all on function public.is_owner() from public;
revoke all on function public.is_owner() from anon;
revoke all on function public.is_owner() from authenticated;

-- Trigger helper: internal only, no API/RPC execution needed.
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

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- updated_at trigger helper does not need SECURITY DEFINER, but needs fixed path.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Cron caller must stay SECURITY DEFINER so pg_cron can read Vault and call pg_net,
-- but it should not be callable through the public REST RPC surface.
create or replace function public.call_generate_invoices()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _service_role_key text;
  _url              text := 'https://hacurygvlcnhfdosktfe.supabase.co/functions/v1/generate-invoices';
begin
  select decrypted_secret
  into   _service_role_key
  from   vault.decrypted_secrets
  where  name = 'service_role_key'
  limit  1;

  if _service_role_key is null then
    raise exception 'service_role_key not found in Vault';
  end if;

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

revoke all on function public.call_generate_invoices() from public;
revoke all on function public.call_generate_invoices() from anon;
revoke all on function public.call_generate_invoices() from authenticated;
grant execute on function public.call_generate_invoices() to postgres;
