import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type TenantWithDetails = {
  id: string
  name: string
  email: string
  phone_number: string | null
  tenant_status: string | null
  activeContract?: {
    id: string
    start_date: string
    end_date: string
    room: { number: string } | null
  }
  paymentState: 'Paid' | 'Unpaid'
  hasPendingPayment: boolean
}

type PaymentRow = { id: string; status: string }
type InvoiceRow = { id: string; status: string; due_date: string; payments: PaymentRow[] | null }
type RoomRow = { number: string }
type ContractRow = { id: string; start_date: string; end_date: string; status: string; rooms: RoomRow | null; invoices: InvoiceRow[] | null }
type UserRow = { id: string; name: string; email: string; phone_number: string | null; tenant_status: string | null; contracts: ContractRow[] | null }

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async (): Promise<TenantWithDetails[]> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, name, email, phone_number, tenant_status,
          contracts (
            id, start_date, end_date, status,
            rooms ( number ),
            invoices (
              id, status, due_date,
              payments ( id, status )
            )
          )
        `)
        .eq('role', 'tenant')

      if (error) throw error

      const users = (data as unknown as UserRow[]) || []

      return users.map((user) => {
        // Find the active contract
        const activeContract = user.contracts?.find((c) => c.status === 'active')
        
        let paymentState: 'Paid' | 'Unpaid' = 'Paid'
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
            }

            // Check if any payment is pending ('not_verified') for this invoice
            // Or across all invoices if we want to be thorough
            hasPendingPayment = activeContract.invoices.some((inv) => 
              inv.payments?.some((p) => p.status === 'not_verified')
            )
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          tenant_status: user.tenant_status,
          activeContract: activeContract ? {
            id: activeContract.id,
            start_date: activeContract.start_date,
            end_date: activeContract.end_date,
            room: activeContract.rooms,
          } : undefined,
          paymentState,
          hasPendingPayment,
        }
      })
    }
  })
}
