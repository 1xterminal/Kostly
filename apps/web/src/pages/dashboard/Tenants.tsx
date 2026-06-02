import { useMemo, useState } from 'react'
import {
  Archive,
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
import AssignTenantRoomModal from '../../components/tenants/AssignTenantRoomModal'
import EditTenantModal from '../../components/tenants/EditTenantModal'
import TenantAccountModal from '../../components/tenants/TenantAccountModal'
import TenantDetailsDrawer from '../../components/tenants/TenantDetailsDrawer'
import { supabase } from '../../lib/supabase'
import { callEdgeFunction } from '../../lib/edgeFunctions'
import { useSidebar } from '../../components/layout/sidebar-context'
import Button from "@/components/ui/Button";
import { Symbols } from "@/components/ui/MaterialSymbols";
import { Input } from '@/components/ui/Field'
import Avatar from '@/components/ui/Avatar'
import { DashboardCanvas, DashboardSearchRow, MetricTile, StatusPill, TableShell } from '@/components/dashboardPrimitives'

type TenantTab = 'All' | 'Needs Onboarding' | 'Assigned' | 'Unassigned' | 'Archived'

const tabs: TenantTab[] = ['All', 'Needs Onboarding', 'Assigned', 'Unassigned', 'Archived']

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const formatPeriod = (start?: string) => {
  if (!start) return '-'
  return `${formatDate(start)} - ongoing`
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
  const { toggle } = useSidebar()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TenantTab>('All')
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
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
    <DashboardCanvas className="space-y-5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-[28px] font-bold text-[#111111]">
          <button type="button" onClick={toggle} aria-label="Toggle sidebar" className="grid h-8 w-8 place-items-center rounded-md text-[#111111] hover:bg-white">
            <Symbols name="menu" />
          </button>
          Tenants
        </h1>

        <div className="flex gap-2">
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
          <Button onClick={() => setIsAccountModalOpen(true)}>
            <Symbols name="person_add" />
            New Tenant
          </Button>
        </div>
      </div>

      <DashboardSearchRow>
        <Input
          placeholder="Search tenants"
          leadingIcon={<Symbols name="search" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </DashboardSearchRow>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 md:grid-cols-5">
        {tabs.map((tab) => (
          <MetricTile
            key={tab}
            label={tab === 'Needs Onboarding' ? 'Need Onboarding' : tab}
            value={counts[tab]}
            active={activeTab === tab}
            tone={tab === 'Archived' ? 'gray' : tab === 'Needs Onboarding' ? 'orange' : 'blue'}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      <TableShell className="mx-auto w-full max-w-6xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F7F7F7]">
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
                        <Avatar src={tenant.avatar_url ?? undefined} name={tenant.name} size={36} />
                        <span className="ml-3">
                          <span className="block text-sm font-bold text-gray-950">{tenant.name}</span>
                          <span className="block text-xs text-gray-500">{tenant.email}</span>
                        </span>
                      </button>
                    </td>

                    <td className="border-l border-gray-200 px-5 py-4">
                      <StatusPill tone={lifecycleKey === 'assigned' ? 'green' : lifecycleKey === 'needs_onboarding' ? 'orange' : lifecycleKey === 'archived' ? 'gray' : 'blue'}>
                        {getLifecycleLabel(tenant)}
                      </StatusPill>
                    </td>
                    <td className="whitespace-nowrap border-l border-gray-200 px-5 py-4 text-sm text-gray-900">
                      {tenant.activeContract?.room?.number ? `#${tenant.activeContract.room.number}` : '-'}
                    </td>
                    <td className="whitespace-nowrap border-l border-gray-200 px-5 py-4 text-sm text-gray-900">
                      {formatPeriod(tenant.activeContract?.start_date)}
                    </td>
                    <td className="whitespace-nowrap border-l border-gray-200 px-5 py-4 text-sm">
                      <StatusPill tone={tenant.paymentState === 'Paid' ? 'green' : tenant.paymentState === 'Pending' ? 'orange' : 'red'}>
                        {tenant.paymentState}
                      </StatusPill>
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
      </TableShell>

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
    </DashboardCanvas>
  )
}
