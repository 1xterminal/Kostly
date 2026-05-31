import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getRoomById, updateRoom } from '@/api/rooms'
import type { RoomWithRelations } from '@/types'
import { requiredText } from '@/lib/validation'
import { Symbols } from '../ui/MaterialSymbols'
import { Input } from '../ui/Field'
import Button from '../ui/Button'

const roomStatusSchema = z.object({
  number: requiredText('Room number'),
  price: z.number({ error: 'Price is required' }).finite('Price must be a number').positive('Price must be greater than 0'),
  wifi_password: z.string().trim(),
  status: z.enum(['available', 'occupied', 'maintenance']),
})

type RoomStatusFormData = z.infer<typeof roomStatusSchema>

export default function EditRoomModal({
  id,
  isOpen,
  onClose,
  onSuccess
}: {
  id: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedData, selectData] = useState<RoomWithRelations | null>(null)

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm<RoomStatusFormData>({
    resolver: zodResolver(roomStatusSchema)
  })
  const watchedStatus = useWatch({ control, name: 'status' })

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen) {
        const data = await getRoomById(id);
        if (data) {
          const hasActiveContract = data.contracts?.some((contract) => contract.status === 'active') ?? false
          selectData(data);
          reset({
            number: data.number,
            price: data.price,
            wifi_password: data.wifi_password ?? '',
            status: hasActiveContract ? 'occupied' : data.status === 'maintenance' ? 'maintenance' : 'available',
          });
        }
      }
    };
    fetchData();
  }, [id, isOpen, reset])

  const handleClose = () => {
    selectData(null)
    reset()
    onClose()
  }

  const onSubmit = async (data: RoomStatusFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateRoom(id, {
        ...data,
        wifi_password: data.wifi_password || null,
        status: selectedData?.contracts?.some((contract) => contract.status === 'active')
          ? 'occupied'
          : data.status,
      });

      reset()
      selectData(null)
      onSuccess()
      onClose()
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!(isOpen && selectedData)) return null

  const hasActiveContract = selectedData.contracts?.some((contract) => contract.status === 'active') ?? false
  const currentStatus = watchedStatus ?? (hasActiveContract ? 'occupied' : 'available')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
        <div className="fixed inset-0 bg-gray-500/70" onClick={handleClose} />

        <div className="relative inline-block w-full max-w-lg overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#3B5998]">
                <Symbols name="edit" className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-950">Edit Room #{selectedData?.number}</h3>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              {/*<label className="block text-sm font-medium text-gray-700">Room Number</label>
              <input {...register('number')} defaultValue={selectedData?.number} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />*/}
              <Input
                label="Room Number"
                {...register('number')}
                defaultValue={selectedData?.number}
              />
              {errors.number && <p className="mt-1 text-xs text-red-500">{errors.number.message}</p>}
            </div>

            <div>
              {/*<label className="block text-sm font-medium text-gray-700">Room Price</label>
              <input type="number" {...register('price', { valueAsNumber: true })} defaultValue={selectedData?.price} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />*/}
              <Input
                label="Room Price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                defaultValue={selectedData?.price}
              />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
            </div>

            <div>
              {/*<label className="block text-sm font-medium text-gray-700">Wi-Fi Password</label>
              <input {...register('wifi_password')} defaultValue={selectedData?.wifi_password ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />*/}
              <Input
                label="Wi-Fi Password"
                {...register('wifi_password')}
                defaultValue={selectedData?.wifi_password ?? ''}
              />
              {errors.wifi_password && <p className="mt-1 text-xs text-red-500">{errors.wifi_password.message}</p>}
            </div>

            <div>
              {hasActiveContract ? (
                <>
                  <input type="hidden" value="occupied" {...register('status')} />
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Inventory Status</p>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                      Occupied
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Occupied rooms are controlled by the active tenant contract.
                  </p>
                </>
              ) : (
                <>
                  <input type="hidden" {...register('status')} />
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Inventory Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'available', label: 'Available', helper: 'Ready to assign' },
                        { value: 'maintenance', label: 'Maintenance', helper: 'Hide from assignment' },
                      ] as const).map((option) => {
                        const isSelected = currentStatus === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setValue('status', option.value, { shouldDirty: true, shouldValidate: true })}
                            className={[
                              'rounded-lg border px-4 py-3 text-left transition',
                              isSelected
                                ? option.value === 'maintenance'
                                  ? 'border-amber-300 bg-amber-50 text-amber-800 shadow-sm'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                            ].join(' ')}
                            aria-pressed={isSelected}
                          >
                            <span className="block text-sm font-bold">{option.label}</span>
                            <span className="mt-0.5 block text-xs opacity-75">{option.helper}</span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Maintenance rooms stay visible in the filter but cannot be assigned until marked available.
                    </p>
                  </div>
                  {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>}
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {/*<button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>*/}
              <Button
                type="button"
                emphasis="outlined"
                disabled={isSubmitting}
                onClick={handleClose}
              >
                Cancel
              </Button>
              {/*<button type="submit" disabled={isSubmitting} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#3B5998] border border-transparent rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </button>*/}
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
