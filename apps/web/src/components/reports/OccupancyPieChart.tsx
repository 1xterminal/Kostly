import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OccupancyPieChartProps {
    data: { name: string; rate: number }[]
    currentRate: number
}

export function OccupancyPieChart({ data, currentRate }: OccupancyPieChartProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Occupancy</h3>
                <p className="text-[22px] font-bold text-gray-900 mt-1">
                    {currentRate}%
                </p>
            </div>
            <div className="h-[200px] w-full" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
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
