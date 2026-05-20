import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getRoomById, updateRoom } from '@/api/rooms'
import type { RoomWithRelations } from '@/types'

const roomStatusSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  price: z.number().min(1, 'Price is required'),
  wifi_password: z.string().min(1, 'Wifi password is required')
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

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RoomStatusFormData>({
    resolver: zodResolver(roomStatusSchema)
  })

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen) {
        const data = await getRoomById(id);
        if (data) {
          selectData(data);
          reset({
            number: data.number,
            price: data.price,
            wifi_password: data.wifi_password ?? ''
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
      await updateRoom(id, data);

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
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />
        
        <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Room #{selectedData?.number}</h3>
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
              <label className="block text-sm font-medium text-gray-700">Room Number</label>
              <input {...register('number')} defaultValue={selectedData?.number} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {errors.number && <p className="mt-1 text-xs text-red-500">{errors.number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Room Price</label>
              <input type="number" {...register('price', { valueAsNumber: true })} defaultValue={selectedData?.price} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Wi-Fi Password</label>
              <input {...register('wifi_password')} defaultValue={selectedData?.wifi_password ?? ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {errors.wifi_password && <p className="mt-1 text-xs text-red-500">{errors.wifi_password.message}</p>}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#3B5998] border border-transparent rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
