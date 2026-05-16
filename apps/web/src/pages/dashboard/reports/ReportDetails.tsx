import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { OccupancyPieChart } from '@/components/reports/OccupancyPieChart'
import type { Report } from '@/types'

export default function ReportDetails() {
    const { monthYear } = useParams<{ monthYear: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'transactions' | 'occupancy'>('transactions')

    // Fetch ALL reports so we can generate the 6-month historical graph accurately up until the month viewed
    const { data: reportsList } = useQuery({
        queryKey: ['reports', 'list'],
        queryFn: async () => {
            const { data, error } = await supabase.from('reports').select('*').order('month_year', { ascending: false })
            if (error) throw error
            return data
        }
    })

    // Identify the currently viewed report
    const report = reportsList?.find(r => r.month_year === monthYear)

    // Generate historical data spanning the 5 months PRIOR to the monthYear being viewed
    const generateHistoricalData = (reports: Report[] | undefined, targetMonthYear: string | undefined) => {
        const data = []
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
    const { data: invoices } = useQuery({
        queryKey: ['invoices', monthYear],
        queryFn: async () => {
            const { data, error } = await supabase.from('invoices').select('*, contracts(rooms(number)), users(name)').eq('billing_month', monthYear)
            if (error) throw error
            return data
        }
    })

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col px-6 pt-2 pb-6 max-w-7xl w-full mx-auto space-y-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex items-center gap-4 shrink-0">
                <button onClick={() => navigate('/dashboard/reports')} className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Report Details</h1>
                    <p className="text-sm text-gray-500 mt-1">{monthYear ? new Date(monthYear).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Loading...'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0 mt-2">
                <RevenueChart data={historicalData} totalRevenue={currentTotalRevenue} />
                <OccupancyPieChart data={historicalData} currentRate={currentOccupancyRate} />
            </div>

            <div className="flex items-center gap-6 border-b border-gray-200 shrink-0 mt-4">
                <button onClick={() => setActiveTab('transactions')} className={`pb-3 text-[14px] font-bold transition-colors relative ${activeTab === 'transactions' ? 'text-[#3341A5]' : 'text-gray-400 hover:text-gray-700'}`}>
                    Transaction Log
                    {activeTab === 'transactions' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3341A5] rounded-t-full" />}
                </button>
                <button onClick={() => setActiveTab('occupancy')} className={`pb-3 text-[14px] font-bold transition-colors relative ${activeTab === 'occupancy' ? 'text-[#3341A5]' : 'text-gray-400 hover:text-gray-700'}`}>
                    Occupancy Log
                    {activeTab === 'occupancy' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3341A5] rounded-t-full" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-8">
                {activeTab === 'transactions' ? (
                    <div className="space-y-3">
                        {(!invoices || invoices.length === 0) && <div className="text-center text-sm text-gray-500 py-10 bg-white rounded-xl border border-gray-200">No transactions recorded for this month.</div>}
                        {invoices?.map((inv: any) => (
                            <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <h4 className="text-[16px] font-bold text-gray-900">{inv.users?.name} <span className="text-gray-400 font-medium ml-1">· Room {inv.contracts?.rooms?.number}</span></h4>
                                    <p className="text-[13px] text-gray-500 mt-1">Due: {new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span>
                                    <p className="text-[16px] font-bold text-gray-900">IDR {Number(inv.total_amount).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Occupancy Snapshot</h3>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center py-4 border-b border-gray-100"><span className="text-[14px] font-medium text-gray-600">Total Rooms Tracked</span><span className="text-[16px] font-bold text-gray-900">{report?.total_rooms || 0}</span></div>
                            <div className="flex justify-between items-center py-4 border-b border-gray-100"><span className="text-[14px] font-medium text-gray-600">Occupied Rooms</span><span className="text-[16px] font-bold text-gray-900">{report?.occupied_rooms || 0}</span></div>
                            <div className="flex justify-between items-center py-4 border-b border-gray-100"><span className="text-[14px] font-medium text-gray-600">Vacant Rooms</span><span className="text-[16px] font-bold text-gray-900">{(report?.total_rooms || 0) - (report?.occupied_rooms || 0)}</span></div>
                            <div className="flex justify-between items-center pt-4"><span className="text-[14px] font-bold text-gray-900">Final Occupancy Rate</span><span className="text-[18px] font-bold text-[#3341A5]">{Number(report?.occupancy_rate || 0)}%</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
