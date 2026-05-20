import { useState } from 'react'
import { Search } from 'lucide-react'
import { usePayments } from '../../hooks/usePayments'
import type { PaymentWithDetails } from '../../hooks/usePayments'

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const shortInvoiceId = (id: string) => `#INV${id.slice(0, 5).toUpperCase()}`

// ── Component ──────────────────────────────────────────────────────────────────
export default function Payments() {
  const { data: payments, isLoading, error, approvePayment, rejectPayment, getProofUrl } = usePayments()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Unverified' | 'Verified' | 'Rejected'>('Unverified')
  const [selectedProof, setSelectedProof] = useState<{ url: string; payment: PaymentWithDetails } | null>(null)
  const [rejectModal, setRejectModal] = useState<PaymentWithDetails | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
        Error loading payments: {(error as Error).message}
      </div>
    )
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = (payments ?? []).filter((p) => {
    if (search && !p.tenant.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.invoice_id.toLowerCase().includes(search.toLowerCase())) return false
    if (activeTab === 'Unverified') return p.status === 'not_verified'
    if (activeTab === 'Verified')   return p.status === 'verified'
    if (activeTab === 'Rejected')   return p.status === 'rejected'
    return true
  })

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = async (p: PaymentWithDetails) => {
    setActionLoading(p.id)
    try {
      await approvePayment(p.id, p.invoice_id)
    } catch (err) {
      alert('Failed to approve: ' + (err as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Reject ──────────────────────────────────────────────────────────────────
  const handleRejectSubmit = async () => {
    if (!rejectModal) return
    if (!rejectReason.trim()) { alert('Please enter a rejection reason'); return }
    setActionLoading(rejectModal.id)
    try {
      await rejectPayment(rejectModal.id, rejectModal.invoice_id, rejectReason.trim())
      setRejectModal(null)
      setRejectReason('')
    } catch (err) {
      alert('Failed to reject: ' + (err as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  const tabs = ['Unverified', 'Verified', 'Rejected'] as const

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">≡</span>
        <h1 className="text-lg font-semibold text-gray-800">Payments</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          id="payments-search"
          type="text"
          placeholder="Search payments"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs — underline style matching screenshot */}
      <div className="flex gap-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const count = (payments ?? []).filter(p =>
            tab === 'Unverified' ? p.status === 'not_verified' :
            tab === 'Verified'   ? p.status === 'verified' :
            p.status === 'rejected'
          ).length
          return (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Invoice ID</th>
              <th className="px-4 py-3 font-medium">Tenant Name</th>
              <th className="px-4 py-3 font-medium">Transaction date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Loading…
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No {activeTab.toLowerCase()} payments.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isActioning = actionLoading === p.id
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    {/* Invoice ID */}
                    <td className="px-4 py-3 font-mono text-gray-800 font-medium">
                      {shortInvoiceId(p.invoice_id)}
                    </td>

                    {/* Tenant */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 font-medium">
                          {p.tenant.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-gray-700">{p.tenant.name}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(p.transaction_date)}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {formatCurrency(p.invoices?.total_amount ?? 0)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {p.status === 'not_verified' ? (
                        <div className="flex items-center gap-2">
                          {/* Check proof → opens modal */}
                          <button
                            id={`check-proof-${p.id}`}
                            onClick={async () => {
                              const url = await getProofUrl(p.proof_images)
                              if (url) setSelectedProof({ url, payment: p })
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            Check proof
                          </button>
                        </div>
                      ) : p.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex text-xs text-red-600 font-medium" title={p.rejection_reason ?? undefined}>
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Proof modal with Approve / Reject ─────────────────────────────────── */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedProof(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Payment Proof</h2>
              <button onClick={() => setSelectedProof(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-5 bg-gray-50 flex justify-center">
              <img
                src={selectedProof.url}
                alt="Payment Proof"
                className="max-h-[55vh] object-contain rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).alt = 'Could not load image' }}
              />
            </div>
            {/* Find the payment matching this proof */}
            {(() => {
              const current = selectedProof.payment
              if (!current || current.status !== 'not_verified') return null
              const busy = actionLoading === current.id
              return (
                <div className="flex justify-end gap-3 px-5 py-4 border-t bg-white">
                  <button
                    id={`reject-btn-${current.id}`}
                    onClick={() => { setSelectedProof(null); setRejectModal(current) }}
                    disabled={busy}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    id={`approve-btn-${current.id}`}
                    onClick={async () => { await handleApprove(current); setSelectedProof(null) }}
                    disabled={busy}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busy ? 'Saving…' : 'Approve'}
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── Reject reason modal ───────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Reject Payment</h2>
            <p className="text-sm text-gray-500">
              Enter the reason for rejecting <strong>{rejectModal.tenant.name}</strong>'s payment.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason…"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id={`confirm-reject-${rejectModal.id}`}
                onClick={handleRejectSubmit}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
