import { supabase } from '@/lib/supabase'
import type { Room, RoomWithRelations } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const roomKeys = {
  all:    ['rooms']               as const,
  detail: (id: string) => ['rooms', id] as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all rooms belonging to the authenticated owner with tenant + maintenance context. */
export async function getRooms(): Promise<RoomWithRelations[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      contracts:contracts!contracts_room_id_fkey (
        id,
        tenant_id,
        start_date,
        end_date,
        monthly_rate,
        status,
        tenant:users!contracts_tenant_id_fkey ( id, name, email, phone_number )
      ),
      maintenance_tickets:maintenance_tickets!maintenance_tickets_room_id_fkey (
        id,
        description,
        ticket_status,
        date_created,
        created_at,
        resolved_at
      )
    `)
    .order('number', { ascending: true })

  if (error) throw error
  return data as RoomWithRelations[]
}

/** Fetch a single room by ID with tenant + maintenance context. */
export async function getRoomById(id: string): Promise<RoomWithRelations> {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      contracts:contracts!contracts_room_id_fkey (
        id,
        tenant_id,
        start_date,
        end_date,
        monthly_rate,
        status,
        tenant:users!contracts_tenant_id_fkey ( id, name, email, phone_number )
      ),
      maintenance_tickets:maintenance_tickets!maintenance_tickets_room_id_fkey (
        id,
        description,
        ticket_status,
        date_created,
        created_at,
        resolved_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as RoomWithRelations
}

// ─── Write ────────────────────────────────────────────────────────────────────

export type CreateRoomInput = Pick<Room, 'number' | 'price' | 'wifi_password'>

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const ownerId = (await supabase.auth.getUser()).data.user?.id
  if (!ownerId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('rooms')
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single()

  if (error) throw error
  return data
}

export type UpdateRoomInput = Partial<Pick<Room, 'number' | 'price' | 'status' | 'wifi_password'>>

export async function updateRoom(id: string, input: UpdateRoomInput): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id)

  if (error) throw error
}
