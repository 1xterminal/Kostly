import { getRooms } from "@/api/rooms"
import { useQuery } from "@tanstack/react-query"

export function useRooms() {
    return useQuery({
        queryKey: ['rooms'],
        queryFn: async () => getRooms()
    })
}