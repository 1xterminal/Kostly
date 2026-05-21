import { useState, useEffect, useCallback } from 'react'
import {
  X,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ExtendRequest = {
  id: string
  requested_end_date: string
  status: string
  created_at: string
  note?: string | null
  contracts: {
    id: string
    start_date: string
    end_date: string
    users: { name: string } | null
    rooms: { number: string } | null
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

const daysDiff = (from: string, to: string) => {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

export default function ExtendRequestsModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [requests, setRequests] = useState<ExtendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('extend_requests')
        .select(`
          id,
          requested_end_date,
          status,
          created_at,
          note,
          contracts (
            id,
            start_date,
            end_date,
            users ( name ),
            rooms ( number )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setRequests(data || [])
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) fetchRequests()
  }, [isOpen, fetchRequests])

  const handleAction = async (
    requestId: string,
    contractId: string,
    requestedDate: string,
    action: 'approved' | 'rejected',
  ) => {
    setProcessingId(requestId)
    setError(null)
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Not authenticated')

      if (action === 'approved') {
        const { error: contractErr } = await supabase
          .from('contracts')
          .update({ end_date: requestedDate })
          .eq('id', contractId)
        if (contractErr) throw contractErr
      }

      const { error: reqErr } = await supabase
        .from('extend_requests')
        .update({
          status: action,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (reqErr) throw reqErr

      // Auto-refresh the list immediately
      await fetchRequests()
      onSuccess()

      // Show success toast
      showToast(
        action === 'approved'
          ? '✓ Request approved — contract end date updated.'
          : '✗ Request rejected.',
        action === 'approved' ? 'success' : 'error',
      )
    } catch (e: unknown) {
      setError((e as Error).message)
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <ClipboardList className="h-5 w-5 text-[#3B5998]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Extend Requests</h2>
              <p className="text-xs text-gray-500">
                {isLoading
                  ? 'Loading…'
                  : requests.length === 0
                  ? 'No pending requests'
                  : `${requests.length} pending`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            /* Skeleton */
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <CalendarDays className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">All caught up!</p>
              <p className="mt-1 text-xs text-gray-400">No pending extension requests right now.</p>
            </div>
          ) : (
            /* Request cards */
            <div className="space-y-3">
              {requests.map((req) => {
                const extra = daysDiff(req.contracts.end_date, req.requested_end_date)
                const isProcessing = processingId === req.id
                return (
                  <div
                    key={req.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-shadow hover:shadow-sm"
                  >
                    {/* Top row — avatar + name + room */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold shadow-sm">
                          {req.contracts.users?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {req.contracts.users?.name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Room #{req.contracts.rooms?.number ?? '—'}
                          </p>
                        </div>
                      </div>
                      {/* Extension duration badge */}
                      <span className="flex-shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-[#3B5998]">
                        +{extra} days
                      </span>
                    </div>

                    {/* Date arrow row */}
                    <div className="flex items-center gap-2 mb-3 rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                      <CalendarDays className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="flex flex-1 items-center justify-between text-xs font-medium">
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Current end</p>
                          <p className="text-gray-700">{fmt(req.contracts.end_date)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-400 mb-0.5">Requested</p>
                          <p className="font-bold text-[#3B5998]">{fmt(req.requested_end_date)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Note (if any) */}
                    {req.note && (
                      <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 italic">
                        "{req.note}"
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(req.id, req.contracts.id, req.requested_end_date, 'approved')}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all duration-150"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, req.contracts.id, req.requested_end_date, 'rejected')}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 active:scale-95 disabled:opacity-50 transition-all duration-150"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-center text-xs text-gray-400">
            Approving will update the contract's end date automatically.
          </p>
        </div>

        {/* Toast notification */}
        {toast && (
          <div
            className={[
              'absolute bottom-20 left-1/2 -translate-x-1/2 z-10',
              'flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg',
              'text-sm font-semibold whitespace-nowrap',
              'animate-in fade-in slide-in-from-bottom-2 duration-200',
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-900 text-white',
            ].join(' ')}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}
