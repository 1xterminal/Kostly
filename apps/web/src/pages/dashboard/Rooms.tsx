import { useState } from "react"
import { useRooms } from "../../hooks/useRooms"
import { Search, Plus, MessageCircle, Mail, MoreVertical, Archive, Bell } from 'lucide-react'

import NewRoomModal from "@/components/rooms/NewRoomModal";
import { RoomCard } from "@/components/rooms/RoomCard";
import EditRoomModal from "@/components/rooms/EditRoomModal";


export default function RoomInventory() {
    const { data: rooms, isLoading, error, refetch } = useRooms();

    const [search, setSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const [isNewRoomOpen, setIsNewRoomOpen] = useState(false);
    const [isSetStatusOpen, setIsSetStatusOpen] = useState(false);

    const [selectedId, setSelectedId] = useState("0");

    if (error) {
        return <div className="p-8 text-red-500">Error loading rooms: {(error as Error).message}</div>
    }
    
    console.log(rooms);

    const selectId = (id: string) => {
      setSelectedId(id);
      setIsSetStatusOpen(true);
    }

    const toggleFilter = (filter: string) => {
      if (activeFilters.includes(filter))
        setActiveFilters(activeFilters.filter(f => f !== filter));
      else 
        setActiveFilters([...activeFilters, filter]);
    }

    const filteredRooms = (rooms || []).filter(room => {
      // Filter by search
      if (search && !room.number.toLowerCase().includes(search.toLowerCase())) return false

      // Filter by chips
      if (activeFilters.length > 0) {
        if (activeFilters.includes('Available') && room.status !== 'available') return false
        if (activeFilters.includes('Occupied') && room.status !== 'occupied') return false
        if (activeFilters.includes('Maintenance') && room.status !== 'maintenance') return false
      }

      return true
    })


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
              placeholder="Search rooms"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsNewRoomOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#3B5998] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Room
          </button>
        </div>

        {/* Filter Chips */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-2 items-baseline font-bold">
            <span>Filter:</span>
            {['Available', 'Occupied', 'Maintenance'].map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter as 'Available' | 'Occupied' | 'Maintenance')}
                className={`
                  whitespace-nowrap py-1 px-4 border-2 text-sm
                  ${activeFilters.includes(filter)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400'
                  }
                  rounded-full
                `}
              >
                {filter}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {
            isLoading ? (
              <div className="p-8">Loading rooms...</div>
            ): filteredRooms?.length === 0 ? (
              <div className="p-8 text-red-500">No rooms found</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredRooms?.map((room) => {
                  return <div className="cursor-pointer" key={room.id} onClick={() => selectId(room.id)}>
                    <RoomCard {...room} />
                  </div>
                })}
              </div>
            )
          }
        </div>

        <NewRoomModal
          isOpen={isNewRoomOpen}
          onClose={() => setIsNewRoomOpen(false)}
          onSuccess={() => {
            refetch()
          }}
        />

        <EditRoomModal
          id={selectedId}
          isOpen={isSetStatusOpen}
          onClose={() => setIsSetStatusOpen(false)}
          onSuccess={() => {
            refetch()
          }}
        />
      </div>
    )
}