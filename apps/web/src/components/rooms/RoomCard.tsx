import type { RoomWithRelations } from '@/types'

export function RoomCard(roomData: RoomWithRelations) {
  const activeContract = roomData.contracts?.find(contract => contract.status === 'active')
  const activeTicket = roomData.maintenance_tickets?.find(ticket =>
    ticket.ticket_status === 'reported' || ticket.ticket_status === 'in_progress'
  )

  const theme = {
    "available": {
      "cardBackground": "from-[#0fc95c]/0 to-[#0fc95c]/10",
      "chipBackground": "bg-[#0fc95c]/10",
      "text": "text-[#0fc95c]",
      "chipBorder": "border-[#0fc95c]"
    },
    "occupied": {
      "cardBackground": "from-[#0b7abe]/0 to-[#0b7abe]/10",
      "chipBackground": "bg-[#0b7abe]/10",
      "text": "text-[#0b7abe]",
      "chipBorder": "border-[#0b7abe]"
    },
    "maintenance": {
      "cardBackground": "from-[#cb460c]/0 to-[#cb460c]/10",
      "chipBackground": "bg-[#cb460c]/10",
      "text": "text-[#cb460c]",
      "chipBorder": "border-[#cb460c]"
    }
  }

  return (
    <div key={roomData.id} className={`
      h-[160px] p-5 rounded-xl
      border border-gray-300
      bg-white shadow-sm
      flex flex-col justify-between
      bg-linear-to-b ${theme[roomData.status].cardBackground}
    `}>
      {/* bg-linear-to-b from-[${accentColor}00] to-[${accentColor}ff] */}
        <div className="flex justify-between items-start">
          <h1 className="font-semibold text-3xl">#{roomData.number}</h1>
          <span className={`
            uppercase font-bold text-sm ${theme[roomData.status].text}
            ${theme[roomData.status].chipBackground}
            border ${theme[roomData.status].chipBorder}
            px-4 py-1
            rounded-full`}>
            {roomData.status}
          </span>
        </div>
        {
          roomData.status === 'available' ?
            <div className="flex flex-col gap-0.5">
              <p className='uppercase font-bold text-sm'>Price</p>
              <p>{roomData.price}</p>
            </div>
          : roomData.status === 'occupied' ?
            <div className="flex flex-col gap-0.5">
              <p className='uppercase font-bold text-sm'>Tenant</p>
              <p>{activeContract?.tenant?.name ?? 'No active tenant'}</p>
            </div>
          : // Maintenance
            <div className="flex flex-col gap-0.5">
              <p className='uppercase font-bold text-sm'>Reason</p>
              <p className="line-clamp-2">{activeTicket?.description ?? 'No active ticket'}</p>
            </div>
        }
    </div>
  )
}
