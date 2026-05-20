import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) throw new Error('Not authenticated')

    // 1. Update Payment status
    const { error: payErr } = await supabase
      .from('payments')
      .update({
        status: 'verified',
        is_verified: true,
        verified_by: userId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
    if (payErr) throw payErr

    // 2. Update Invoice status
    const { error: invErr } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)
    if (invErr) throw invErr

    // 3. Extend Contract duration by 1 month
    const { data: invoiceData, error: fetchInvErr } = await supabase
      .from('invoices')
      .select('contract_id, contracts(end_date)')
      .eq('id', invoiceId)
      .single()

    if (fetchInvErr) throw fetchInvErr

    if (invoiceData && invoiceData.contract_id && invoiceData.contracts) {
      // Safely access the first element or direct object depending on Supabase version
      const contract = Array.isArray(invoiceData.contracts) ? invoiceData.contracts[0] : invoiceData.contracts
      const currentEndDate = new Date(contract.end_date as string)
      
      // Add 1 month
      currentEndDate.setMonth(currentEndDate.getMonth() + 1)

      const { error: contractErr } = await supabase
        .from('contracts')
        .update({ end_date: currentEndDate.toISOString().split('T')[0] })
        .eq('id', invoiceData.contract_id)

      if (contractErr) throw contractErr
    }

    await fetchPayments()
  }

  // ── Reject ───────────────────────────────────────────────────────────────────
  // payment → rejected, invoice → back to unpaid
  const rejectPayment = async (paymentId: string, invoiceId: string, reason: string) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) throw new Error('Not authenticated')

    const { error: payErr } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        is_verified: false,
        rejection_reason: reason,
        verified_by: userId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
    if (payErr) throw payErr

    const { error: invErr } = await supabase
      .from('invoices')
      .update({ status: 'unpaid' })
      .eq('id', invoiceId)
    if (invErr) throw invErr

    await fetchPayments()
  }

  // ── Proof URL ────────────────────────────────────────────────────────────────
  // proof_images stores the Supabase Storage object path, not a public URL.
  const getProofUrl = async (storagePath: string): Promise<string> => {
    if (!storagePath) return ''
    const { data } = await supabase.storage.from('payments').createSignedUrl(storagePath, 60)
    return data?.signedUrl || ''
  }

  useEffect(() => {
    fetchPayments()
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
