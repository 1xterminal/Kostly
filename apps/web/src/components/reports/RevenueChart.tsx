import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
    data: { name: string; revenue: number }[]
    totalRevenue: number
}

export function RevenueChart({ data, totalRevenue }: RevenueChartProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Total Revenue</h3>
                <p className="text-[22px] font-bold text-gray-900 mt-1">
                    IDR {totalRevenue.toLocaleString()}
                </p>
            </div>
            <div className="h-[200px] w-full" style={{ minHeight: 200 }}>
                {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                        <YAxis domain={[1000000, 6000000]} ticks={[1000000, 2000000, 3000000, 4000000, 5000000, 6000000]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `IDR ${value / 1000000}M`} width={60} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`IDR ${Number(value).toLocaleString()}`, 'Revenue']} />
                        <Line type="linear" dataKey="revenue" stroke="#3341A5" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
