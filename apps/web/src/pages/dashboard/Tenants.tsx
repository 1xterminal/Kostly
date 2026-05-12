import React, { useState } from 'react'
import { Search, Plus, MessageCircle, Mail } from 'lucide-react'
import { useTenants } from '../../hooks/useTenants'

export default function Tenants() {
  const { data: tenants, isLoading, error } = useTenants()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Active' | 'Pending' | 'Archived'>('Active')

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
      return tenant.hasPendingPayment || tenant.tenant_status === 'pending' // Assuming pending status or pending payment
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      {/* Search and Action */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search tenants"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#3B5998] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Onboard Tenant
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['Active', 'Pending', 'Archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'Active' | 'Pending' | 'Archived')}
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
                Tenant Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                Room No.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                Contract Period
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                State
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-l border-gray-200">
                Contact
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading tenants...
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No tenants found.
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200"></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm text-gray-900">
                    {tenant.activeContract?.room?.number ? `#${tenant.activeContract.room.number}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm text-gray-900">
                    {formatPeriod(tenant.activeContract?.start_date, tenant.activeContract?.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm text-gray-900">
                    {tenant.paymentState}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-l border-gray-200 text-sm font-medium">
                    <div className="flex space-x-3 text-gray-500">
                      <a href={`https://wa.me/${tenant.phone_number}`} target="_blank" rel="noreferrer" className="hover:text-green-600">
                        <MessageCircle className="h-5 w-5" />
                      </a>
                      <a href={`mailto:${tenant.email}`} className="hover:text-blue-600">
                        <Mail className="h-5 w-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
