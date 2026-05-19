import { supabase } from '@/lib/supabase'
import type { Payment } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const paymentKeys = {
  all:    ['payments']                   as const,
  detail: (id: string) => ['payments', id] as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all payments, joined with invoice + tenant info. */
export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices ( id, due_date, total_amount, billing_month, status ),
      tenant:users!payments_tenant_id_fkey ( id, name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Fetch a single payment by ID with full join. */
export async function getPaymentById(id: string): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices ( * ),
      tenant:users!payments_tenant_id_fkey ( * )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Mark a payment as verified. */
export async function verifyPayment(id: string): Promise<Payment> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'verified',
      is_verified: true,
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Reject a payment with a reason. */
export async function rejectPayment(id: string, rejection_reason: string): Promise<Payment> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
      is_verified: false,
      rejection_reason,
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
