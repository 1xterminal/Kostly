-- =============================================================
-- kostly · fix_monthly_report_upsert_constraint.sql
-- monthly-report upserts by (owner_id, month_year). Restore the
-- matching uniqueness after removing old duplicate snapshots.
-- =============================================================

with ranked_reports as (
  select
    id,
    row_number() over (
      partition by owner_id, month_year
      order by created_at desc, id desc
    ) as row_rank
  from public.reports
)
delete from public.reports
using ranked_reports
where reports.id = ranked_reports.id
  and ranked_reports.row_rank > 1;

alter table public.reports
  add constraint reports_owner_id_month_year_key
  unique (owner_id, month_year);
