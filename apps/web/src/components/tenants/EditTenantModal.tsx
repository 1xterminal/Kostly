import { useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, X } from 'lucide-react'
import type { TenantWithDetails } from '../../hooks/useTenants'
import { phonePattern } from '../../lib/validation'
import Button from "../ui/Button";
// import { Symbols } from "../ui/MaterialSymbols";

export default function EditTenantModal({
  tenant,
  isOpen,
  onClose,
  onSave,
}: {
  tenant: TenantWithDetails | null
  isOpen: boolean
  onClose: () => void
  onSave: (tenantId: string, input: { name: string; phone_number: string | null }) => Promise<void>
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !tenant) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const nextName = String(formData.get('name') ?? '').trim()
      const nextPhone = String(formData.get('phone_number') ?? '').trim()
      if (!nextName) throw new Error('Name is required')
      if (nextPhone && !phonePattern.test(nextPhone)) {
        throw new Error('Enter a valid phone number')
      }

      await onSave(tenant.id, {
        name: nextName,
        phone_number: nextPhone || null,
      })
      onClose()
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
        <div className="fixed inset-0 bg-gray-500/70" onClick={onClose} />

        <form onSubmit={handleSubmit} className="relative inline-block w-full max-w-md overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#3B5998]">
                <Pencil className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-950">Edit Tenant Info</h3>
              <p className="mt-1 text-sm text-gray-500">{tenant.email}</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Full Name</label>
              <input
                name="name"
                defaultValue={tenant.name}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800">Phone Number</label>
              <input
                name="phone_number"
                defaultValue={tenant.phone_number ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {/*<button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>*/}
            {/*<button type="submit" disabled={isSaving} className="rounded-md bg-[#3B5998] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>*/}
            <Button emphasis="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
