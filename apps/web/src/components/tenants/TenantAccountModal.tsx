import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { callEdgeFunction } from '../../lib/edgeFunctions'

const tenantAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
})

type TenantAccountFormData = z.infer<typeof tenantAccountSchema>

type CreateTenantAccountResponse = {
  tenant_id: string
  temporary_password: string
}

export default function TenantAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TenantAccountFormData>({
    resolver: zodResolver(tenantAccountSchema),
  })

  const handleClose = () => {
    reset()
    setError(null)
    setCreatedPassword(null)
    onClose()
  }

  const onSubmit = async (data: TenantAccountFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await callEdgeFunction<CreateTenantAccountResponse>(
        'create-tenant-account',
        data,
      )
      setCreatedPassword(result.temporary_password)
      onSuccess()
      reset()
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
        <div className="fixed inset-0 bg-gray-500/70" onClick={handleClose} />

        <div className="relative inline-block w-full max-w-lg overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#3B5998]">
                <UserPlus className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-950">Add Tenant Account</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create login access first. Room assignment can happen after this.
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {createdPassword && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Account created. Temporary password: <span className="font-bold">{createdPassword}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Full Name</label>
              <input {...register('name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">Email</label>
              <input type="email" {...register('email')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">Phone Number</label>
              <input {...register('phone_number')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Close
              </button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-[#3B5998] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
