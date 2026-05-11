import { supabase } from '@/lib/supabase'
import type { Contract, Invoice, ContractWithRelations, InvoiceWithRelations } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const contractKeys = {
  all:    ['contracts']                    as const,
  detail: (id: string) => ['contracts', id] as const,
}

export const invoiceKeys = {
  all:    ['invoices']                     as const,
  detail: (id: string) => ['invoices', id] as const,
}

// ─── Contracts ────────────────────────────────────────────────────────────────

/** Fetch all contracts with room + tenant info. */
export async function getContracts(): Promise<ContractWithRelations[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      room:rooms ( id, number, price ),
      tenant:users!contracts_tenant_id_fkey ( id, name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ContractWithRelations[]
}

/** Fetch a single contract with full details. */
export async function getContractById(id: string): Promise<Contract> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

/** Fetch all invoices with contract + tenant info. */
export async function getInvoices(): Promise<InvoiceWithRelations[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      contract:contracts ( id, monthly_rate, status ),
      tenant:users!invoices_tenant_id_fkey ( id, name, email )
    `)
    .order('due_date', { ascending: false })

  if (error) throw error
  return data as InvoiceWithRelations[]
}

/** Fetch a single invoice by ID. */
export async function getInvoiceById(id: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
