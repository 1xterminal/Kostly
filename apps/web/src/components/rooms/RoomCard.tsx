import type { RoomWithRelations } from '@/types'
import { StatusPill } from '@/components/dashboardPrimitives'

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function RoomCard(roomData: RoomWithRelations) {
  const activeContract = roomData.contracts?.find(contract => contract.status === 'active')
  const activeTicket = roomData.maintenance_tickets?.find(ticket =>
    ticket.ticket_status === 'reported' || ticket.ticket_status === 'in_progress'
  )

  const theme = {
    "available": {
      "cardBackground": "from-[#0fc95c]/0 to-[#0fc95c]/10",
      "tone": "green" as const,
    },
    "occupied": {
      "cardBackground": "from-[#0b7abe]/0 to-[#0b7abe]/10",
      "tone": "blue" as const,
    },
    "maintenance": {
      "cardBackground": "from-[#cb460c]/0 to-[#cb460c]/10",
      "tone": "orange" as const,
    }
  }

  return (
    <div key={roomData.id} className={`
      h-[140px] p-5 rounded-md
      border border-[#C8C8C8]
      bg-white shadow-[0_2px_4px_rgba(0,0,0,0.12)]
      flex flex-col justify-between
      bg-linear-to-b ${theme[roomData.status].cardBackground}
    `}>
        <div className="flex justify-between items-start">
          <h1 className="text-[30px] font-bold leading-none text-[#111111]">#{roomData.number}</h1>
          <StatusPill tone={theme[roomData.status].tone}>
            {roomData.status}
          </StatusPill>
        </div>
        {
          roomData.status === 'available' ?
            <div className="flex flex-col gap-0.5">
              <p className='text-[13px] font-bold uppercase tracking-wide text-[#111111]'>Price</p>
              <p className="text-[15px] text-[#111111]">{currencyFormatter.format(Number(roomData.price))}</p>
            </div>
          : roomData.status === 'occupied' ?
            <div className="flex flex-col gap-0.5">
              <p className='text-[13px] font-bold uppercase tracking-wide text-[#111111]'>Tenant</p>
              <p className="truncate text-[15px] text-[#111111]">{activeContract?.tenant?.name ?? 'No active tenant'}</p>
            </div>
          : // Maintenance
            <div className="flex flex-col gap-0.5">
              <p className='text-[13px] font-bold uppercase tracking-wide text-[#111111]'>Reason</p>
              <p className="line-clamp-2 text-[15px] text-[#111111]">{activeTicket?.description ?? 'No active ticket'}</p>
            </div>
        }
    </div>
  )
}
