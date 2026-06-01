import { supabase } from '@/lib/supabase'
import type { MaintenanceTicket, TicketReply, TicketWithRelations } from '@/types'
import type { Enums } from '@/types'

type UserAvatar = {
  avatar_path?: string | null
  avatar_url?: string | null
}

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
      reporter:users!maintenance_tickets_reported_by_user_id_fkey ( id, name, email, avatar_path )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  const tickets = data as TicketWithRelations[]
  await attachTicketAvatarUrls(tickets)
  return tickets
}

/** Fetch a single ticket with all replies. */
export async function getTicketById(id: string): Promise<TicketWithRelations> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select(`
      *,
      room:rooms ( id, number ),
      reporter:users!maintenance_tickets_reported_by_user_id_fkey ( id, name, email, avatar_path ),
      replies:ticket_replies (
        *,
        sender:users!ticket_replies_sender_id_fkey ( id, name, role, avatar_path )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  const ticket = data as TicketWithRelations
  await attachTicketAvatarUrls(ticket)
  return ticket
}

async function attachTicketAvatarUrls(payload: TicketWithRelations | TicketWithRelations[]) {
  const tickets = Array.isArray(payload) ? payload : [payload]
  const users = tickets.flatMap((ticket) => [
    ticket.reporter,
    ...(ticket.replies?.map((reply) => reply.sender) ?? []),
  ]).filter(Boolean) as UserAvatar[]

  const paths = [...new Set(users.map((user) => user.avatar_path).filter(Boolean) as string[])]
  if (paths.length === 0) return

  const { data } = await supabase.storage
    .from('profile-pictures')
    .createSignedUrls(paths, 60 * 60 * 24 * 365)

  const signedUrlsMap: Record<string, string> = {}
  data?.forEach((item) => {
    if (item.path && item.signedUrl) signedUrlsMap[item.path] = item.signedUrl
  })

  users.forEach((user) => {
    user.avatar_url = user.avatar_path ? signedUrlsMap[user.avatar_path] ?? null : null
  })
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
