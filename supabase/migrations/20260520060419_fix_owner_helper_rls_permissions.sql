-- =============================================================
-- kostly · fix_owner_helper_rls_permissions.sql
-- Allows RLS policies to evaluate private.is_owner() for API roles
-- without re-exposing the legacy public.is_owner() helper.
-- =============================================================

create schema if not exists private;

grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.is_owner() to anon, authenticated, service_role;

revoke all on function public.is_owner() from public;
revoke all on function public.is_owner() from anon;
revoke all on function public.is_owner() from authenticated;

-- Force PostgREST/Data API to forget stale policy/function metadata.
notify pgrst, 'reload schema';
