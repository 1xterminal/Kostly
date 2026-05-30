import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  // Bell,
  Home,
  Mail,
  MessageCircle,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  // UserPlus,
} from 'lucide-react'
import { useTenants, type TenantWithDetails } from '../../hooks/useTenants'
import { usePendingExtendCount } from '../../hooks/useExtendRequests'
import AssignTenantRoomModal from '../../components/tenants/AssignTenantRoomModal'
import EditTenantModal from '../../components/tenants/EditTenantModal'
import ExtendRequestsModal from '../../components/tenants/ExtendRequestsModal'
import TenantAccountModal from '../../components/tenants/TenantAccountModal'
import TenantDetailsDrawer from '../../components/tenants/TenantDetailsDrawer'
import { supabase } from '../../lib/supabase'
import { callEdgeFunction } from '../../lib/edgeFunctions'
import { useSidebarHeader } from '../../components/layout/sidebar-context'
import Button from "@/components/ui/Button";
import { Symbols } from "@/components/ui/MaterialSymbols";
import { Input } from '@/components/ui/Field'

type TenantTab = 'All' | 'Needs Onboarding' | 'Assigned' | 'Unassigned' | 'Archived'

const tabs: TenantTab[] = ['All', 'Needs Onboarding', 'Assigned', 'Unassigned', 'Archived']

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const formatPeriod = (start?: string, end?: string) => {
  if (!start || !end) return '-'
  return `${formatDate(start)} - ${formatDate(end)}`
}

const statusClasses: Record<string, string> = {
  archived: 'border-gray-300 bg-gray-100 text-gray-600',
  assigned: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  needs_onboarding: 'border-orange-200 bg-orange-50 text-orange-700',
  unassigned: 'border-blue-200 bg-blue-50 text-[#3B5998]',
}

function getLifecycleLabel(tenant: TenantWithDetails) {
  if (tenant.tenant_status === 'archived') return 'Archived'
  if (!tenant.onboarding) return 'Needs onboarding'
  if (!tenant.activeContract) return 'Unassigned'
  return 'Assigned'
}

function getLifecycleKey(tenant: TenantWithDetails) {
  if (tenant.tenant_status === 'archived') return 'archived'
  if (!tenant.onboarding) return 'needs_onboarding'
  if (!tenant.activeContract) return 'unassigned'
  return 'assigned'
}

export default function Tenants() {
  const { data: tenants = [], isLoading, error, refetch } = useTenants()
  const { setActions } = useSidebarHeader()
  const pendingExtendCount = usePendingExtendCount()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TenantTab>('All')
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDetails | null>(null)
  const [assignTarget, setAssignTarget] = useState<TenantWithDetails | null>(null)
  const [editTarget, setEditTarget] = useState<TenantWithDetails | null>(null)

  const counts = useMemo(() => ({
    All: tenants.length,
    'Needs Onboarding': tenants.filter((tenant) => tenant.tenant_status !== 'archived' && !tenant.onboarding).length,
    Assigned: tenants.filter((tenant) => tenant.tenant_status !== 'archived' && tenant.activeContract).length,
    Unassigned: tenants.filter((tenant) => tenant.tenant_status !== 'archived' && !tenant.activeContract).length,
    Archived: tenants.filter((tenant) => tenant.tenant_status === 'archived').length,
  }), [tenants])

  const filteredTenants = useMemo(() => {
    const term = search.toLowerCase()

    return tenants.filter((tenant) => {
      const searchable = [
        tenant.name,
        tenant.email,
        tenant.phone_number ?? '',
        tenant.activeContract?.room?.number ?? '',
      ].join(' ').toLowerCase()

      if (term && !searchable.includes(term)) return false

      if (activeTab === 'Needs Onboarding') {
        return tenant.tenant_status !== 'archived' && !tenant.onboarding
      }

      if (activeTab === 'Assigned') {
        return tenant.tenant_status !== 'archived' && Boolean(tenant.activeContract)
      }

      if (activeTab === 'Unassigned') {
        return tenant.tenant_status !== 'archived' && !tenant.activeContract
      }

      if (activeTab === 'Archived') {
        return tenant.tenant_status === 'archived'
      }

      return true
    })
  }, [activeTab, search, tenants])

  useEffect(() => {
    setActions(
      <>
        <Button emphasis="outlined" onClick={() => setIsExtendModalOpen(true)}>
          <Symbols name="more_time" />
          Extend Requests
          {pendingExtendCount > 0 && (
            <span className="ml-2 rounded-full bg-[#D6420F] px-2 py-0.5 text-xs font-bold text-white">
              {pendingExtendCount}
            </span>
          )}
        </Button>
        {/*<button
          onClick={() => setIsExtendModalOpen(true)}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Bell className="mr-2 h-4 w-4" />
          Extend Requests
          {pendingExtendCount > 0 && (
            <span className="ml-2 rounded-full bg-[#D6420F] px-2 py-0.5 text-xs font-bold text-white">
              {pendingExtendCount}
            </span>
          )}
        </button>*/}
        <Button
          emphasis="outlined"
          onClick={() => {
            setAssignTarget(null);
            setIsAssignModalOpen(true);
            setActiveMenuId(null);
          }}
        >
          <Symbols name="in_home_mode" />
          Assign Room
        </Button>
        {/*<button
          onClick={() => {
            setAssignTarget(null);
            setIsAssignModalOpen(true);
            setActiveMenuId(null);
          }}
          className="inline-flex items-center rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#3B5998] hover:bg-blue-50"
        >
          <Home className="mr-2 h-4 w-4" />
          Assign Room
        </button>*/}
        <Button onClick={() => setIsAccountModalOpen(true)}>
          <Symbols name="person_add" />
          Add Account
        </Button>
        {/*<button
          onClick={() => setIsAccountModalOpen(true)}
          className="inline-flex items-center rounded-md bg-[#3B5998] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Account
        </button>*/}
      </>,
    )

    return () => setActions(null)
  }, [pendingExtendCount, setActions])

  if (error) {
    return <div className="p-8 text-red-500">Error loading tenants: {(error as Error).message}</div>
  }

  const handleAssignRoom = (tenant?: TenantWithDetails | null) => {
    setAssignTarget(tenant ?? null)
    setIsAssignModalOpen(true)
    setActiveMenuId(null)
  }

  const handleArchive = async (tenant: TenantWithDetails) => {
    if (!confirm(`Archive ${tenant.name}? Active contracts will be terminated and the room will be released.`)) return

    try {
      await callEdgeFunction('archive-tenant', { tenant_id: tenant.id })

      setActiveMenuId(null)
      setSelectedTenant(null)
      refetch()
    } catch (err) {
      console.error('Failed to archive tenant', err)
      alert('Failed to archive tenant')
    }
  }

  const handleSendReset = async (tenant: TenantWithDetails) => {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(tenant.email)
    setActiveMenuId(null)

    if (resetError) {
      alert(resetError.message)
      return
    }

    alert(`Password reset email sent to ${tenant.email}`)
  }

  const handleEditTenant = (tenant: TenantWithDetails) => {
    setEditTarget(tenant)
    setActiveMenuId(null)
  }

  const handleSaveTenantInfo = async (tenantId: string, input: { name: string; phone_number: string | null }) => {
    const { error: updateError } = await supabase
      .from('users')
      .update(input)
      .eq('id', tenantId)

    if (updateError) throw updateError
    setSelectedTenant((current) => current?.id === tenantId ? { ...current, ...input } : current)
    await refetch()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg border px-4 py-3 text-left transition ${activeTab === tab
                ? 'border-blue-300 bg-blue-50 text-[#3B5998]'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide">{tab}</p>
            <p className="mt-1 text-2xl font-bold">{counts[tab]}</p>
          </button>
        ))}
      </div>

      <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
        Needs Onboarding means the tenant has not finished first mobile login/password setup. Unassigned means the tenant has no active room contract.
      </div>

      <div className="flex justify-center gap-3 px-20">
        {/*<div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search name, email, phone, or room"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>*/}
        <Input
          placeholder="Search name, email, phone, or room"
          leadingIcon={<Symbols name="search" />}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        {/*<button
          onClick={() => setActiveTab("All")}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>*/}
        <Button
          emphasis="outlined"
          action="mono"
          onClick={() => setActiveTab("All")}
        >
          Clear Filters
        </Button>
      </div>

      <div className="overflow-visible rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Tenant</th>
              <th className="border-l border-gray-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Lifecycle</th>
              <th className="border-l border-gray-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Room</th>
              <th className="border-l border-gray-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Contract</th>
              <th className="border-l border-gray-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Payment</th>
              <th className="border-l border-gray-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Contact</th>
              <th className="relative border-l border-gray-200 px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">Loading tenants...</td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500">No tenants found.</td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => {
                const lifecycleKey = getLifecycleKey(tenant)

                return (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedTenant(tenant)} className="flex items-center text-left">
                        {tenant.avatar_url ? (
                          <img
                            src={tenant.avatar_url}
                            alt={`${tenant.name}'s profile`}
                            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-200" />
                        )}
                        <span className="ml-3">
                          <span className="block text-sm font-bold text-gray-950">{tenant.name}</span>
                          <span className="block text-xs text-gray-500">{tenant.email}</span>
                        </span>
                      </button>
                    </td>

                    <td className="border-l border-gray-200 px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[lifecycleKey]}`}>
                        {getLifecycleLabel(tenant)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-l border-gray-200 px-5 py-4 text-sm text-gray-900">
                      {tenant.activeContract?.room?.number ? `#${tenant.activeContract.room.number}` : '-'}
                    </td>
                    <td className="whitespace-nowrap border-l border-gray-200 px-5 py-4 text-sm text-gray-900">
                      {formatPeriod(tenant.activeContract?.start_date, tenant.activeContract?.end_date)}
                    </td>
                    <td className="whitespace-nowrap border-l border-gray-200 px-5 py-4 text-sm">
                      <span className={tenant.paymentState === 'Paid' ? 'text-emerald-700' : tenant.paymentState === 'Pending' ? 'text-orange-700' : 'text-red-700'}>
                        {tenant.paymentState}
                      </span>
                    </td>
                    <td className="border-l border-gray-200 px-5 py-4 text-sm font-medium">
                      <div className="flex gap-3 text-gray-500">
                        <a href={`https://wa.me/${tenant.phone_number ?? ''}`} target="_blank" rel="noreferrer" className="hover:text-green-600">
                          <MessageCircle className="h-5 w-5" />
                        </a>
                        <a href={`mailto:${tenant.email}`} className="hover:text-blue-600">
                          <Mail className="h-5 w-5" />
                        </a>
                      </div>
                    </td>
                    <td className="whitespace-nowrap border-l border-gray-200 px-5 py-4 text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === tenant.id ? null : tenant.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {activeMenuId === tenant.id && (
                          <div className="absolute right-0 z-20 mt-2 w-52 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10">
                            <button onClick={() => setSelectedTenant(tenant)} className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                              <Search className="mr-2 h-4 w-4" /> View Details
                            </button>
                            {!tenant.activeContract && tenant.tenant_status !== 'archived' && (
                              <button onClick={() => handleAssignRoom(tenant)} className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                <Home className="mr-2 h-4 w-4" /> Assign Room
                              </button>
                            )}
                            <button onClick={() => handleEditTenant(tenant)} className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                              <Pencil className="mr-2 h-4 w-4" /> Edit Info
                            </button>
                            <button onClick={() => handleSendReset(tenant)} className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                              <RotateCcw className="mr-2 h-4 w-4" /> Send Reset Link
                            </button>
                            {tenant.tenant_status !== 'archived' && (
                              <button onClick={() => handleArchive(tenant)} className="flex w-full items-center px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50">
                                <Archive className="mr-2 h-4 w-4" /> Archive Tenant
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <TenantAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <AssignTenantRoomModal
        isOpen={isAssignModalOpen}
        tenants={tenants}
        selectedTenant={assignTarget}
        onClose={() => {
          setIsAssignModalOpen(false)
          setAssignTarget(null)
        }}
        onSuccess={() => refetch()}
      />

      <ExtendRequestsModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <TenantDetailsDrawer
        tenant={selectedTenant}
        onClose={() => setSelectedTenant(null)}
        onAssignRoom={(tenant) => handleAssignRoom(tenant)}
        onArchive={(tenant) => handleArchive(tenant)}
        onEdit={(tenant) => handleEditTenant(tenant)}
        onSendReset={(tenant) => handleSendReset(tenant)}
      />

      <EditTenantModal
        tenant={editTarget}
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveTenantInfo}
      />
    </div>
  )
}
