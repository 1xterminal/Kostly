import { useEffect, useMemo, useState } from 'react'
import { Home, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { callEdgeFunction } from '../../lib/edgeFunctions'
import type { TenantWithDetails } from '../../hooks/useTenants'
import Button from "../ui/Button";
import { Input, Select } from '../ui/Field'

const assignSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant is required'),
  room_id: z.string().min(1, 'Room is required'),
  start_date: z.string().min(1, 'Start date is required'),
})

type AssignFormData = z.infer<typeof assignSchema>
type AvailableRoom = { id: string; number: string; price: number }

const monthToMonthEndDate = '9999-12-31'

const formatDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

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
    defaultValues: {
      start_date: formatDateInput(new Date()),
    },
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
      await callEdgeFunction('assign-tenant-room', {
        tenant_id: data.tenant_id,
        room_id: data.room_id,
        start_date: data.start_date,
        end_date: monthToMonthEndDate,
      })
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
              <Select
                label="Tenant"
                {...register('tenant_id')}
              >
              <option value="">Select tenant account</option>
                {assignableTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} - {tenant.email}
                  </option>
                ))}
              </Select>
              {!hasAssignableTenants && (
                <p className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
                  No unassigned tenant accounts. Tenants that still need onboarding may already have rooms; ask them to log in and set their password.
                </p>
              )}
              {errors.tenant_id && <p className="mt-1 text-xs text-red-500">{errors.tenant_id.message}</p>}
            </div>

            <div>
              <Select
                label="Room"
                {...register('room_id', { onChange: (event) => setSelectedRoomId(event.target.value) })}
              >
                <option value="">Select available room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room #{room.number} - IDR {Number(room.price).toLocaleString('id-ID')}
                  </option>
                ))}
              </Select>
              {errors.room_id && <p className="mt-1 text-xs text-red-500">{errors.room_id.message}</p>}
            </div>

            <div>
              <Input
                label="Move-in Date"
                type="date"
                {...register('start_date')}
              />
              {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
            </div>

            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              This creates an active month-to-month tenancy. Rent invoices keep generating monthly until the tenant is archived or the contract is ended.
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <div>
                Monthly rate:{' '}
                <span className="font-bold text-gray-950">
                  {selectedRoom ? `IDR ${Number(selectedRoom.price).toLocaleString('id-ID')}` : 'Select a room'}
                </span>
              </div>
              <div>
                Term:{' '}
                <span className="font-bold text-gray-950">Month-to-month</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                emphasis="outlined"
                disabled={isSubmitting}
                onClick={handleClose}
              >
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
