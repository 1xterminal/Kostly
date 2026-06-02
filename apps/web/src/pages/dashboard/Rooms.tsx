import { useMemo, useState } from "react"
import { useRooms } from "../../hooks/useRooms"

import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import NewRoomModal from "@/components/rooms/NewRoomModal";
import { RoomCard } from "@/components/rooms/RoomCard";
import EditRoomModal from "@/components/rooms/EditRoomModal";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Symbols } from "@/components/ui/MaterialSymbols";
import { DashboardCanvas, DashboardSearchRow, MetricTile } from "@/components/dashboardPrimitives";

type RoomFilter = "All" | "Available" | "Occupied" | "Maintenance";

export default function RoomInventory() {
  const { data: rooms, isLoading, error, refetch } = useRooms();

  const { toggle } = useSidebar();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<RoomFilter>("All");

  const [isNewRoomOpen, setIsNewRoomOpen] = useState(false);
  const [isSetStatusOpen, setIsSetStatusOpen] = useState(false);

  const [selectedId, setSelectedId] = useState("0");

  const selectId = (id: string) => {
    setSelectedId(id);
    setIsSetStatusOpen(true);
  };

  const counts = useMemo(() => {
    const list = rooms ?? []
    return {
      All: list.length,
      Available: list.filter((room) => room.status === "available").length,
      Occupied: list.filter((room) => room.status === "occupied").length,
      Maintenance: list.filter((room) => room.status === "maintenance").length,
    } satisfies Record<RoomFilter, number>
  }, [rooms])

  const filteredRooms = (rooms || []).filter((room) => {
    const activeContract = room.contracts?.find((contract) => contract.status === "active")
    const activeTicket = room.maintenance_tickets?.find((ticket) =>
      ticket.ticket_status === "reported" || ticket.ticket_status === "in_progress"
    )
    const haystack = [
      room.number,
      activeContract?.tenant?.name ?? "",
      activeTicket?.description ?? "",
    ].join(" ").toLowerCase()

    if (search && !haystack.includes(search.toLowerCase()))
      return false;

    if (activeFilter !== "All" && room.status !== activeFilter.toLowerCase())
      return false;

    return true;
  });

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading rooms: {(error as Error).message}
      </div>
    );
  }

  return (
    <DashboardCanvas className="space-y-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-[28px] font-bold text-[#111111]">
          <button type="button" onClick={toggle} aria-label="Toggle sidebar" className="grid h-8 w-8 place-items-center rounded-md text-[#111111] hover:bg-white">
            <Symbols name="menu" />
          </button>
          Room Inventory
        </h1>

        <Button onClick={() => setIsNewRoomOpen(true)}>
          <Symbols name="add_home" />
          New Room
        </Button>
      </div>

      <DashboardSearchRow>
        <Input
          placeholder="Search rooms"
          leadingIcon={<Symbols name="search" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </DashboardSearchRow>

      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
        {(["All", "Available", "Occupied", "Maintenance"] as RoomFilter[]).map((filter) => (
          <MetricTile
            key={filter}
            label={filter}
            value={counts[filter]}
            active={activeFilter === filter}
            tone={filter === "Available" ? "green" : filter === "Maintenance" ? "orange" : "blue"}
            onClick={() => setActiveFilter(filter)}
          />
        ))}
      </div>

      <div className="mx-auto w-full max-w-5xl">
        {
          isLoading ? (
            <div className="p-8">Loading rooms...</div>
          ): filteredRooms?.length === 0 ? (
            <div className="rounded-md border border-[#C8C8C8] bg-[#F7F7F7] p-8 text-center text-[#858585]">No rooms found.</div>
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
    </DashboardCanvas>
  )
}
