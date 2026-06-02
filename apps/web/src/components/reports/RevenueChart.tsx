import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
    data: { name: string; revenue: number }[]
    totalRevenue: number
}

export function RevenueChart({ data, totalRevenue }: RevenueChartProps) {
    return (
        <div className="flex flex-col rounded-md border border-[#C8C8C8] bg-[#F7F7F7] p-4 shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
            <div className="mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#858585]">Total Revenue</h3>
                <p className="mt-1 text-[22px] font-bold text-[#111111]">
                    IDR {totalRevenue.toLocaleString()}
                </p>
            </div>
            <div className="h-[170px] w-full" style={{ minHeight: 170 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                        <YAxis domain={[1000000, 6000000]} ticks={[1000000, 2000000, 3000000, 4000000, 5000000, 6000000]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `IDR ${value / 1000000}M`} width={60} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`IDR ${Number(value).toLocaleString()}`, 'Revenue']} />
                        <Line type="linear" dataKey="revenue" stroke="#3341A5" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
