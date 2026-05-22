import { useCallback, useEffect, useState } from 'react'
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
import { callEdgeFunction } from '../../lib/edgeFunctions'

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

type ExtendRequestRow = Omit<ExtendRequest, 'contracts'> & {
  contracts: ExtendRequest['contracts'] | ExtendRequest['contracts'][] | null
}

const fmt = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

const daysDiff = (from: string, to: string) => {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function normalizeRequest(row: ExtendRequestRow): ExtendRequest | null {
  const contract = Array.isArray(row.contracts) ? row.contracts[0] : row.contracts
  if (!contract) return null
  return { ...row, contracts: contract }
}

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
    window.setTimeout(() => setToast(null), 3000)
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
      setRequests(((data ?? []) as ExtendRequestRow[]).map(normalizeRequest).filter(Boolean) as ExtendRequest[])
    } catch (caught) {
      setError((caught as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    queueMicrotask(() => {
      void fetchRequests()
    })
  }, [isOpen, fetchRequests])

  const handleAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessingId(requestId)
    setError(null)
    try {
      await callEdgeFunction('review-extend-request', {
        request_id: requestId,
        action,
      })

      await fetchRequests()
      onSuccess()
      showToast(
        action === 'approved'
          ? 'Request approved. Contract end date updated.'
          : 'Request rejected.',
        action === 'approved' ? 'success' : 'error',
      )
    } catch (caught) {
      setError((caught as Error).message)
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <ClipboardList className="h-5 w-5 text-[#3B5998]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Extend Requests</h2>
              <p className="text-xs text-gray-500">
                {isLoading ? 'Loading...' : requests.length === 0 ? 'No pending requests' : `${requests.length} pending`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close extend requests"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <CalendarDays className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">All caught up!</p>
              <p className="mt-1 text-xs text-gray-400">No pending extension requests right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const extraDays = daysDiff(request.contracts.end_date, request.requested_end_date)
                const isProcessing = processingId === request.id

                return (
                  <div key={request.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-shadow hover:shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-bold text-white shadow-sm">
                          {request.contracts.users?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {request.contracts.users?.name ?? '-'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Room #{request.contracts.rooms?.number ?? '-'}
                          </p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-[#3B5998]">
                        +{extraDays} days
                      </span>
                    </div>

                    <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3">
                      <div className="text-center">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Current end</p>
                        <p className="text-sm text-gray-700">{fmt(request.contracts.end_date)}</p>
                      </div>
                      <ChevronRight className="mx-1 h-4 w-4 text-gray-300" />
                      <div className="text-center">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-400">Requested</p>
                        <p className="text-sm font-bold text-[#3B5998]">{fmt(request.requested_end_date)}</p>
                      </div>
                    </div>

                    {request.note && (
                      <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs italic text-amber-800">
                        "{request.note}"
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(request.id, 'approved')}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(request.id, 'rejected')}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Reject
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-center text-xs text-gray-400">
            Approving uses the review transaction and updates the contract end date.
          </p>
        </div>

        {toast && (
          <div
            className={[
              'absolute bottom-20 left-1/2 z-10 -translate-x-1/2',
              'flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg',
              'whitespace-nowrap text-sm font-semibold',
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white',
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
