import { useEffect, useMemo, useState } from 'react'
import { Home, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { callEdgeFunction } from '../../lib/edgeFunctions'
import type { TenantWithDetails } from '../../hooks/useTenants'
import { isEndAfterStart } from '../../lib/validation'
import Button from "../ui/Button";

const assignSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant is required'),
  room_id: z.string().min(1, 'Room is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
}).refine((data) => isEndAfterStart(data.start_date, data.end_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
})

type AssignFormData = z.infer<typeof assignSchema>
type AvailableRoom = { id: string; number: string; price: number }

export default function AssignTenantRoomModal({
  isOpen,
  tenants,
  selectedTenant,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  tenants: TenantWithDetails[]
  selectedTenant?: TenantWithDetails | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [rooms, setRooms] = useState<AvailableRoom[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState('')

  const assignableTenants = useMemo(
    () => tenants.filter((tenant) => tenant.tenant_status !== 'archived' && !tenant.activeContract),
    [tenants],
  )
  const hasAssignableTenants = assignableTenants.length > 0

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
  })

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)

  useEffect(() => {
    if (!isOpen) return

    supabase
      .from('rooms')
      .select('id, number, price')
      .eq('status', 'available')
      .order('number', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setRooms(data ?? [])
      })
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (selectedTenant && !selectedTenant.activeContract) {
      setValue('tenant_id', selectedTenant.id, { shouldValidate: true })
    }
  }, [isOpen, selectedTenant, setValue])

  const handleClose = () => {
    reset()
    setSelectedRoomId('')
    setError(null)
    onClose()
  }

  const onSubmit = async (data: AssignFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await callEdgeFunction('assign-tenant-room', data)
      reset()
      setSelectedRoomId('')
      onSuccess()
      onClose()
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
                <Home className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-950">Assign Room</h3>
              <p className="mt-1 text-sm text-gray-500">
                Only active tenants without an active contract appear here.
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Tenant</label>
              <select {...register('tenant_id')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select tenant account</option>
                {assignableTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} - {tenant.email}
                  </option>
                ))}
              </select>
              {!hasAssignableTenants && (
                <p className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
                  No unassigned tenant accounts. Tenants that still need onboarding may already have rooms; ask them to log in and set their password.
                </p>
              )}
              {errors.tenant_id && <p className="mt-1 text-xs text-red-500">{errors.tenant_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">Room</label>
              <select
                {...register('room_id', { onChange: (event) => setSelectedRoomId(event.target.value) })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select available room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room #{room.number} - IDR {Number(room.price).toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
              {errors.room_id && <p className="mt-1 text-xs text-red-500">{errors.room_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800">Start Date</label>
                <input type="date" {...register('start_date')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800">End Date</label>
                <input type="date" {...register('end_date')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>}
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Monthly rate:{' '}
              <span className="font-bold text-gray-950">
                {selectedRoom ? `IDR ${Number(selectedRoom.price).toLocaleString('id-ID')}` : 'Select a room'}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {/*<button type="button" onClick={handleClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || !hasAssignableTenants || rooms.length === 0} className="rounded-md bg-[#3B5998] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                {isSubmitting ? 'Assigning...' : 'Assign Room'}
              </button>*/}
              <Button emphasis="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !hasAssignableTenants || rooms.length === 0
                }
              >
                {isSubmitting ? "Assigning..." : "Assign Room"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
