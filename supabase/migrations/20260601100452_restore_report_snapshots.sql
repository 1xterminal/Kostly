-- =============================================================
-- kostly · restore_report_snapshots.sql
-- Reports are generated snapshots, not one mutable monthly row.
-- Owners can generate multiple reports for the same reporting month
-- as data changes during the month.
-- =============================================================

alter table public.reports
  drop constraint if exists reports_owner_id_month_year_key;
