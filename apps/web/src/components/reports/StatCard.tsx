import type { ReactNode } from 'react'

interface StatCardProps {
    title: string
    value: string | number
    icon?: ReactNode
    description?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
}

export function StatCard({ title, value, icon, description, trend, trendValue }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                {icon && <div className="text-gray-400">{icon}</div>}
            </div>
            <div className="flex items-end gap-3">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                {trendValue && (
                    <span className={`text-sm font-medium mb-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
                    </span>
                )}
            </div>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
    )
}
