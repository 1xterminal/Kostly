import { supabase } from '@/lib/supabase'
import type { AppUser } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const tenantKeys = {
  all:    ['tenants']               as const,
  detail: (id: string) => ['tenants', id] as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all tenants (role='tenant') whose contract is under this owner's rooms. */
export async function getTenants(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'tenant')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/** Fetch a single tenant by ID. */
export async function getTenantById(id: string): Promise<AppUser> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ─── Write ────────────────────────────────────────────────────────────────────

export type UpdateTenantInput = Partial<Pick<AppUser, 'name' | 'phone_number' | 'tenant_status'>>

export async function updateTenant(id: string, input: UpdateTenantInput): Promise<AppUser> {
  const { data, error } = await supabase
    .from('users')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
