import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTicketById, getTickets, replyToTicket, ticketKeys, updateTicketStatus } from '@/api/maintenance'
import type { Enums, TicketWithRelations } from '@/types'
import { Input } from '@/components/ui/Field'
import { Symbols } from '@/components/ui/MaterialSymbols'

type TicketStatus = Enums<'ticket_status_enum'>

const statusOptions: TicketStatus[] = ['reported', 'in_progress', 'resolved', 'closed']

export default function Tickets() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const ticketsQuery = useQuery({
    queryKey: ticketKeys.all,
    queryFn: getTickets,
  })

  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data])
  const selectedTicketId = selectedId ?? tickets[0]?.id ?? null
  const filteredTickets = useMemo(() => {
    const needle = search.toLowerCase().trim()
    if (!needle) return tickets
    return tickets.filter(ticket => {
      return [
        ticket.description,
        ticket.reporter?.name,
        ticket.room?.number,
        shortTicketId(ticket.id),
      ].some(value => value?.toLowerCase().includes(needle))
    })
  }, [search, tickets])

  return (
    <div className="h-full min-h-0 overflow-hidden px-6 py-4 text-[#111111]">
      <div className="mx-auto h-full min-h-0 max-w-7xl">
        <div className="grid h-full min-h-0 grid-rows-[minmax(260px,40%)_1fr] gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="min-h-0">
            {/*<label className="relative block">
              <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#151515]" strokeWidth={2.5} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tickets"
                className="h-12 w-full rounded-lg border border-[#9b9b9b] bg-white pl-14 pr-4 text-base outline-none placeholder:text-[#8b8b8b] focus:border-[#3341A5] focus:ring-2 focus:ring-[#3341A5]/20"
              />
            </label>*/}

            <Input
              leadingIcon={<Symbols name="search" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets"
            />

            <div className="mt-6 h-[calc(100%-72px)] overflow-y-auto rounded-lg border border-[#b7b7b7] bg-white shadow-[0_8px_16px_rgba(0,0,0,0.16)]">
              {ticketsQuery.isLoading ? (
                <div className="p-6 text-sm text-gray-500">Loading tickets...</div>
              ) : ticketsQuery.error ? (
                <div className="p-6 text-sm text-red-700">{(ticketsQuery.error as Error).message}</div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No tickets found.</div>
              ) : (
                filteredTickets.map(ticket => (
                  <TicketListItem
                    key={ticket.id}
                    ticket={ticket}
                    active={ticket.id === selectedTicketId}
                    onClick={() => setSelectedId(ticket.id)}
                  />
                ))
              )}
            </div>
          </aside>

          <TicketDetail ticketId={selectedTicketId} />
        </div>
      </div>
    </div>
  )
}

function TicketListItem({ ticket, active, onClick }: { ticket: TicketWithRelations; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full border-b border-[#d8d8d8] px-5 py-4 text-left transition ${active ? 'bg-[#ededed]' : 'bg-white hover:bg-[#f7f7f7]'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold tracking-tight">{ticketTitle(ticket)}</h2>
          <p className="mt-0.5 truncate text-base">
            Reported by <span className="font-bold">{ticket.reporter?.name ?? 'Unknown'}</span>
          </p>
          <p className={`mt-2 text-xs font-extrabold tracking-[0.12em] ${isUnresolved(ticket.ticket_status) ? 'text-[#d44b14]' : 'text-[#4f6f52]'}`}>
            {statusLabel(ticket.ticket_status)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base text-[#888888]">{relativeTime(ticket.created_at)}</p>
          <p className="mt-10 text-base font-bold text-[#7c7c7c]">#{shortTicketId(ticket.id)}</p>
        </div>
      </div>
    </button>
  )
}

function TicketDetail({ ticketId }: { ticketId: string | null }) {
  const queryClient = useQueryClient()
  const ticketQuery = useQuery({
    queryKey: ticketId ? ticketKeys.detail(ticketId) : ['tickets', 'empty'],
    queryFn: () => getTicketById(ticketId!),
    enabled: Boolean(ticketId),
  })

  if (!ticketId) return <main className="min-h-0 overflow-y-auto pt-24 text-[#777777]">Select a ticket.</main>
  if (ticketQuery.isLoading) return <main className="min-h-0 overflow-y-auto pt-24 text-[#777777]">Loading ticket detail...</main>
  if (ticketQuery.error || !ticketQuery.data) {
    return <main className="min-h-0 overflow-y-auto pt-24 text-red-700">{(ticketQuery.error as Error)?.message ?? 'Ticket not found'}</main>
  }

  return (
    <TicketDetailContent
      key={ticketQuery.data.id}
      ticket={ticketQuery.data}
      onChanged={() => {
        queryClient.invalidateQueries({ queryKey: ticketKeys.all })
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketQuery.data.id) })
      }}
    />
  )
}

function TicketDetailContent({ ticket, onChanged }: { ticket: TicketWithRelations; onChanged: () => void }) {
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState<TicketStatus>(ticket.ticket_status)

  const updateMutation = useMutation({
    mutationFn: (nextStatus: TicketStatus) => updateTicketStatus(ticket.id, nextStatus),
    onSuccess: onChanged,
  })

  const replyMutation = useMutation({
    mutationFn: () => replyToTicket(ticket.id, reply.trim()),
    onSuccess: () => {
      setReply('')
      onChanged()
    },
  })

  const replies = ticket.replies ?? []

  return (
    <main className="min-h-0 overflow-y-auto pb-10 pr-2 pt-10">
      <div className="flex justify-between items-center gap-6">
        <div className="flex flex-wrap items-center gap-4 font-bold">
          <span className="inline-flex items-center gap-2">
            <Symbols name="confirmation_number" />
            #{shortTicketId(ticket.id)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Symbols name="bed" />
            Room #{ticket.room?.number ?? '-'}
          </span>
        </div>

        <label className="relative">
          <select
            value={status}
            onChange={(event) => {
              const nextStatus = event.target.value as TicketStatus
              setStatus(nextStatus)
              updateMutation.mutate(nextStatus)
            }}
            className="appearance-none rounded-full border border-[#e89573] bg-[#fff1ea] px-5 py-2 pr-10 text-sm font-extrabold uppercase tracking-[0.12em] text-[#d44b14] outline-none"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{statusLabel(option)}</option>
            ))}
          </select>
          {/*<span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d44b14]">⌄</span>*/}
          <Symbols className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d44b14]" name="arrow_drop_down" />
        </label>
      </div>

      <h2 className="mt-6 max-w-4xl text-4xl font-medium tracking-tight">{ticketTitle(ticket)}</h2>
      <p className="mt-4 text-lg">
        Reported by <span className="font-bold">{ticket.reporter?.name ?? 'Unknown'}</span> on {formatFullDate(ticket.created_at)}
      </p>
      <p className="mt-6 max-w-4xl leading-snug">{ticket.description}</p>

      <section className="mt-8 max-w-5xl">
        <h3 className="font-extrabold uppercase tracking-wide">{replies.length} Response{replies.length === 1 ? '' : 's'}</h3>
        <div className="my-6 space-y-5">
          {replies.map(replyItem => (
            <div key={replyItem.id} className="flex gap-5">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[#d9d9d9]" />
              <div>
                <p>
                  <span className="font-bold">{replySenderName(replyItem, ticket)}</span>
                  <span className="text-[#555555]"> • {relativeTime(replyItem.created_at)}</span>
                </p>
                <p className="leading-snug">{replyItem.message}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          // className="mt-8 flex h-20 items-center gap-5 rounded-lg border border-[#8f8f8f] bg-white px-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (reply.trim()) replyMutation.mutate()
          }}
        >
          {/*<div className="h-12 w-12 shrink-0 rounded-full bg-[#d9d9d9]" />
          <input
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Enter message"
            className="min-w-0 flex-1 bg-transparent text-2xl outline-none placeholder:text-[#8d8d8d]"
          />
          <button type="submit" disabled={!reply.trim() || replyMutation.isPending} className="text-[#777777] disabled:opacity-40">
            <Send className="h-8 w-8" strokeWidth={2.5} />
          </button>*/}
          <Input
            placeholder="Enter message"
            leadingIcon={<div className="h-8 w-8 shrink-0 rounded-full bg-[#d9d9d9]" />}
            trailingIcon={
              <button type="submit" disabled={!reply.trim() || replyMutation.isPending} className="text-[#777777] disabled:opacity-40">
                {/*<Send className="h-8 w-8" strokeWidth={2.5} />*/}
                <Symbols name="send" />
              </button>
            }
            onChange={(event) => setReply(event.target.value)}
            style={{ height: 56 }}
          />
        </form>
        {replyMutation.error && <p className="mt-3 text-sm text-red-600">{(replyMutation.error as Error).message}</p>}
        {updateMutation.error && <p className="mt-3 text-sm text-red-600">{(updateMutation.error as Error).message}</p>}
      </section>
    </main>
  )
}

function ticketTitle(ticket: TicketWithRelations) {
  const firstLine = ticket.description.split(/\r?\n/)[0]
  const firstSentence = firstLine.split(/[.!?]/)[0]
  return firstSentence.length > 44 ? `${firstSentence.slice(0, 44)}...` : firstSentence
}

function shortTicketId(id: string) {
  return id.replaceAll('-', '').slice(0, 4).toUpperCase()
}

function isUnresolved(status: TicketStatus) {
  return status === 'reported' || status === 'in_progress'
}

function statusLabel(status: TicketStatus) {
  if (status === 'reported' || status === 'in_progress') return 'Unresolved'
  if (status === 'resolved') return 'Resolved'
  return 'Closed'
}

function replySenderName(reply: NonNullable<TicketWithRelations['replies']>[number], ticket: TicketWithRelations) {
  if (reply.sender?.name) return reply.sender.name
  if (reply.sender_id === ticket.reported_by_user_id) return ticket.reporter?.name ?? 'Tenant'
  return 'Owner'
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.round(hours / 24)} d ago`
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
