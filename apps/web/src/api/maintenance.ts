import { supabase } from '@/lib/supabase'
import type { MaintenanceTicket, TicketReply, TicketStatus } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const ticketKeys = {
  all:    ['tickets']                    as const,
  detail: (id: string) => ['tickets', id] as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all maintenance tickets with room + reporter info. */
export async function getTickets(): Promise<MaintenanceTicket[]> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select(`
      *,
      room:rooms ( id, number ),
      reporter:users!maintenance_tickets_reported_by_user_id_fkey ( id, name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Fetch a single ticket with all replies. */
export async function getTicketById(id: string): Promise<MaintenanceTicket> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select(`
      *,
      room:rooms ( * ),
      reporter:users!maintenance_tickets_reported_by_user_id_fkey ( * ),
      replies:ticket_replies (
        *,
        sender:users!ticket_replies_sender_id_fkey ( id, name, role )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Update ticket status. */
export async function updateTicketStatus(
  id: string,
  ticket_status: TicketStatus,
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

/** Add a reply to a ticket. */
export async function replyToTicket(ticketId: string, message: string): Promise<TicketReply> {
  const { data, error } = await supabase
    .from('ticket_replies')
    .insert({ ticket_id: ticketId, message })
    .select()
    .single()

  if (error) throw error
  return data
}
