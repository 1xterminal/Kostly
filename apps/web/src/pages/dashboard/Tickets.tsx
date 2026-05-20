import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Clock3, MessageSquare, Send, Wrench } from 'lucide-react'
import { getTicketById, getTickets, replyToTicket, ticketKeys, updateTicketStatus } from '@/api/maintenance'
import type { Enums, TicketWithRelations } from '@/types'

type TicketStatus = Enums<'ticket_status_enum'>

const statusLabels: Record<TicketStatus, string> = {
  reported: 'Reported',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const statusStyles: Record<TicketStatus, string> = {
  reported: 'border-amber-200 bg-amber-50 text-amber-700',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  closed: 'border-gray-200 bg-gray-50 text-gray-600',
}

const statusIcons: Record<TicketStatus, typeof AlertCircle> = {
  reported: AlertCircle,
  in_progress: Wrench,
  resolved: CheckCircle2,
  closed: Clock3,
}

const statusOptions = Object.keys(statusLabels) as TicketStatus[]

export default function Tickets() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | TicketStatus>('all')

  const ticketsQuery = useQuery({
    queryKey: ticketKeys.all,
    queryFn: getTickets,
  })

  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data])
  const selectedTicketId = selectedId ?? tickets[0]?.id ?? null

  const filteredTickets = useMemo(() => (
    filter === 'all' ? tickets : tickets.filter(ticket => ticket.ticket_status === filter)
  ), [filter, tickets])

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance Center</h1>
          <p className="mt-1 text-sm text-gray-500">Track tenant tickets, update status, and keep reply history in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
          {statusOptions.map(status => (
            <FilterButton key={status} active={filter === status} onClick={() => setFilter(status)}>
              {statusLabels[status]}
            </FilterButton>
          ))}
        </div>
      </div>

      {ticketsQuery.isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading tickets...</div>
      ) : ticketsQuery.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm text-red-700">
          {(ticketsQuery.error as Error).message}
        </div>
      ) : (
        <div className="grid min-h-[560px] grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Tickets</h2>
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No tickets found.</div>
              ) : filteredTickets.map(ticket => (
                <TicketListItem
                  key={ticket.id}
                  ticket={ticket}
                  active={ticket.id === selectedTicketId}
                  onClick={() => setSelectedId(ticket.id)}
                />
              ))}
            </div>
          </div>

          <TicketDetail ticketId={selectedTicketId} />
        </div>
      )}
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

function TicketListItem({ ticket, active, onClick }: { ticket: TicketWithRelations; active: boolean; onClick: () => void }) {
  const Icon = statusIcons[ticket.ticket_status]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full border-b border-gray-100 px-5 py-4 text-left transition ${
        active ? 'bg-blue-50/70' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyles[ticket.ticket_status]}`}>
              <Icon className="h-3.5 w-3.5" />
              {statusLabels[ticket.ticket_status]}
            </span>
            <span className="text-xs text-gray-400">Room #{ticket.room?.number ?? '-'}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900">{ticket.description}</p>
          <p className="mt-1 text-xs text-gray-500">{ticket.reporter?.name ?? 'Unknown tenant'}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-400">{formatDate(ticket.created_at)}</span>
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

  if (!ticketId) {
    return <div className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Select a ticket.</div>
  }

  if (ticketQuery.isLoading) {
    return <div className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading ticket detail...</div>
  }

  if (ticketQuery.error || !ticketQuery.data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        {(ticketQuery.error as Error)?.message ?? 'Ticket not found'}
      </div>
    )
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
  const [status, setStatus] = useState<TicketStatus>(ticket.ticket_status)
  const [resolution, setResolution] = useState(ticket.resolved_message ?? '')
  const [reply, setReply] = useState('')

  const updateMutation = useMutation({
    mutationFn: () => updateTicketStatus(ticket.id, status, resolution.trim() || undefined),
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[ticket.ticket_status]}`}>
                {statusLabels[ticket.ticket_status]}
              </span>
              <span className="text-sm text-gray-500">Room #{ticket.room?.number ?? '-'}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900">{ticket.description}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Reported by {ticket.reporter?.name ?? 'Unknown tenant'} on {formatDate(ticket.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 p-6">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              <MessageSquare className="h-4 w-4" />
              Replies
            </h3>
            <div className="mt-4 space-y-3">
              {replies.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500">No replies yet.</div>
              ) : replies.map(replyItem => (
                <div key={replyItem.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {replyItem.sender?.name ?? 'Unknown'} <span className="font-normal text-gray-500">({replyItem.sender?.role ?? 'user'})</span>
                    </p>
                    <span className="text-xs text-gray-400">{formatDate(replyItem.created_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{replyItem.message}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (reply.trim()) replyMutation.mutate()
            }}
          >
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              rows={3}
              placeholder="Write a reply to the tenant..."
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!reply.trim() || replyMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-[#3045AF] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </button>
            {replyMutation.error && <p className="text-sm text-red-600">{(replyMutation.error as Error).message}</p>}
          </form>
        </div>

        <aside className="border-t border-gray-200 bg-gray-50 p-6 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Ticket Status</h3>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">State</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TicketStatus)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{statusLabels[option]}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Resolution note</span>
              <textarea
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                rows={4}
                placeholder="Used when resolving the ticket"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="w-full rounded-md bg-[#3045AF] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Status'}
            </button>
            {updateMutation.error && <p className="text-sm text-red-600">{(updateMutation.error as Error).message}</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
