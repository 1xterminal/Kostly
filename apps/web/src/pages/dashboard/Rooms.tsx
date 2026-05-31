import { useEffect, useState } from "react"
import { useRooms } from "../../hooks/useRooms"

import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import NewRoomModal from "@/components/rooms/NewRoomModal";
import { RoomCard } from "@/components/rooms/RoomCard";
import EditRoomModal from "@/components/rooms/EditRoomModal";
import { useSidebarHeader } from "@/components/layout/sidebar-context";
import { Symbols } from "@/components/ui/MaterialSymbols";

export default function RoomInventory() {
  const { data: rooms, isLoading, error, refetch } = useRooms();

  const { setActions } = useSidebarHeader();

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [isNewRoomOpen, setIsNewRoomOpen] = useState(false);
  const [isSetStatusOpen, setIsSetStatusOpen] = useState(false);

  const [selectedId, setSelectedId] = useState("0");

  useEffect(() => {
    setActions(
      <Button onClick={() => setIsNewRoomOpen(true)}>
        <Symbols name="add_home" />
        New Room
      </Button>,
    );

    return () => setActions(null);
  }, [setActions, setIsNewRoomOpen]);

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading rooms: {(error as Error).message}
      </div>
    );
  }

  const selectId = (id: string) => {
    setSelectedId(id);
    setIsSetStatusOpen(true);
  };

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter))
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    else setActiveFilters([...activeFilters, filter]);
  };

  const filteredRooms = (rooms || []).filter((room) => {
    // Filter by search
    if (search && !room.number.toLowerCase().includes(search.toLowerCase()))
      return false;

    // Filter by chips
    if (activeFilters.length > 0) {
      if (activeFilters.includes("Available") && room.status !== "available")
        return false;
      if (activeFilters.includes("Occupied") && room.status !== "occupied")
        return false;
      if (
        activeFilters.includes("Maintenance") &&
        room.status !== "maintenance"
      )
        return false;
    }

    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/*<div className="flex items-center space-x-4">
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
      </div>*/}
      <div className="flex flex-col gap-4 lg:px-20">
        <Input
          placeholder="Search Rooms"
          leadingIcon={<Symbols name="search" />}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap items-center gap-2 font-bold">
            <span className="mr-1">Filter:</span>
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
      </div>

      <div>
        {
          isLoading ? (
            <div className="p-8">Loading rooms...</div>
          ): filteredRooms?.length === 0 ? (
            <div className="p-8 text-red-500">No rooms found</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
