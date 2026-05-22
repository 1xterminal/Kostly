# CP Dashboard Sync Notes

Use this text to update CP-xxx dashboard/spec sections after the live owner dashboard change.

## Dashboard Screen Inventory

Owner dashboard shows live operational data from Supabase, not generated report snapshots. The page answers four owner questions at a glance: which rooms are available, who has not paid, what contracts need attention, and what maintenance is unresolved.

Dashboard actions:

- Generate Report: opens the Reports page for historical report generation.
- Onboard Tenant: opens the Tenants page for account creation and room assignment.

Dashboard KPI cards:

- Monthly Revenue: sum of paid invoices for the current billing month.
- Occupancy: occupied rooms divided by total rooms.
- Available Rooms: count of rooms with status `available`, plus rooms in maintenance.
- Unpaid / Overdue: unpaid invoices and overdue unpaid/pending invoices.
- Pending Proofs: payment proofs waiting for owner verification.
- Open Maintenance: reported/in-progress maintenance tickets, plus stale tickets open for more than 24 hours.

Dashboard panels:

- Revenue Overview: six-month paid-invoice trend with unique month labels.
- Room Snapshot: occupied, available, and maintenance room distribution.
- Payment Verifications: latest payment proof submissions that need review.
- Active Maintenance: latest unresolved maintenance tickets with room and reporter.
- Expiring Contracts: active contracts ending within 30 days.
- Alerts: generated from overdue invoices, pending verifications, expiring contracts, and stale maintenance.

## FR Mapping Update

- FR-02 Room Inventory: Dashboard reflects room availability, occupancy, and maintenance counts from `rooms.status`.
- FR-03 Tenant Lifecycle: Dashboard reflects active tenants, tenants needing onboarding, archived tenants, and contracts expiring soon.
- FR-04 Digital Payment & Verification: Dashboard reflects unpaid invoices, overdue invoices, due-soon invoices, and pending payment proof review.
- FR-05 Maintenance Ticketing: Dashboard reflects open maintenance tickets and stale unresolved tickets.
- FR-06 Financial & Occupancy Analytics: Dashboard uses live queries for operational metrics; generated Reports remain historical snapshots.

## Architecture Update

The owner dashboard reads live data directly from Supabase tables using the React Supabase client and owner-protected RLS policies. No custom server or Edge Function is required for dashboard cards and queues. Edge Functions remain scoped to operations that need privileged business logic, such as automated invoice generation, tenant account creation, payment submission transactions, and contract extension review.

## Manual Demo Script

1. Log in to the web app as owner.
2. Open Dashboard and confirm KPI cards load: Monthly Revenue, Occupancy, Available Rooms, Unpaid / Overdue, Pending Proofs, Open Maintenance.
3. Change a room status and return to Dashboard; room snapshot and occupancy should update.
4. Submit a tenant payment proof from mobile; Dashboard Pending Proofs should increase.
5. Approve or reject the proof on Web Payments; Pending Proofs should decrease.
6. Create or view an unresolved maintenance ticket; Dashboard Active Maintenance should list it.
7. Confirm contracts ending within 30 days appear in Expiring Contracts.
8. Click Generate Report to open historical Reports; dashboard live metrics remain separate from report snapshots.

## Acceptance Criteria

- Dashboard does not show duplicate month labels when multiple reports exist for the same month because revenue trend no longer depends on `reports`.
- Empty states explain what data will appear later.
- Owner can drill down from dashboard panels to Payments, Maintenance, Tenants, and Reports.
- No mobile screen changes are required by this dashboard update.
