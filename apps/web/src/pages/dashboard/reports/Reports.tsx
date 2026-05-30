import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { OccupancyPieChart } from '@/components/reports/OccupancyPieChart'
import { getReports } from '@/api/reports'
import type { Report } from '@/types'
import Button from "@/components/ui/Button";
import { Symbols } from "@/components/ui/MaterialSymbols";
import { Input } from '@/components/ui/Field'

export default function Reports() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')

    const [sortBy, setSortBy] = useState('Date Created')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const sortRef = useRef<HTMLDivElement>(null)

    // Data Fetching: All charts now feed directly from this DB query
    const { data: reportsList, isLoading: reportsLoading } = useQuery({
        queryKey: ['reports', 'list'],
        queryFn: getReports
    })

    // Transform DB rows into the 6-month historical array for the charts
    const generateLast6MonthsData = (reports: Report[] | undefined) => {
        const data = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthStr = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
            const dbDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`

            const report = reports?.find(r => r.month_year === dbDateString)
            data.push({
                name: monthStr,
                revenue: report ? Number(report.total_revenue) : 0,
                rate: report ? Number(report.occupancy_rate) : 0
            })
        }
        return data
    }

    const historicalData = generateLast6MonthsData(reportsList)
    const latestReport = reportsList && reportsList.length > 0 ? reportsList[0] : null
    const currentTotalRevenue = latestReport ? Number(latestReport.total_revenue) : 0
    const currentOccupancyRate = latestReport ? Number(latestReport.occupancy_rate) : 0

    // Edge Function Trigger
    const generateMutation = useMutation({
        mutationFn: async () => {
            const now = new Date()
            const { data, error } = await supabase.functions.invoke('monthly-report', {
                body: { month: now.getMonth() + 1, year: now.getFullYear() }
            })
            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            alert('Report successfully generated!')
        },
        onError: (err) => {
            alert(`Failed to generate report: ${err.message}. Ensure the Edge Function is deployed.`)
        }
    })

    // Sorting & Filtering
    let displayedReports = [...(reportsList || [])]
    if (searchQuery) {
        displayedReports = displayedReports.filter(r => {
            const dateStr = new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            return dateStr.toLowerCase().includes(searchQuery.toLowerCase())
        })
    }

    displayedReports.sort((a, b) => {
        switch (sortBy) {
            case 'Date Created': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'Highest Revenue': return Number(b.total_revenue) - Number(a.total_revenue)
            case 'Lowest Revenue': return Number(a.total_revenue) - Number(b.total_revenue)
            case 'Highest Occupancy': return Number(b.occupancy_rate) - Number(a.occupancy_rate)
            case 'Lowest Occupancy': return Number(a.occupancy_rate) - Number(b.occupancy_rate)
            default: return 0
        }
    })

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const sortOptions = ['Date Created', 'Highest Revenue', 'Lowest Revenue', 'Highest Occupancy', 'Lowest Occupancy']

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col px-6 pt-2 pb-6 max-w-7xl w-full mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                {reportsLoading ? (
                    <div className="h-[200px] bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                ) : (
                    <RevenueChart data={historicalData} totalRevenue={currentTotalRevenue} />
                )}

                {reportsLoading ? (
                    <div className="h-[200px] bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                ) : (
                    <OccupancyPieChart data={historicalData} currentRate={currentOccupancyRate} />
                )}
            </div>

            <div className="flex items-center gap-4 shrink-0 mt-2 px-20">
                {/*<div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search reports by date (e.g. 20 April 2026)" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#3341A5] focus:border-transparent transition-all" />
                </div>*/}
                <Input
                  placeholder="Search reports by date (e.g. 20 April 2026)"
                  leadingIcon={<Symbols name="search" />}
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
                {/*<button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="flex items-center gap-2 bg-[#3341A5] hover:bg-[#283382] disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg text-[14px] font-medium transition-colors">
                            {generateMutation.isPending ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Plus className="w-[18px] h-[18px]" />}
                            Generate Report
                        </button>*/}
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    <Symbols name="add" />
                  )}
                  Generate Report
                </Button>
            </div>

            <div className="relative shrink-0 z-10" ref={sortRef}>
                <div className="flex items-center gap-2 text-[14px]">
                    <span className="font-bold text-gray-900">Sort by:</span>
                    <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-1 text-gray-900 font-bold hover:opacity-80 transition-opacity">
                        {sortBy} <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                {isSortOpen && (
                    <div className="absolute top-full left-12 mt-2 w-48 bg-white rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 py-1 origin-top-left animate-in fade-in zoom-in-95 duration-200">
                        {sortOptions.map((option) => (
                            <button key={option} onClick={() => { setSortBy(option); setIsSortOpen(false); }} className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center justify-between transition-colors">
                                <span className={sortBy === option ? 'font-bold text-gray-900' : ''}>{option}</span>
                                {sortBy === option && <Check className="w-4 h-4 text-[#3341A5]" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 pr-2 space-y-3 pb-8">
                {reportsLoading ? (
                    <div className="text-center text-sm text-gray-500 py-10">Loading reports...</div>
                ) : displayedReports.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-10">No reports found. Generate one to get started.</div>
                ) : (
                    displayedReports.map((report) => (
                        <div key={report.id} onClick={() => navigate(`/dashboard/reports/${report.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
                                    <span className="text-[12px] font-bold text-gray-500">{new Date(report.month_year).toLocaleDateString('en-GB', { month: 'short' })}</span>
                                </div>
                                <div>
                                    <h4 className="text-[16px] font-bold text-gray-900">{new Date(report.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                                    <p className="text-[13px] text-gray-500 mt-0.5">Generated on {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(report.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-6">
                                <div><p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-0.5">Occupancy</p><p className="text-[16px] font-bold text-gray-900">{Number(report.occupancy_rate)}%</p></div>
                                <div><p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-0.5">Revenue</p><p className="text-[16px] font-bold text-[#3341A5]">IDR {Number(report.total_revenue).toLocaleString()}</p></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
