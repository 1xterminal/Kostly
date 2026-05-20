import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type TenantWithDetails = {
  id: string
  name: string
  email: string
  phone_number: string | null
  tenant_status: string | null
  onboarding: boolean | null
  lifecycle: 'assigned' | 'needs_onboarding' | 'unassigned' | 'archived'
  activeContract?: {
    id: string
    start_date: string
    end_date: string
    monthly_rate: number
    status: string
    room: { id: string; number: string; price: number } | null
  }
  contractCount: number
  ticketCount: number
  paymentState: 'Paid' | 'Pending' | 'Unpaid'
  hasPendingPayment: boolean
}

type PaymentRow = { id: string; status: string }
type InvoiceRow = { id: string; status: string; due_date: string; payments: PaymentRow[] | null }
type RoomRow = { id: string; number: string; price: number }
type TicketRow = { id: string; ticket_status: string }
type ContractRow = { id: string; start_date: string; end_date: string; monthly_rate: number; status: string; room: RoomRow | null; invoices: InvoiceRow[] | null }
type UserRow = { id: string; name: string; email: string; phone_number: string | null; tenant_status: string | null; onboarding: boolean | null; contracts: ContractRow[] | null; maintenance_tickets: TicketRow[] | null }

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async (): Promise<TenantWithDetails[]> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, phone_number, tenant_status, onboarding,
          contracts:contracts!contracts_tenant_id_fkey (
            id, start_date, end_date, monthly_rate, status,
            room:rooms!contracts_room_id_fkey ( id, number, price ),
            invoices:invoices!invoices_contract_id_fkey (
              id, status, due_date,
              payments:payments!payments_invoice_id_fkey ( id, status )
            )
          ),
          maintenance_tickets:maintenance_tickets!maintenance_tickets_reported_by_user_id_fkey (
            id, ticket_status
          )
        `)
        .eq('role', 'tenant')
        .order('name', { ascending: true })

      if (error) throw error

      const users = (data as unknown as UserRow[]) || []

      return users.map((user) => {
        // Find the active contract
        const activeContract = user.contracts?.find((c) => c.status === 'active')
        const lifecycle = user.tenant_status === 'archived'
          ? 'archived'
          : !user.onboarding
            ? 'needs_onboarding'
            : activeContract
              ? 'assigned'
              : 'unassigned'
        
        let paymentState: 'Paid' | 'Pending' | 'Unpaid' = 'Paid'
        let hasPendingPayment = false

        if (activeContract && activeContract.invoices) {
          // Sort invoices by due date descending (latest first)
          const sortedInvoices = [...activeContract.invoices].sort((a, b) => 
            new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
          )
          
          if (sortedInvoices.length > 0) {
            const latestInvoice = sortedInvoices[0]
            if (latestInvoice.status === 'unpaid') {
              paymentState = 'Unpaid'
            } else if (latestInvoice.status === 'pending') {
              paymentState = 'Pending'
            }

            // Check if any payment is pending ('not_verified') for this invoice
            // Or across all invoices if we want to be thorough
            hasPendingPayment = activeContract.invoices.some((inv) =>
              inv.status === 'pending' || inv.payments?.some((p) => p.status === 'not_verified')
            )
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          tenant_status: user.tenant_status ?? 'active',
          onboarding: user.onboarding,
          lifecycle,
          activeContract: activeContract ? {
            id: activeContract.id,
            start_date: activeContract.start_date,
            end_date: activeContract.end_date,
            monthly_rate: activeContract.monthly_rate,
            status: activeContract.status,
            room: activeContract.room,
          } : undefined,
          contractCount: user.contracts?.length ?? 0,
          ticketCount: user.maintenance_tickets?.length ?? 0,
          paymentState,
          hasPendingPayment,
        }
      })
    }
  })
}
