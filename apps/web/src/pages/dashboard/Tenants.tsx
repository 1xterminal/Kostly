import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Plus, MessageCircle, Mail, MoreVertical, Archive, Bell } from 'lucide-react'
import { useTenants } from '../../hooks/useTenants'
import OnboardTenantModal from '../../components/tenants/OnboardTenantModal'
import ExtendRequestsModal from '../../components/tenants/ExtendRequestsModal'
import { supabase } from '../../lib/supabase'

export default function Tenants() {
  const queryClient = useQueryClient()
  const { data: tenants, isLoading, error, refetch } = useTenants()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Active' | 'Pending' | 'Archived'>('Active')
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  if (error) {
    return <div className="p-8 text-red-500">Error loading tenants: {(error as Error).message}</div>
  }

  const filteredTenants = (tenants || []).filter(tenant => {
    // Filter by search
    if (search && !tenant.name.toLowerCase().includes(search.toLowerCase())) return false

    // Filter by tab
    if (activeTab === 'Active') {
      return tenant.tenant_status === 'active' && !tenant.hasPendingPayment
    }
    if (activeTab === 'Pending') {
      return tenant.hasPendingPayment || tenant.tenant_status === 'pending'
    }
    if (activeTab === 'Archived') {
      return tenant.tenant_status === 'archived'
    }
    return true
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatPeriod = (start?: string, end?: string) => {
    if (!start || !end) return '-'
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  const handleArchive = async (tenantId: string, contractId?: string) => {
    if (!confirm('Are you sure you want to archive this tenant?')) return
    try {
      if (contractId) {
        await supabase.from('contracts').update({ status: 'terminated' }).eq('id', contractId)
      }
      await supabase.from('users').update({ tenant_status: 'archived' }).eq('id', tenantId)
      refetch()
    } catch (err) {
      console.error('Failed to archive tenant', err)
      alert('Failed to archive tenant')
    }
  }

  return (
    <>
      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-slide { animation: fadeSlideIn 0.4s ease both; }
        .row-animate { animation: rowIn 0.3s ease both; }
      `}</style>

      <div className="p-8 max-w-6xl mx-auto space-y-6">

        {/* Search and Action — fade in on mount */}
        <div className="animate-fade-slide flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 sm:text-sm"
              placeholder="Search tenants"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
            >
              <Bell className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Extend Requests
            </button>
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#3B5998] hover:bg-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Onboard Tenant
            </button>
          </div>
        </div>

        {/* Tabs — fade in with slight delay */}
        <div className="animate-fade-slide mb-4" style={{ animationDelay: '0.05s' }}>
          <nav className="flex space-x-2">
            {['Active', 'Pending', 'Archived'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'Active' | 'Pending' | 'Archived')}
                className={`
                  px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
                  ${activeTab === tab
                    ? 'border border-[#3B5998] text-[#3B5998] bg-blue-50 shadow-sm scale-[1.03]'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:text-gray-900'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Table — double-wrapper trick:
            outer = rounded-xl + overflow-hidden  → clips thead/tfoot for nice corners
            inner = overflow-visible              → lets dropdown menus escape */}
        <div
          className="animate-fade-slide rounded-xl border border-gray-200 shadow-sm"
          style={{ animationDelay: '0.1s', overflow: 'hidden' }}
        >
          <div style={{ overflow: 'visible' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Tenant Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-900 border-l border-gray-200">
                    Room No.
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-900 border-l border-gray-200">
                    Contract Period
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-900 border-l border-gray-200">
                    State
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-900 border-l border-gray-200">
                    Contact
                  </th>
                  <th scope="col" className="relative px-6 py-4 border-l border-gray-200">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  /* Skeleton loading rows */
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                          <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
                        </div>
                      </td>
                      {[...Array(4)].map((_, j) => (
                        <td key={j} className="px-6 py-4 border-l border-gray-200">
                          <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
                        </td>
                      ))}
                      <td className="px-6 py-4 border-l border-gray-200" />
                    </tr>
                  ))
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-3xl">🏠</span>
                        <span>No tenants found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant, idx) => (
                    <tr
                      key={tenant.id}
                      className="row-animate hover:bg-blue-50/40 transition-colors duration-150 group"
                      style={{ animationDelay: `${0.12 + idx * 0.05}s` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* Avatar with initial letter */}
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {tenant.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-900">{tenant.name}</span>
                              {!tenant.onboarding ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                                  Pending
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{tenant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm font-medium text-gray-900">
                        {tenant.activeContract?.room?.number ? `#${tenant.activeContract.room.number}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm text-gray-500">
                        {formatPeriod(tenant.activeContract?.start_date, tenant.activeContract?.end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tenant.paymentState === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tenant.paymentState === 'Unpaid'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {tenant.paymentState}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm font-medium">
                        <div className="flex space-x-3 text-gray-400">
                          <a
                            href={`https://wa.me/${tenant.phone_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-green-500 transition-all duration-150 hover:scale-110 transform"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-5 w-5" />
                          </a>
                          <a
                            href={`mailto:${tenant.email}`}
                            className="hover:text-blue-500 transition-all duration-150 hover:scale-110 transform"
                            title="Email"
                          >
                            <Mail className="h-5 w-5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium border-l border-gray-200">
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === tenant.id ? null : tenant.id)}
                            className="text-gray-300 hover:text-gray-600 group-hover:text-gray-500 transition-colors duration-150 p-1 rounded-md hover:bg-gray-100"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          {activeMenuId === tenant.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fade-slide">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleArchive(tenant.id, tenant.activeContract?.id)
                                    setActiveMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-150"
                                >
                                  <Archive className="mr-2 h-4 w-4" /> Archive Tenant
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <OnboardTenantModal
          isOpen={isOnboardModalOpen}
          onClose={() => setIsOnboardModalOpen(false)}
          onSuccess={() => {
            refetch()
            queryClient.invalidateQueries({ queryKey: ['rooms'] })
          }}
        />

        <ExtendRequestsModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          onSuccess={() => {
            refetch()
          }}
        />
      </div>
    </>
  )
}
