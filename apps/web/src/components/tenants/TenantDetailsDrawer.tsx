import { Archive, Home, Mail, MessageCircle, RotateCcw, X } from 'lucide-react'
import type { TenantWithDetails } from '../../hooks/useTenants'

const formatCurrency = (value?: number) =>
  value == null ? '-' : `IDR ${Number(value).toLocaleString('id-ID')}`

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'

export default function TenantDetailsDrawer({
  tenant,
  onClose,
  onAssignRoom,
  onArchive,
  onSendReset,
}: {
  tenant: TenantWithDetails | null
  onClose: () => void
  onAssignRoom: (tenant: TenantWithDetails) => void
  onArchive: (tenant: TenantWithDetails) => void
  onSendReset: (tenant: TenantWithDetails) => void
}) {
  if (!tenant) return null

  const statusLabel = tenant.tenant_status === 'archived'
    ? 'Archived'
    : tenant.activeContract
      ? 'Assigned'
      : 'Unassigned'

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-gray-900/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div>
            <div className="mb-3 h-12 w-12 rounded-full bg-gray-200" />
            <h2 className="text-2xl font-bold text-gray-950">{tenant.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{tenant.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Account</p>
              <p className="mt-1 text-sm font-semibold text-gray-950">
                {tenant.onboarding ? 'Mobile ready' : 'Needs onboarding'}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs font-bold uppercase text-gray-500">Placement</p>
              <p className="mt-1 text-sm font-semibold text-gray-950">{statusLabel}</p>
            </div>
          </div>

          <section className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Active Contract</h3>
            <div className="mt-3 rounded-md border border-gray-200">
              <div className="grid grid-cols-2 border-b border-gray-200">
                <div className="p-3">
                  <p className="text-xs text-gray-500">Room</p>
                  <p className="text-sm font-bold text-gray-950">
                    {tenant.activeContract?.room?.number ? `#${tenant.activeContract.room.number}` : '-'}
                  </p>
                </div>
                <div className="border-l border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-sm font-bold text-gray-950">{formatCurrency(tenant.activeContract?.monthly_rate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div className="p-3">
                  <p className="text-xs text-gray-500">Start</p>
                  <p className="text-sm font-semibold text-gray-950">{formatDate(tenant.activeContract?.start_date)}</p>
                </div>
                <div className="border-l border-gray-200 p-3">
                  <p className="text-xs text-gray-500">End</p>
                  <p className="text-sm font-semibold text-gray-950">{formatDate(tenant.activeContract?.end_date)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Activity</h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xl font-bold text-gray-950">{tenant.contractCount}</p>
                <p className="text-xs text-gray-500">Contracts</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xl font-bold text-gray-950">{tenant.ticketCount}</p>
                <p className="text-xs text-gray-500">Tickets</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xl font-bold text-gray-950">{tenant.paymentState}</p>
                <p className="text-xs text-gray-500">Payment</p>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-2">
            <a href={`mailto:${tenant.email}`} className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Mail className="mr-2 h-4 w-4" /> Email
            </a>
            <a href={`https://wa.me/${tenant.phone_number ?? ''}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </a>
            {!tenant.activeContract && tenant.tenant_status !== 'archived' && (
              <button onClick={() => onAssignRoom(tenant)} className="inline-flex items-center justify-center rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-[#3B5998] hover:bg-blue-50">
                <Home className="mr-2 h-4 w-4" /> Assign
              </button>
            )}
            <button onClick={() => onSendReset(tenant)} className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Link
            </button>
            {tenant.tenant_status !== 'archived' && (
              <button onClick={() => onArchive(tenant)} className="col-span-2 inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                <Archive className="mr-2 h-4 w-4" /> Archive Tenant
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
