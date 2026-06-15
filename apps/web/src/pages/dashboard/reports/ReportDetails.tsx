import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { OccupancyPieChart } from '@/components/reports/OccupancyPieChart'
import type { Report } from '@/types'
import { getReports } from '@/api/reports'
import Avatar from '@/components/ui/Avatar'
import { StatusPill, TableShell } from '@/components/dashboardPrimitives'
import Button from '@/components/ui/Button'
import { Symbols } from '@/components/ui/MaterialSymbols'
import { exportMonthlyReportWorkbook, type ReportExportInvoice } from '@/lib/exportReportWorkbook'

type InvoiceLogRow = ReportExportInvoice

export default function ReportDetails() {
    const { reportId } = useParams<{ reportId: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'transactions' | 'occupancy' | 'overdue'>('transactions')

    // Fetch ALL reports so we can generate the 6-month historical graph accurately up until the month viewed
    const { data: reportsList } = useQuery({
        queryKey: ['reports', 'list'],
        queryFn: getReports
    })

    // Identify the currently viewed report
    const report = reportsList?.find(r => r.id === reportId)
    const monthYear = report?.month_year

    // Generate historical data spanning the 5 months PRIOR to the monthYear being viewed
    const generateHistoricalData = (reports: Report[] | undefined, targetMonthYear: string | undefined) => {
        const data: { name: string; revenue: number; rate: number }[] = []
        if (!targetMonthYear) return data
        const targetDate = new Date(targetMonthYear)
        for (let i = 5; i >= 0; i--) {
            const d = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, 1)
            const monthStr = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
            const dbDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`

            const r = reports?.find(rep => rep.month_year === dbDateString)
            data.push({
                name: monthStr,
                revenue: r ? Number(r.total_revenue) : 0,
                rate: r ? Number(r.occupancy_rate) : 0
            })
        }
        return data
    }

    const historicalData = generateHistoricalData(reportsList, monthYear)
    const currentTotalRevenue = report ? Number(report.total_revenue) : 0
    const currentOccupancyRate = report ? Number(report.occupancy_rate) : 0

    // Fetch invoices for "Transaction Log"
    const { data: invoices, isLoading: invoicesLoading } = useQuery({
        queryKey: ['invoices', monthYear],
        enabled: !!monthYear,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    id,
                    billing_month,
                    due_date,
                    status,
                    total_amount,
                    contracts ( rooms ( number ) ),
                    users ( name, email ),
                    payments ( id, status, transaction_date, rejection_reason, created_at, verified_at )
                `)
                .eq('billing_month', monthYear!)
            if (error) throw error
            return data
        }
    })
    const typedInvoices = (invoices ?? []) as InvoiceLogRow[]
    const overdueInvoices = typedInvoices.filter((invoice) => invoice.status !== 'paid' && invoice.due_date < new Date().toISOString().slice(0, 10))
    const occupancyRows = [
        { label: 'Total Rooms Tracked', value: report?.total_rooms || 0 },
        { label: 'Occupied Rooms', value: report?.occupied_rooms || 0 },
        { label: 'Vacant Rooms', value: (report?.total_rooms || 0) - (report?.occupied_rooms || 0) },
        { label: 'Final Occupancy Rate', value: `${Number(report?.occupancy_rate || 0)}%` },
    ]
    const tabClass = (tab: typeof activeTab) =>
        `min-w-[170px] rounded-md border px-4 py-3 text-left text-[14px] font-medium transition ${
            activeTab === tab
                ? 'border-[#9AA7DE] bg-[#FAFAFA] font-bold text-[#3045AF] shadow-[0_2px_6px_rgba(48,69,175,0.18)]'
                : 'border-[#C8C8C8] bg-[#F2F2F2] text-[#111111] hover:border-[#AFAFAF]'
        }`

    return (
        <div className="flex h-full w-full max-w-6xl flex-col space-y-5 overflow-hidden px-6 pb-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex items-center gap-4 shrink-0">
                <button onClick={() => navigate('/dashboard/reports')} className="grid h-8 w-8 place-items-center rounded-full text-[#111111] transition-colors hover:bg-white">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-[28px] font-bold tracking-tight text-[#111111]">Report Details</h1>
                    <p className="mt-1 text-[16px] text-[#858585]">{monthYear ? new Date(monthYear).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : 'Loading...'}</p>
                </div>
                <div className="ml-auto">
                    <Button
                        type="button"
                        disabled={!report || invoicesLoading}
                        onClick={() => {
                            if (report) exportMonthlyReportWorkbook(report, typedInvoices)
                        }}
                    >
                        <Symbols name="download" />
                        Export Excel
                    </Button>
                </div>
            </div>

            <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-2">
                <RevenueChart data={historicalData} totalRevenue={currentTotalRevenue} />
                <OccupancyPieChart data={historicalData} currentRate={currentOccupancyRate} />
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
                <button type="button" onClick={() => setActiveTab('transactions')} className={tabClass('transactions')}>
                    Transactions
                </button>
                <button type="button" onClick={() => setActiveTab('occupancy')} className={tabClass('occupancy')}>
                    Occupancy
                </button>
                <button type="button" onClick={() => setActiveTab('overdue')} className={tabClass('overdue')}>
                    Overdue
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-8">
                {activeTab === 'transactions' ? (
                    <TableShell>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#C8C8C8] text-left text-xs uppercase tracking-wider text-[#111111]">
                                    <th className="px-4 py-3 font-bold">Date</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Invoice ID</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Tenant Name</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Amount</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Transaction Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#C8C8C8]">
                                {typedInvoices.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[#858585]">No transactions recorded for this month.</td></tr>
                                ) : typedInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="px-4 py-4">{new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4 font-mono">#INV{inv.id.slice(0, 5).toUpperCase()}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={inv.users?.name ?? 'Tenant'} size={28} />
                                                <span>{inv.users?.name ?? 'Unknown tenant'}</span>
                                            </div>
                                        </td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4">IDR {Number(inv.total_amount).toLocaleString()}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4">Monthly rent</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableShell>
                ) : activeTab === 'overdue' ? (
                    <TableShell>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#C8C8C8] text-left text-xs uppercase tracking-wider text-[#111111]">
                                    <th className="px-4 py-3 font-bold">Due Date</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Invoice ID</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Tenant Name</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Amount</th>
                                    <th className="border-l border-[#C8C8C8] px-4 py-3 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#C8C8C8]">
                                {overdueInvoices.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[#858585]">No overdue invoices for this month.</td></tr>
                                ) : overdueInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="px-4 py-4">{new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4 font-mono">#INV{inv.id.slice(0, 5).toUpperCase()}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4">{inv.users?.name ?? 'Unknown tenant'}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4">IDR {Number(inv.total_amount).toLocaleString()}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4">
                                            <StatusPill tone={inv.status === 'pending' ? 'orange' : 'red'}>{inv.status}</StatusPill>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableShell>
                ) : (
                    <TableShell className="max-w-xl">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-[#C8C8C8]">
                                {occupancyRows.map((row) => (
                                    <tr key={row.label}>
                                        <td className="px-4 py-4 font-bold text-[#111111]">{row.label}</td>
                                        <td className="border-l border-[#C8C8C8] px-4 py-4 text-right font-bold text-[#3045AF]">{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableShell>
                )}
            </div>
        </div>
    )
}
