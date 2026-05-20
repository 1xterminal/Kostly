import { supabase } from '@/lib/supabase'
import type { Report } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const reportKeys = {
  all:           ['reports']                                           as const,
  byMonth:       (monthYear: string) => ['reports', monthYear]         as const,
  revenue:       (year: number)      => ['reports', 'revenue', year]   as const,
  occupancy:     ['reports', 'occupancy']                              as const,
  paymentStatus: ['reports', 'paymentStatus']                          as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all monthly reports for the authenticated owner, newest first. */
export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Fetch a single report by ID. */
export async function getReportById(id: string): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getRevenueData(year: number) {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  const { data, error } = await supabase
    .from('reports')
    .select('month_year, total_revenue')
    .gte('month_year', startDate)
    .lte('month_year', endDate)
    .order('month_year', { ascending: true })
  if (error) throw error
  // Transform data for recharts: { name: 'Jan', revenue: 5000 }
  return Array.from({ length: 12 }, (_, i) => {
    const monthStr = new Date(year, i, 1).toLocaleString('default', { month: 'short' })
    const monthData = data?.find(d => new Date(d.month_year).getMonth() === i)
    
    return {
      name: monthStr,
      revenue: monthData ? Number(monthData.total_revenue) : 0
    }
  })
}
export async function getOccupancyStats() {
  const { data, error, count } = await supabase
    .from('rooms')
    .select('status', { count: 'exact' })
  if (error) throw error
  const occupied = data?.filter(r => r.status === 'occupied').length || 0
  const available = data?.filter(r => r.status === 'available').length || 0
  const maintenance = data?.filter(r => r.status === 'maintenance').length || 0
  
  return { occupied, available, maintenance, total: count || 0 }
}
export async function getPaymentStatus() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('invoices')
    .select('status')
    .eq('billing_month', firstDay)
  if (error) throw error
  const paid = data?.filter(i => i.status === 'paid').length || 0
  const pending = data?.filter(i => i.status === 'pending').length || 0
  const unpaid = data?.filter(i => i.status === 'unpaid').length || 0
  return { paid, pending, unpaid }
}
