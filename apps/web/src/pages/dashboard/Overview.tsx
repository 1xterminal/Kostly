import { useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  BedDouble,
  ClipboardList,
  DoorOpen,
  FileClock,
  ReceiptText,
  Ticket,
} from 'lucide-react'
import { getDashboardSummary, dashboardKeys, type DashboardAlert, type DashboardChartPoint } from '@/api/dashboard'
import { useSidebarHeader } from '@/components/layout/sidebar-context'
import Button from "@/components/ui/Button";
import { Symbols } from "@/components/ui/MaterialSymbols";

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

// function HeaderButton({
//   children,
//   onClick,
// }: {
//   children: string;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className="inline-flex h-11 items-center gap-3 rounded-lg border border-[#9AA7DE] bg-transparent px-4 text-[18px] font-bold text-[#3045AF] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9AA7DE] focus:ring-offset-2"
//     >
//       <Plus className="h-5 w-5 stroke-[2.5]" />
//       <span>{children}</span>
//     </button>
//   );
// }

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
    neutral: 'text-[#111111]',
    good: 'text-[#00895E]',
    warn: 'text-[#B86A00]',
    danger: 'text-[#D6420F]',
  }[tone]

  return (
    <section className="min-h-[148px] rounded-lg border border-[#D4D4D4] bg-[#FAFAFA] px-5 py-4 shadow-[0_2px_5px_rgba(0,0,0,0.14)]">
      <span className={`mb-3 grid h-7 w-7 place-items-center ${toneClass}`}>{icon}</span>
      <h2 className="mb-7 text-[14px] font-bold uppercase tracking-wide text-[#858585]">{title}</h2>
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

type RoomCounts = {
  total: number
  occupied: number
  available: number
  maintenance: number
}

type TenantCounts = {
  active: number
  needsOnboarding: number
  archived: number
}

type SnapshotStatus = 'occupied' | 'available' | 'maintenance' | 'empty'

const snapshotTileCount = 8

const roomStatusMeta: Record<SnapshotStatus, { label: string; tile: string; dot: string }> = {
  occupied: {
    label: 'Occupied',
    tile: 'bg-[#1584C4]',
    dot: 'bg-[#1584C4]',
  },
  available: {
    label: 'Available',
    tile: 'bg-[#19C867]',
    dot: 'bg-[#19C867]',
  },
  maintenance: {
    label: 'Maintenance',
    tile: 'bg-[#D7440A]',
    dot: 'bg-[#D7440A]',
  },
  empty: {
    label: 'Empty',
    tile: 'bg-[#E5E5E5]',
    dot: 'bg-[#E5E5E5]',
  },
}

function buildRoomTiles(rooms?: RoomCounts): SnapshotStatus[] {
  if (!rooms || rooms.total <= 0) return Array.from({ length: snapshotTileCount }, () => 'empty' as const)

  const entries = [
    { status: 'occupied' as const, count: rooms.occupied },
    { status: 'available' as const, count: rooms.available },
    { status: 'maintenance' as const, count: rooms.maintenance },
  ].map((entry) => {
    const raw = (entry.count / rooms.total) * snapshotTileCount
    return {
      ...entry,
      fraction: raw - Math.floor(raw),
      slots: entry.count > 0 ? Math.max(1, Math.floor(raw)) : 0,
    }
  })

  let diff = snapshotTileCount - entries.reduce((total, entry) => total + entry.slots, 0)

  while (diff > 0) {
    const target = [...entries]
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.fraction - a.fraction || b.count - a.count)[0]
    if (!target) break
    target.slots += 1
    diff -= 1
  }

  while (diff < 0) {
    const target = [...entries]
      .filter((entry) => entry.slots > 1)
      .sort((a, b) => a.fraction - b.fraction || b.slots - a.slots)[0]
    if (!target) break
    target.slots -= 1
    diff += 1
  }

  const tiles = entries.flatMap((entry) => Array.from({ length: entry.slots }, () => entry.status))
  return [...tiles, ...Array.from({ length: snapshotTileCount }, () => 'empty' as const)].slice(0, snapshotTileCount)
}

function RoomSnapshotPanel({
  rooms,
  tenants,
}: {
  rooms?: RoomCounts
  tenants?: TenantCounts
}) {
  const tiles = buildRoomTiles(rooms)
  const roomStats = [
    { status: 'occupied' as const, value: rooms?.occupied ?? 0 },
    { status: 'available' as const, value: rooms?.available ?? 0 },
    { status: 'maintenance' as const, value: rooms?.maintenance ?? 0 },
  ]
  const tenantStats = [
    { label: 'Active', value: tenants?.active ?? 0 },
    { label: 'Onboarding', value: tenants?.needsOnboarding ?? 0 },
    { label: 'Archived', value: tenants?.archived ?? 0 },
  ]

  return (
    <div>
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-[minmax(128px,176px)_1fr]">
        <div className="grid grid-cols-4 gap-1.5">
          {tiles.map((status, index) => (
            <span
              key={`${status}-${index}`}
              className={`aspect-square min-h-0 rounded-md ${roomStatusMeta[status].tile}`}
              aria-label={roomStatusMeta[status].label}
            />
          ))}
        </div>

        <div className="grid content-center gap-3">
          {roomStats.map((stat) => (
            <div key={stat.status} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[#858585]">
              <span className={`h-4 w-4 rounded-full ${roomStatusMeta[stat.status].dot}`} />
              <span className="text-[17px] font-medium">{roomStatusMeta[stat.status].label}</span>
              <span className="text-[18px] font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#D4D4D4]">
        <header className="border-b border-[#D4D4D4] px-5 py-4">
          <h3 className="text-[18px] font-bold uppercase tracking-wide text-[#858585]">Tenant Snapshot</h3>
        </header>
        <div className="grid grid-cols-3 gap-2 px-5 py-5">
          {tenantStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[34px] font-bold leading-none text-[#858585]">{stat.value}</p>
              <p className="mt-3 text-[16px] font-medium text-[#858585]">{stat.label}</p>
            </div>
          ))}
        </div>
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
        <Button
          emphasis="outlined"
          onClick={() => navigate("/dashboard/reports")}
        >
          <Symbols name="add" />
          Generate Report
        </Button>
        <Button
          emphasis="outlined"
          onClick={() => navigate("/dashboard/tenants")}
        >
          <Symbols name="add" />
          Add Account
        </Button>
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

        <Panel title="Room Snapshots">
          <RoomSnapshotPanel rooms={summary?.rooms} tenants={summary?.tenants} />
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
