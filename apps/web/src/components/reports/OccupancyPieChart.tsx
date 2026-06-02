import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OccupancyPieChartProps {
    data: { name: string; rate: number }[]
    currentRate: number
}

export function OccupancyPieChart({ data, currentRate }: OccupancyPieChartProps) {
    return (
        <div className="flex flex-col rounded-md border border-[#C8C8C8] bg-[#F7F7F7] p-4 shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
            <div className="mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#858585]">Occupancy</h3>
                <p className="mt-1 text-[22px] font-bold text-[#111111]">
                    {currentRate}%
                </p>
            </div>
            <div className="h-[170px] w-full" style={{ minHeight: 170 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={{ stroke: '#111827', strokeWidth: 2 }} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                        <YAxis domain={[50, 100]} ticks={[50, 60, 70, 80, 90, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `${value}%`} width={40} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${Number(value)}%`, 'Occupancy']} />
                        <Line type="linear" dataKey="rate" stroke="#3341A5" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
