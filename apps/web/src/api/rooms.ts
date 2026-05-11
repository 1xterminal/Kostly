import { supabase } from '@/lib/supabase'
import type { Room } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const roomKeys = {
  all:    ['rooms']               as const,
  detail: (id: string) => ['rooms', id] as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all rooms belonging to the authenticated owner. */
export async function getRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('number', { ascending: true })

  if (error) throw error
  return data
}

/** Fetch a single room by ID. */
export async function getRoomById(id: string): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
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
