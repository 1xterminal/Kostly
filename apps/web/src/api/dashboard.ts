import { supabase } from '@/lib/supabase'

export type DashboardChartPoint = {
  label: string
  value: number
}

export type DashboardMaintenanceItem = {
  id: string
  shortId: string
  title: string
  reporter: string
  roomNumber: string
  status: 'reported' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
}

export type DashboardPaymentItem = {
  id: string
  shortId: string
  invoiceId: string
  tenant: string
  amount: number
  dueDate: string
  createdAt: string
}

export type DashboardContractItem = {
  id: string
  tenant: string
  roomNumber: string
  endDate: string
}

export type DashboardAlert = {
  id: string
  title: string
  detail: string
  tone: 'danger' | 'warning' | 'info'
}

export type DashboardSummary = {
  rooms: {
    total: number
    occupied: number
    available: number
    maintenance: number
  }
  tenants: {
    active: number
    needsOnboarding: number
    archived: number
  }
  revenue: {
    currentMonthTotal: number
    trend: DashboardChartPoint[]
  }
  invoices: {
    unpaid: number
    overdue: number
    dueSoon: number
  }
  payments: {
    pendingVerification: number
    pendingItems: DashboardPaymentItem[]
  }
  maintenance: {
    open: number
    stale: number
    latestOpen: DashboardMaintenanceItem[]
  }
  contracts: {
    expiringSoon: number
    expiringItems: DashboardContractItem[]
  }
  alerts: DashboardAlert[]
}

export const dashboardKeys = {
  summary: ['dashboard', 'summary'] as const,
}

type RoomStatusRow = { status: 'available' | 'occupied' | 'maintenance' }
type TenantStatusRow = { tenant_status: 'active' | 'archived' | null; onboarding: boolean | null }
type InvoiceRow = { id: string; billing_month: string; due_date: string; status: 'unpaid' | 'pending' | 'paid'; total_amount: number }
type MaintenanceRow = {
  id: string
  description: string
  ticket_status: 'reported' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  reporter: { name: string } | null
  room: { number: string } | null
}
type PaymentRow = {
  id: string
  created_at: string
  invoice_id: string
  invoice: { id: string; due_date: string; total_amount: number } | null
  tenant: { name: string } | null
}
type ContractRow = {
  id: string
  end_date: string
  tenant: { name: string } | null
  room: { number: string } | null
}

const monthLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
})

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1))
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

function shortId(id: string) {
  return `#${id.slice(0, 4).toUpperCase()}`
}

function monthKey(date: Date) {
  return toDateString(startOfMonth(date))
}

function buildSixMonthBuckets(now: Date) {
  const currentMonth = startOfMonth(now)
  return Array.from({ length: 6 }, (_, index) => addMonths(currentMonth, index - 5))
}

function buildAlerts(summary: Omit<DashboardSummary, 'alerts'>): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  if (summary.invoices.overdue > 0) {
    alerts.push({
      id: 'overdue-invoices',
      title: `${summary.invoices.overdue} overdue invoice${summary.invoices.overdue === 1 ? '' : 's'}`,
      detail: 'Payment due date already passed.',
      tone: 'danger',
    })
  }

  if (summary.payments.pendingVerification > 0) {
    alerts.push({
      id: 'pending-verifications',
      title: `${summary.payments.pendingVerification} payment proof${summary.payments.pendingVerification === 1 ? '' : 's'} waiting`,
      detail: 'Review proof uploads from tenants.',
      tone: 'warning',
    })
  }

  if (summary.contracts.expiringSoon > 0) {
    alerts.push({
      id: 'expiring-contracts',
      title: `${summary.contracts.expiringSoon} contract${summary.contracts.expiringSoon === 1 ? '' : 's'} expiring soon`,
      detail: 'Active contract ends within 30 days.',
      tone: 'warning',
    })
  }

  if (summary.maintenance.stale > 0) {
    alerts.push({
      id: 'stale-maintenance',
      title: `${summary.maintenance.stale} stale maintenance ticket${summary.maintenance.stale === 1 ? '' : 's'}`,
      detail: 'Open for more than 24 hours.',
      tone: 'info',
    })
  }

  return alerts
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date()
  const today = toDateString(now)
  const dueSoonDate = toDateString(addDays(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())), 7))
  const expiringDate = toDateString(addDays(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())), 30))
  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const monthBuckets = buildSixMonthBuckets(now)
  const firstTrendMonth = monthKey(monthBuckets[0])
  const nextMonth = toDateString(addMonths(startOfMonth(now), 1))
  const currentMonth = monthKey(now)

  const [
    roomsResult,
    tenantsResult,
    revenueResult,
    invoiceResult,
    maintenanceResult,
    staleMaintenanceResult,
    paymentsResult,
    contractsResult,
  ] = await Promise.all([
    supabase.from('rooms').select('status'),
    supabase.from('users').select('tenant_status,onboarding').eq('role', 'tenant'),
    supabase
      .from('invoices')
      .select('id,billing_month,due_date,status,total_amount')
      .eq('status', 'paid')
      .gte('billing_month', firstTrendMonth)
      .lt('billing_month', nextMonth),
    supabase
      .from('invoices')
      .select('id,billing_month,due_date,status,total_amount')
      .in('status', ['unpaid', 'pending']),
    supabase
      .from('maintenance_tickets')
      .select(`
        id,
        description,
        ticket_status,
        created_at,
        reporter:users!maintenance_tickets_reported_by_user_id_fkey ( name ),
        room:rooms!maintenance_tickets_room_id_fkey ( number )
      `, { count: 'exact' })
      .in('ticket_status', ['reported', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('maintenance_tickets')
      .select('id', { count: 'exact', head: true })
      .in('ticket_status', ['reported', 'in_progress'])
      .lte('created_at', staleCutoff),
    supabase
      .from('payments')
      .select(`
        id,
        created_at,
        invoice_id,
        invoice:invoices ( id, due_date, total_amount ),
        tenant:users!payments_tenant_id_fkey ( name )
      `, { count: 'exact' })
      .eq('status', 'not_verified')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('contracts')
      .select(`
        id,
        end_date,
        tenant:users!contracts_tenant_id_fkey ( name ),
        room:rooms!contracts_room_id_fkey ( number )
      `, { count: 'exact' })
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', expiringDate)
      .order('end_date', { ascending: true })
      .limit(5),
  ])

  const results = [
    roomsResult,
    tenantsResult,
    revenueResult,
    invoiceResult,
    maintenanceResult,
    staleMaintenanceResult,
    paymentsResult,
    contractsResult,
  ]
  const failedResult = results.find((result) => result.error)
  if (failedResult?.error) throw failedResult.error

  const rooms = (roomsResult.data ?? []) as RoomStatusRow[]
  const tenants = (tenantsResult.data ?? []) as TenantStatusRow[]
  const paidInvoices = (revenueResult.data ?? []) as InvoiceRow[]
  const openInvoices = (invoiceResult.data ?? []) as InvoiceRow[]
  const latestMaintenance = (maintenanceResult.data ?? []) as MaintenanceRow[]
  const pendingPayments = (paymentsResult.data ?? []) as PaymentRow[]
  const expiringContracts = (contractsResult.data ?? []) as ContractRow[]

  const trendByMonth = new Map(monthBuckets.map((bucket) => [monthKey(bucket), 0]))
  for (const invoice of paidInvoices) {
    trendByMonth.set(invoice.billing_month, (trendByMonth.get(invoice.billing_month) ?? 0) + Number(invoice.total_amount))
  }

  const summaryWithoutAlerts = {
    rooms: {
      total: rooms.length,
      occupied: rooms.filter((room) => room.status === 'occupied').length,
      available: rooms.filter((room) => room.status === 'available').length,
      maintenance: rooms.filter((room) => room.status === 'maintenance').length,
    },
    tenants: {
      active: tenants.filter((tenant) => tenant.tenant_status !== 'archived').length,
      needsOnboarding: tenants.filter((tenant) => tenant.tenant_status !== 'archived' && tenant.onboarding === false).length,
      archived: tenants.filter((tenant) => tenant.tenant_status === 'archived').length,
    },
    revenue: {
      currentMonthTotal: trendByMonth.get(currentMonth) ?? 0,
      trend: monthBuckets.map((bucket) => ({
        label: monthLabelFormatter.format(bucket),
        value: trendByMonth.get(monthKey(bucket)) ?? 0,
      })),
    },
    invoices: {
      unpaid: openInvoices.filter((invoice) => invoice.status === 'unpaid').length,
      overdue: openInvoices.filter((invoice) => invoice.due_date < today).length,
      dueSoon: openInvoices.filter((invoice) => invoice.due_date >= today && invoice.due_date <= dueSoonDate).length,
    },
    payments: {
      pendingVerification: paymentsResult.count ?? pendingPayments.length,
      pendingItems: pendingPayments.map((payment) => ({
        id: payment.id,
        shortId: shortId(payment.id),
        invoiceId: payment.invoice?.id ?? payment.invoice_id,
        tenant: payment.tenant?.name ?? 'Unknown tenant',
        amount: Number(payment.invoice?.total_amount ?? 0),
        dueDate: payment.invoice?.due_date ?? '',
        createdAt: payment.created_at,
      })),
    },
    maintenance: {
      open: maintenanceResult.count ?? latestMaintenance.length,
      stale: staleMaintenanceResult.count ?? 0,
      latestOpen: latestMaintenance.map((ticket) => ({
        id: ticket.id,
        shortId: shortId(ticket.id),
        title: ticket.description,
        reporter: ticket.reporter?.name ?? 'Unknown reporter',
        roomNumber: ticket.room?.number ?? 'Unassigned',
        status: ticket.ticket_status,
        createdAt: ticket.created_at,
      })),
    },
    contracts: {
      expiringSoon: contractsResult.count ?? expiringContracts.length,
      expiringItems: expiringContracts.map((contract) => ({
        id: contract.id,
        tenant: contract.tenant?.name ?? 'Unknown tenant',
        roomNumber: contract.room?.number ?? 'Unassigned',
        endDate: contract.end_date,
      })),
    },
  }

  return {
    ...summaryWithoutAlerts,
    alerts: buildAlerts(summaryWithoutAlerts),
  }
}
