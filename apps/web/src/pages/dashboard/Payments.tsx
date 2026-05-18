import { useState } from 'react'
import { CheckCircle, XCircle, Search, Eye } from 'lucide-react'
import { usePayments, PaymentWithDetails } from '../../hooks/usePayments'
import { supabase } from '../../lib/supabase'

export default function Payments() {
  const { data: payments, isLoading, error, refetch, approvePayment, rejectPayment } = usePayments()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending')
  const [selectedProof, setSelectedProof] = useState<string | null>(null)

  if (error) {
    return <div className="p-8 text-red-500">Error loading payments: {(error as Error).message}</div>
  }

  const filteredPayments = (payments || []).filter(payment => {
    if (search && !payment.tenant.name.toLowerCase().includes(search.toLowerCase())) return false

    if (activeTab === 'Pending') return payment.status === 'not_verified'
    if (activeTab === 'Verified') return payment.status === 'verified'
    if (activeTab === 'Rejected') return payment.status === 'rejected'
    
    return true
  })

  const handleApprove = async (payment: PaymentWithDetails) => {
    if (!confirm('Approve this payment?')) return
    try {
      await approvePayment(payment.id)
    } catch (err) {
      console.error(err)
      alert('Failed to approve payment')
    }
  }

  const handleReject = async (payment: PaymentWithDetails) => {
    const reason = prompt('Enter rejection reason:')
    if (reason === null) return
    try {
      await rejectPayment(payment.id, reason)
    } catch (err) {
      console.error(err)
      alert('Failed to reject payment')
    }
  }

  const getPublicProofUrl = (path: string) => {
    // For mock, proof_images is already a full URL or fallback
    return path.startsWith('http') ? path : `https://via.placeholder.com/600x800?text=Proof`;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search by tenant name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['Pending', 'Verified', 'Rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tenant
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                Proof
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading payments...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No {activeTab.toLowerCase()} payments found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.tenant.name}</div>
                    <div className="text-sm text-gray-500">Room {payment.invoices?.contracts?.rooms?.number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm text-gray-900">
                    {formatCurrency(payment.invoices?.total_amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm text-gray-900">
                    {formatDate(payment.transaction_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedProof(getPublicProofUrl(payment.proof_images))}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium border-l border-gray-200">
                    {payment.status === 'not_verified' ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(payment)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(payment)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedProof(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Payment Proof</h3>
                    <div className="mt-4 flex justify-center">
                      <img src={selectedProof} alt="Payment Proof" className="max-h-[70vh] object-contain" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedProof(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
