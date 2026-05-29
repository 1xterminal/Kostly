-- =============================================================
-- kostly · allow_multiple_reports_per_month.sql
-- Reports are generated snapshots. Owners may generate more than
-- one snapshot for the same month, so month_year cannot be unique.
-- =============================================================

alter table public.reports
  drop constraint if exists reports_owner_id_month_year_key;
