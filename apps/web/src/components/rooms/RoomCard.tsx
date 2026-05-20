import type { Room } from '@/types'

export function RoomCard(roomData: Room) {
    return (
        <div key={roomData.id} className="
            h-[160px] p-5 rounded-2xl
            border border-gray-300
            bg-white shadow-sm
            flex flex-col justify-between
        ">
            <div className="flex justify-between">
                <h1 className="font-medium text-2xl">#{roomData.number}</h1>
                <span className="uppercase font-bold text-sm border border-gray-300 px-4 py-1 rounded-full">
                    {roomData.status}
                </span>
            </div>
            <div className="flex flex-col gap-1">
                <p className='uppercase font-bold text-sm'>Price</p>
                <p>{roomData.price}</p>
            </div>
        </div>
    )
}