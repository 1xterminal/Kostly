import { useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useSidebarHeader } from '@/components/layout/sidebar-context'
import { supabase } from '@/lib/supabase'

type ChartPoint = {
  label: string
  value: number
}

type MaintenanceItem = {
  title: string
  reporter: string
  age: string
  id: string
}

type QueueItem = {
  invoice: string
  submitter: string
  date: string
}

type ReportRow = {
  month_year: string
  total_revenue: number
  occupancy_rate: number
}

type MaintenanceRowData = {
  id: string
  description: string
  ticket_status: string
  created_at: string
  reporter: { name: string } | null
}

type PaymentRowData = {
  id: string
  created_at: string
  invoice: { id: string; due_date: string } | null
  tenant: { name: string } | null
}

type InvoiceRowData = {
  id: string
  due_date: string
  tenant: { name: string } | null
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
})

function formatDate(value: string | null | undefined) {
  if (!value) return 'No date'
  return dateFormatter.format(new Date(value))
}

function formatAge(value: string) {
  const createdAt = new Date(value).getTime()
  const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000))
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

function shortId(id: string) {
  return `#${id.slice(0, 4).toUpperCase()}`
}

async function getDashboardReports(): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('month_year,total_revenue,occupancy_rate')
    .order('month_year', { ascending: false })
    .limit(6)

  if (error) throw error
  return [...(data ?? [])].reverse().map((report) => ({
    month_year: report.month_year,
    total_revenue: Number(report.total_revenue),
    occupancy_rate: Number(report.occupancy_rate),
  }))
}

async function getActiveMaintenance(): Promise<MaintenanceRowData[]> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select(`
      id,
      description,
      ticket_status,
      created_at,
      reporter:users!maintenance_tickets_reported_by_user_id_fkey ( name )
    `)
    .in('ticket_status', ['reported', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data ?? []
}

async function getPendingVerifications(): Promise<PaymentRowData[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      created_at,
      invoice:invoices ( id, due_date ),
      tenant:users!payments_tenant_id_fkey ( name )
    `)
    .eq('status', 'not_verified')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data ?? []
}

async function getInvoiceAlerts(): Promise<InvoiceRowData[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      due_date,
      tenant:users!invoices_tenant_id_fkey ( name )
    `)
    .in('status', ['unpaid', 'pending'])
    .order('due_date', { ascending: true })
    .limit(5)

  if (error) throw error
  return data ?? []
}

function HeaderButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-3 rounded-lg border border-[#9AA7DE] bg-transparent px-4 text-[18px] font-bold text-[#3045AF] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9AA7DE] focus:ring-offset-2"
    >
      <Plus className="h-5 w-5 stroke-[2.5]" />
      <span>{children}</span>
    </button>
  )
}

function LineChart({
  data,
  min,
  max,
  yLabels,
}: {
  data: ChartPoint[]
  min: number
  max: number
  yLabels: string[]
}) {
  const width = 620
  const height = 250
  const padding = { top: 8, right: 10, bottom: 42, left: 62 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const chartData = data.length > 1
    ? data
    : data.length === 1
      ? [data[0], { label: '', value: data[0].value }]
      : [{ label: '', value: min }, { label: '', value: min }]
  const stepX = chartWidth / (chartData.length - 1)

  const points = chartData.map((point, index) => {
    const x = padding.left + index * stepX
    const y = padding.top + chartHeight - ((point.value - min) / (max - min)) * chartHeight
    return { ...point, x, y }
  })

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Dashboard line chart">
      {yLabels.map((label, index) => {
        const y = padding.top + (chartHeight / (yLabels.length - 1)) * index
        return (
          <text key={label} x={0} y={y + 6} className="fill-[#858585] text-[15px]">
            {label}
          </text>
        )
      })}

      {Array.from({ length: 11 }, (_, index) => {
        const x = padding.left + (chartWidth / 10) * index
        return (
          <line key={index} x1={x} y1={padding.top} x2={x} y2={padding.top + chartHeight} stroke="#D3D3D3" strokeWidth="1" />
        )
      })}

      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#111111" strokeWidth="2.5" />
      <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#111111" strokeWidth="2.5" />
      <path d={path} fill="none" stroke="#3045AF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((point) => (
        point.label ? (
          <text key={point.label} x={point.x} y={height - 10} textAnchor={point.x === points[0].x ? 'start' : point.x === points[points.length - 1].x ? 'end' : 'middle'} className="fill-[#858585] text-[15px]">
            {point.label}
          </text>
        ) : null
      ))}
    </svg>
  )
}

function MetricCard({
  title,
  value,
  children,
}: {
  title: string
  value: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-[#C8C8C8] bg-[#FAFAFA] px-5 pb-4 pt-5 shadow-[0_2px_5px_rgba(0,0,0,0.18)]">
      <h2 className="mb-2 text-[18px] font-bold uppercase tracking-[0.04em] text-[#858585]">{title}</h2>
      <p className="mb-4 text-[30px] font-bold leading-none text-[#0F0F0F]">{value}</p>
      <div className="h-[250px]">
        {children}
      </div>
    </section>
  )
}

function ListPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-h-[520px] rounded-lg border border-[#C8C8C8] bg-[#FAFAFA] shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
      <header className="border-b border-[#C8C8C8] px-5 py-4">
        <h2 className="text-[18px] font-bold uppercase tracking-[0.04em] text-[#858585]">{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  )
}

function MaintenanceRow({ item }: { item: MaintenanceItem }) {
  return (
    <article className="border-b border-[#DDDDDD] px-5 py-5">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[24px] font-bold leading-tight text-[#0F0F0F]">{item.title}</h3>
          <p className="text-[18px] leading-tight text-[#111111]">
            Reported by <strong>{item.reporter}</strong>
          </p>
        </div>
        <span className="shrink-0 text-[17px] text-[#858585]">{item.age}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold uppercase tracking-[0.12em] text-[#D6420F]">Unresolved</span>
        <span className="text-[18px] font-bold text-[#858585]">{item.id}</span>
      </div>
    </article>
  )
}

function QueueRow({ item }: { item: QueueItem }) {
  return (
    <article className="border-b border-[#DDDDDD] px-5 py-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-[22px] font-bold leading-tight text-[#0F0F0F]">{item.invoice}</h3>
        <span className="shrink-0 text-[17px] text-[#858585]">{item.date}</span>
      </div>
      <p className="text-[18px] text-[#111111]">
        Submitted by <strong>{item.submitter}</strong>
      </p>
    </article>
  )
}

function EmptyPanelMessage({ children }: { children: string }) {
  return (
    <div className="px-5 py-8 text-[16px] font-medium text-[#858585]">
      {children}
    </div>
  )
}

export default function Overview() {
  const navigate = useNavigate()
  const { setActions } = useSidebarHeader()
  const reportsQuery = useQuery({ queryKey: ['dashboard', 'reports'], queryFn: getDashboardReports })
  const maintenanceQuery = useQuery({ queryKey: ['dashboard', 'maintenance'], queryFn: getActiveMaintenance })
  const paymentsQuery = useQuery({ queryKey: ['dashboard', 'pending-payments'], queryFn: getPendingVerifications })
  const alertsQuery = useQuery({ queryKey: ['dashboard', 'invoice-alerts'], queryFn: getInvoiceAlerts })

  useEffect(() => {
    setActions(
      <>
        <HeaderButton onClick={() => navigate('/dashboard/reports')}>Generate Report</HeaderButton>
        <HeaderButton onClick={() => navigate('/dashboard/tenants')}>Onboard Tenant</HeaderButton>
      </>,
    )

    return () => setActions(null)
  }, [navigate, setActions])

  const latestReport = reportsQuery.data?.at(-1)
  const revenueData = useMemo<ChartPoint[]>(() => (
    reportsQuery.data?.map((report) => ({
      label: monthFormatter.format(new Date(report.month_year)),
      value: report.total_revenue / 1000,
    })) ?? []
  ), [reportsQuery.data])

  const occupancyData = useMemo<ChartPoint[]>(() => (
    reportsQuery.data?.map((report) => ({
      label: monthFormatter.format(new Date(report.month_year)),
      value: report.occupancy_rate,
    })) ?? []
  ), [reportsQuery.data])

  const revenueMax = Math.max(6, ...revenueData.map((point) => point.value))
  const revenueStep = Math.max(1, Math.ceil(revenueMax / 5))
  const revenueAxisMax = revenueStep * 5
  const revenueLabels = Array.from({ length: 6 }, (_, index) => `IDR ${compactCurrencyFormatter.format((5 - index) * revenueStep)}K`)
  const maintenanceItems: MaintenanceItem[] = maintenanceQuery.data?.map((item) => ({
    title: item.description,
    reporter: item.reporter?.name ?? 'Unknown',
    age: formatAge(item.created_at),
    id: shortId(item.id),
  })) ?? []
  const pendingVerifications: QueueItem[] = paymentsQuery.data?.map((item) => ({
    invoice: item.invoice?.id ? shortId(item.invoice.id) : shortId(item.id),
    submitter: item.tenant?.name ?? 'Unknown',
    date: formatDate(item.created_at),
  })) ?? []
  const alerts: QueueItem[] = alertsQuery.data?.map((item) => ({
    invoice: shortId(item.id),
    submitter: item.tenant?.name ?? 'Unknown',
    date: formatDate(item.due_date),
  })) ?? []

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <MetricCard title="Total Revenue" value={currencyFormatter.format(latestReport?.total_revenue ?? 0)}>
          <LineChart data={revenueData} min={0} max={revenueAxisMax} yLabels={revenueLabels} />
        </MetricCard>

        <MetricCard title="Occupancy" value={`${Math.round(latestReport?.occupancy_rate ?? 0)}%`}>
          <LineChart data={occupancyData} min={50} max={100} yLabels={['100%', '90%', '80%', '70%', '60%', '50%']} />
        </MetricCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ListPanel title="Active Maintenance">
          {maintenanceItems.length > 0
            ? maintenanceItems.map((item) => <MaintenanceRow key={item.id} item={item} />)
            : <EmptyPanelMessage>{maintenanceQuery.isLoading ? 'Loading maintenance tickets...' : 'No active maintenance tickets.'}</EmptyPanelMessage>}
        </ListPanel>

        <ListPanel title="Pending Verifications">
          {pendingVerifications.length > 0
            ? pendingVerifications.map((item) => <QueueRow key={item.invoice} item={item} />)
            : <EmptyPanelMessage>{paymentsQuery.isLoading ? 'Loading pending payments...' : 'No pending verifications.'}</EmptyPanelMessage>}
        </ListPanel>

        <ListPanel title="Alerts">
          {alerts.length > 0
            ? alerts.map((item) => <QueueRow key={item.invoice} item={item} />)
            : <EmptyPanelMessage>{alertsQuery.isLoading ? 'Loading invoice alerts...' : 'No invoice alerts.'}</EmptyPanelMessage>}
        </ListPanel>
      </div>
    </div>
  )
}
