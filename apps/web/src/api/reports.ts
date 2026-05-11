import { supabase } from '@/lib/supabase'
import type { Report } from '@/types'

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const reportKeys = {
  all:      ['reports']                           as const,
  byMonth:  (monthYear: string) => ['reports', monthYear] as const,
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch all monthly reports for the authenticated owner, newest first. */
export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('month_year', { ascending: false })

  if (error) throw error
  return data
}

/** Fetch a single report by its month_year (e.g. '2026-05-01'). */
export async function getReportByMonth(monthYear: string): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('month_year', monthYear)
    .single()

  if (error) throw error
  return data
}
