import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { callEdgeFunction } from '../lib/edgeFunctions'

// ── Types ──────────────────────────────────────────────────────────────────────
export type PaymentWithDetails = {
  id: string
  invoice_id: string
  tenant_id: string
  proof_images: string          // Supabase Storage object path
  transaction_date: string
  is_verified: boolean
  status: 'not_verified' | 'verified' | 'rejected'
  rejection_reason?: string | null
  verified_by?: string | null
  verified_at?: string | null
  created_at: string
  invoices: {
    id: string
    total_amount: number
    billing_month: string
    due_date: string
    status: string
    contracts: {
      id: string
      room_id: string
      rooms: {
        number: string
      }
    }
  }
  tenant: {
    name: string
    email: string
    phone_number: string | null
  }
  dispute_tickets?: {
    id: string
    ticket_status: string
    ticket_category: string
  }[] | null
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function usePayments() {
  const [data, setData] = useState<PaymentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: rows, error: fetchError } = await supabase
        .from('payments')
        .select(`
          id,
          invoice_id,
          tenant_id,
          proof_images,
          transaction_date,
          is_verified,
          status,
          rejection_reason,
          verified_by,
          verified_at,
          created_at,
          invoices (
            id,
            total_amount,
            billing_month,
            due_date,
            status,
            contracts (
              id,
              room_id,
              rooms ( number )
            )
          ),
          tenant:users!payments_tenant_id_fkey (
            name,
            email,
            phone_number
          ),
          dispute_tickets:maintenance_tickets!maintenance_tickets_payment_id_fkey (
            id,
            ticket_status,
            ticket_category
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setData((rows as unknown as PaymentWithDetails[]) ?? [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Approve ──────────────────────────────────────────────────────────────────
  // payment → verified, invoice → paid
  const approvePayment = async (paymentId: string, invoiceId: string) => {
    await callEdgeFunction('review-payment', {
      payment_id: paymentId,
      invoice_id: invoiceId,
      action: 'approve',
    })

    await fetchPayments()
  }

  // ── Reject ───────────────────────────────────────────────────────────────────
  // payment → rejected, invoice → back to unpaid
  const rejectPayment = async (paymentId: string, invoiceId: string, reason: string) => {
    await callEdgeFunction('review-payment', {
      payment_id: paymentId,
      invoice_id: invoiceId,
      action: 'reject',
      rejection_reason: reason,
    })

    await fetchPayments()
  }

  // ── Proof URL ────────────────────────────────────────────────────────────────
  // proof_images stores the Supabase Storage object path, not a public URL.
  const getProofUrl = async (storagePath: string): Promise<string> => {
    if (!storagePath) return ''
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(storagePath, 60)
    return data?.signedUrl || ''
  }

  useEffect(() => {
    void Promise.resolve().then(fetchPayments)
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch: fetchPayments,
    approvePayment,
    rejectPayment,
    getProofUrl,
  }
}
