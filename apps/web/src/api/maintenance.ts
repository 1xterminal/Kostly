import { supabase } from '@/lib/supabase'
import type { MaintenanceTicket, TicketReply, TicketWithRelations } from '@/types'
import type { Enums } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const ticketKeys = {
  all:    ['tickets']                    as const,
  detail: (id: string) => ['tickets', id] as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all maintenance tickets with room + reporter info. */
export async function getTickets(): Promise<TicketWithRelations[]> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select(`
      *,
      room:rooms ( id, number ),
      reporter:users!maintenance_tickets_reported_by_user_id_fkey ( id, name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as TicketWithRelations[]
}

/** Fetch a single ticket with all replies. */
export async function getTicketById(id: string): Promise<TicketWithRelations> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select(`
      *,
      room:rooms ( id, number ),
      reporter:users!maintenance_tickets_reported_by_user_id_fkey ( id, name, email ),
      replies:ticket_replies (
        *,
        sender:users!ticket_replies_sender_id_fkey ( id, name, role )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as TicketWithRelations
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Update ticket status. */
export async function updateTicketStatus(
  id: string,
  ticket_status: Enums<'ticket_status_enum'>,
  resolved_message?: string,
): Promise<MaintenanceTicket> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .update({
      ticket_status,
      ...(resolved_message ? { resolved_message, resolved_at: new Date().toISOString() } : {}),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Add a reply to a ticket (sender_id comes from authenticated user). */
export async function replyToTicket(ticketId: string, message: string): Promise<TicketReply> {
  const senderId = (await supabase.auth.getUser()).data.user?.id
  if (!senderId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('ticket_replies')
    .insert({ ticket_id: ticketId, message, sender_id: senderId })
    .select()
    .single()

  if (error) throw error
  return data
}
