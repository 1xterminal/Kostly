import { useState } from 'react'
import { usePayments } from '../../hooks/usePayments'
import type { PaymentWithDetails } from '../../hooks/usePayments'
import { Input } from '@/components/ui/Field'
import { Symbols } from '@/components/ui/MaterialSymbols'

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
    if (rejectReason.trim().length < 3) {
      alert('Please enter a rejection reason of at least 3 characters')
      return
    }
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
    <div className="space-y-6">
      {/* Search */}
      {/* <div className="relative max-w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          id="payments-search"
          type="text"
          placeholder="Search payments"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-100 bg-[#f8f9fa] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
        />
        </div> */}
      <div className="px-20">
        <Input
          id="payments-search"
          placeholder="Search payments"
          leadingIcon={<Symbols name="search" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
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
              className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 border border-transparent'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${activeTab === tab ? 'text-indigo-500' : 'text-gray-400'}`}>({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border-none overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Invoice ID</th>
              <th className="px-6 py-4 font-semibold">Tenant Name</th>
              <th className="px-6 py-4 font-semibold">Transaction date</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
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
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Invoice ID */}
                    <td className="px-6 py-4 font-mono text-gray-800 font-medium">
                      {shortInvoiceId(p.invoice_id)}
                    </td>

                    {/* Tenant */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 font-medium">
                          {p.tenant.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-gray-700">{p.tenant.name}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(p.transaction_date)}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {formatCurrency(p.invoices?.total_amount ?? 0)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
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
          <div className="relative bg-[#f4f4f4] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden z-10">
            <div className="flex items-start justify-between px-6 pt-6 pb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payment Proof</h2>
                <p className="text-sm text-gray-400 mt-1">Subtitle</p>
              </div>
              <button onClick={() => setSelectedProof(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {(() => {
              const current = selectedProof.payment
              if (!current || current.status !== 'not_verified') return null
              const busy = actionLoading === current.id
              return (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-6 mt-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-800 text-sm">Tenants proof</h3>
                      <div className="bg-white p-4 rounded-xl shadow-sm flex justify-center border border-gray-100">
                        <img
                          src={selectedProof.url}
                          alt="Payment Proof"
                          className="max-h-[300px] object-contain rounded-lg"
                          onError={(e) => { (e.target as HTMLImageElement).alt = 'Could not load image' }}
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <h3 className="font-bold text-gray-800 text-sm">Invoice Info</h3>

                      <div className="space-y-5">
                        <div>
                          <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1">Tenant Name</p>
                          <p className="text-gray-900 text-sm">{current.tenant.name}</p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1">Payment Amount</p>
                          <p className="text-gray-900 font-semibold flex items-center gap-2">
                            {formatCurrency(current.invoices?.total_amount ?? 0)}
                            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1">Payment Target</p>
                          <p className="text-gray-900 font-semibold flex items-center gap-2">
                            Rental Room Cloud
                            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                      id={`reject-btn-${current.id}`}
                      onClick={() => { setSelectedProof(null); setRejectModal(current) }}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#E23E28] rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <span>✕</span> Reject
                    </button>
                    <button
                      id={`approve-btn-${current.id}`}
                      onClick={async () => { await handleApprove(current); setSelectedProof(null) }}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#2E41A2] rounded-md hover:bg-indigo-800 disabled:opacity-50"
                    >
                      <span>✓</span> {busy ? 'Approving…' : 'Approve'}
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── Reject reason modal ───────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setRejectModal(null); setRejectReason('') }} />
          <div className="relative bg-[#f4f4f4] rounded-xl shadow-2xl w-full max-w-[400px] z-10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Reject Reason</h2>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Reason</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E41A2]"
              />
            </div>
            <button
              id={`confirm-reject-${rejectModal.id}`}
              onClick={handleRejectSubmit}
              disabled={!!actionLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-[#2E41A2] rounded-md hover:bg-indigo-800 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              {actionLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
