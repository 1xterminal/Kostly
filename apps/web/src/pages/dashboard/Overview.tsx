import { useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BedDouble,
  ClipboardList,
  DoorOpen,
  FileClock,
  Plus,
  ReceiptText,
  Ticket,
} from 'lucide-react'
import { getDashboardSummary, dashboardKeys, type DashboardAlert, type DashboardChartPoint } from '@/api/dashboard'
import { useSidebarHeader } from '@/components/layout/sidebar-context'

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
  month: 'short',
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

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `IDR ${compactCurrencyFormatter.format(value / 1_000_000)}M`
  return `IDR ${compactCurrencyFormatter.format(value / 1_000)}K`
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
  max,
  yLabels,
}: {
  data: DashboardChartPoint[]
  max: number
  yLabels: string[]
}) {
  const width = 620
  const height = 210
  const padding = { top: 8, right: 10, bottom: 36, left: 72 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const chartData = data.length > 1
    ? data
    : data.length === 1
      ? [data[0], { label: '', value: data[0].value }]
      : [{ label: '', value: 0 }, { label: '', value: 0 }]
  const stepX = chartWidth / (chartData.length - 1)
  const range = Math.max(1, max)

  const points = chartData.map((point, index) => {
    const x = padding.left + index * stepX
    const y = padding.top + chartHeight - (Math.min(point.value, max) / range) * chartHeight
    return { ...point, x, y }
  })
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly revenue trend">
      {yLabels.map((label, index) => {
        const y = padding.top + (chartHeight / (yLabels.length - 1)) * index
        return (
          <text key={`${label}-${index}`} x={0} y={y + 6} className="fill-[#858585] text-[14px]">
            {label}
          </text>
        )
      })}

      {Array.from({ length: 6 }, (_, index) => {
        const x = padding.left + (chartWidth / 5) * index
        return (
          <line key={index} x1={x} y1={padding.top} x2={x} y2={padding.top + chartHeight} stroke="#DADADA" strokeWidth="1" />
        )
      })}

      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#111111" strokeWidth="2" />
      <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#111111" strokeWidth="2" />
      <path d={path} fill="none" stroke="#3045AF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((point) => (
        point.label ? (
          <text key={point.label} x={point.x} y={height - 8} textAnchor={point.x === points[0].x ? 'start' : point.x === points[points.length - 1].x ? 'end' : 'middle'} className="fill-[#858585] text-[13px]">
            {point.label}
          </text>
        ) : null
      ))}
    </svg>
  )
}

function KpiCard({
  title,
  value,
  detail,
  icon,
  tone = 'neutral',
}: {
  title: string
  value: string
  detail: string
  icon: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
}) {
  const toneClass = {
    neutral: 'bg-[#EEF2FF] text-[#3045AF]',
    good: 'bg-[#EAFBF3] text-[#00895E]',
    warn: 'bg-[#FFF5E8] text-[#B86A00]',
    danger: 'bg-[#FDEDEC] text-[#D6420F]',
  }[tone]

  return (
    <section className="rounded-lg border border-[#D4D4D4] bg-[#FAFAFA] px-5 py-4 shadow-[0_2px_5px_rgba(0,0,0,0.14)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-bold uppercase text-[#6F7785]">{title}</h2>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}>{icon}</span>
      </div>
      <p className="text-[30px] font-bold leading-none text-[#0F0F0F]">{value}</p>
      <p className="mt-2 text-[15px] font-medium text-[#6F7785]">{detail}</p>
    </section>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#D4D4D4] bg-[#FAFAFA] shadow-[0_2px_5px_rgba(0,0,0,0.14)]">
      <header className="border-b border-[#D4D4D4] px-5 py-4">
        <h2 className="text-[18px] font-bold uppercase text-[#6F7785]">{title}</h2>
      </header>
      {children}
    </section>
  )
}

function EmptyPanelMessage({ children }: { children: string }) {
  return <div className="px-5 py-7 text-[16px] font-medium text-[#858585]">{children}</div>
}

function AlertBadge({ tone }: { tone: DashboardAlert['tone'] }) {
  const className = {
    danger: 'bg-[#FDEDEC] text-[#D6420F]',
    warning: 'bg-[#FFF5E8] text-[#B86A00]',
    info: 'bg-[#EEF2FF] text-[#3045AF]',
  }[tone]

  return <span className={`h-3 w-3 rounded-full ${className}`} />
}

function RoomBar({ label, value, total, className }: { label: string; value: number; total: number; className: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[15px] font-bold text-[#111111]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#E4E4E4]">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default function Overview() {
  const navigate = useNavigate()
  const { setActions } = useSidebarHeader()
  const dashboardQuery = useQuery({ queryKey: dashboardKeys.summary, queryFn: getDashboardSummary })
  const summary = dashboardQuery.data

  useEffect(() => {
    setActions(
      <>
        <HeaderButton onClick={() => navigate('/dashboard/reports')}>Generate Report</HeaderButton>
        <HeaderButton onClick={() => navigate('/dashboard/tenants')}>Onboard Tenant</HeaderButton>
      </>,
    )

    return () => setActions(null)
  }, [navigate, setActions])

  const occupancyRate = summary && summary.rooms.total > 0
    ? Math.round((summary.rooms.occupied / summary.rooms.total) * 100)
    : 0
  const revenueMax = useMemo(() => {
    const values = summary?.revenue.trend.map((point) => point.value) ?? []
    return Math.max(10_000, Math.ceil(Math.max(...values, 0) / 10_000) * 10_000)
  }, [summary?.revenue.trend])
  const revenueLabels = useMemo(() => (
    Array.from({ length: 5 }, (_, index) => {
      const value = revenueMax - (revenueMax / 4) * index
      return formatCompactCurrency(value)
    })
  ), [revenueMax])

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-lg border border-[#F0B4A4] bg-[#FFF6F3] px-5 py-4 text-[16px] font-semibold text-[#D6420F]">
        Failed to load dashboard: {dashboardQuery.error.message}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          title="Monthly Revenue"
          value={currencyFormatter.format(summary?.revenue.currentMonthTotal ?? 0)}
          detail="Paid invoices this month"
          icon={<ReceiptText className="h-5 w-5" />}
          tone="good"
        />
        <KpiCard
          title="Occupancy"
          value={`${occupancyRate}%`}
          detail={`${summary?.rooms.occupied ?? 0}/${summary?.rooms.total ?? 0} rooms occupied`}
          icon={<BedDouble className="h-5 w-5" />}
        />
        <KpiCard
          title="Available Rooms"
          value={`${summary?.rooms.available ?? 0}`}
          detail={`${summary?.rooms.maintenance ?? 0} in maintenance`}
          icon={<DoorOpen className="h-5 w-5" />}
          tone="good"
        />
        <KpiCard
          title="Unpaid / Overdue"
          value={`${summary?.invoices.unpaid ?? 0} / ${summary?.invoices.overdue ?? 0}`}
          detail={`${summary?.invoices.dueSoon ?? 0} due within 7 days`}
          icon={<FileClock className="h-5 w-5" />}
          tone={(summary?.invoices.overdue ?? 0) > 0 ? 'danger' : 'warn'}
        />
        <KpiCard
          title="Pending Proofs"
          value={`${summary?.payments.pendingVerification ?? 0}`}
          detail="Payment proofs to review"
          icon={<ClipboardList className="h-5 w-5" />}
          tone={(summary?.payments.pendingVerification ?? 0) > 0 ? 'warn' : 'neutral'}
        />
        <KpiCard
          title="Open Maintenance"
          value={`${summary?.maintenance.open ?? 0}`}
          detail={`${summary?.maintenance.stale ?? 0} open over 24h`}
          icon={<Ticket className="h-5 w-5" />}
          tone={(summary?.maintenance.stale ?? 0) > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel title="Revenue Overview">
          <div className="h-[220px] px-5 pb-4 pt-5">
            {dashboardQuery.isLoading ? (
              <EmptyPanelMessage>Loading revenue trend...</EmptyPanelMessage>
            ) : summary?.revenue.trend.some((point) => point.value > 0) ? (
              <LineChart data={summary.revenue.trend} max={revenueMax} yLabels={revenueLabels} />
            ) : (
              <EmptyPanelMessage>No revenue recorded yet. Verified paid invoices will appear here.</EmptyPanelMessage>
            )}
          </div>
        </Panel>

        <Panel title="Room Snapshot">
          <div className="grid gap-5 px-5 py-5">
            <RoomBar label="Occupied" value={summary?.rooms.occupied ?? 0} total={summary?.rooms.total ?? 0} className="bg-[#3045AF]" />
            <RoomBar label="Available" value={summary?.rooms.available ?? 0} total={summary?.rooms.total ?? 0} className="bg-[#00895E]" />
            <RoomBar label="Maintenance" value={summary?.rooms.maintenance ?? 0} total={summary?.rooms.total ?? 0} className="bg-[#D6420F]" />
            <div className="rounded-lg bg-[#F1F1F1] px-4 py-3 text-[15px] font-semibold text-[#6F7785]">
              {summary?.tenants.active ?? 0} active tenants · {summary?.tenants.needsOnboarding ?? 0} need onboarding · {summary?.tenants.archived ?? 0} archived
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <Panel title="Payment Verifications">
          {summary?.payments.pendingItems.length ? (
            summary.payments.pendingItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate('/dashboard/payments')}
                className="block w-full border-b border-[#DDDDDD] px-5 py-4 text-left transition-colors hover:bg-white"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-[18px] font-bold text-[#0F0F0F]">Invoice {shortId(item.invoiceId)}</h3>
                  <span className="text-[14px] font-semibold text-[#858585]">{formatAge(item.createdAt)}</span>
                </div>
                <p className="text-[15px] font-medium text-[#111111]">{item.tenant}</p>
                <p className="text-[14px] text-[#6F7785]">{currencyFormatter.format(item.amount)} · due {formatDate(item.dueDate)}</p>
              </button>
            ))
          ) : (
            <EmptyPanelMessage>{dashboardQuery.isLoading ? 'Loading payment proofs...' : 'No payment proofs waiting for review.'}</EmptyPanelMessage>
          )}
        </Panel>

        <Panel title="Active Maintenance">
          {summary?.maintenance.latestOpen.length ? (
            summary.maintenance.latestOpen.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate('/dashboard/maintenance')}
                className="block w-full border-b border-[#DDDDDD] px-5 py-4 text-left transition-colors hover:bg-white"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-[18px] font-bold text-[#0F0F0F]">{item.title}</h3>
                  <span className="text-[14px] font-semibold text-[#858585]">{formatAge(item.createdAt)}</span>
                </div>
                <p className="text-[15px] font-medium text-[#111111]">Room #{item.roomNumber} · {item.reporter}</p>
                <p className="text-[14px] font-bold uppercase text-[#D6420F]">{item.status.replace('_', ' ')}</p>
              </button>
            ))
          ) : (
            <EmptyPanelMessage>{dashboardQuery.isLoading ? 'Loading maintenance tickets...' : 'No active maintenance tickets.'}</EmptyPanelMessage>
          )}
        </Panel>

        <Panel title="Expiring Contracts">
          {summary?.contracts.expiringItems.length ? (
            summary.contracts.expiringItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate('/dashboard/tenants')}
                className="block w-full border-b border-[#DDDDDD] px-5 py-4 text-left transition-colors hover:bg-white"
              >
                <h3 className="mb-2 text-[18px] font-bold text-[#0F0F0F]">{item.tenant}</h3>
                <p className="text-[15px] font-medium text-[#111111]">Room #{item.roomNumber}</p>
                <p className="text-[14px] text-[#6F7785]">Ends {formatDate(item.endDate)}</p>
              </button>
            ))
          ) : (
            <EmptyPanelMessage>{dashboardQuery.isLoading ? 'Loading contracts...' : 'No contracts expiring within 30 days.'}</EmptyPanelMessage>
          )}
        </Panel>

        <Panel title="Alerts">
          {summary?.alerts.length ? (
            summary.alerts.map((alert) => (
              <article key={alert.id} className="border-b border-[#DDDDDD] px-5 py-4">
                <div className="mb-2 flex items-center gap-3">
                  <AlertBadge tone={alert.tone} />
                  <h3 className="text-[17px] font-bold text-[#0F0F0F]">{alert.title}</h3>
                </div>
                <p className="text-[15px] font-medium text-[#6F7785]">{alert.detail}</p>
              </article>
            ))
          ) : (
            <EmptyPanelMessage>{dashboardQuery.isLoading ? 'Loading alerts...' : 'No urgent alerts.'}</EmptyPanelMessage>
          )}
        </Panel>
      </div>

      {dashboardQuery.isFetching && !dashboardQuery.isLoading ? (
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[#6F7785]">
          <AlertCircle className="h-4 w-4" />
          Refreshing live dashboard data...
        </div>
      ) : null}
    </div>
  )
}
