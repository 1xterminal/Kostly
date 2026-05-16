import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Transaction {
    id: string
    transaction_date: string
    status: string
    invoices: {
        total_amount: number
        users: { name: string }
    }
}

export function RecentTransactionsTable() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRecent() {
            // Fetch latest 5 payments, join with invoices to get amount and tenant name
            const { data, error } = await supabase
                .from('payments')
                .select(`
          id,
          transaction_date,
          status,
          invoices (
            total_amount,
            users ( name )
          )
        `)
                .order('transaction_date', { ascending: false })
                .limit(5)

            if (!error && data) {
                setTransactions(data as any)
            }
            setLoading(false)
        }
        fetchRecent()
    }, [])

    if (loading) return <div className="animate-pulse bg-white h-64 rounded-xl border border-gray-100 shadow-sm"></div>

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Tenant</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {tx.invoices?.users?.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(tx.transaction_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.status === 'verified' ? 'bg-green-100 text-green-700' :
                                            tx.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {tx.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    ${tx.invoices?.total_amount?.toLocaleString() || 0}
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                    No recent transactions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
