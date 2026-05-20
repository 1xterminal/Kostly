// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests from the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[monthly-report] No Authorization header')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // --- Step 1: Verify the user with their JWT ---
    console.log('[monthly-report] Step 1: Verifying user JWT...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // User client - respects RLS, used only to verify identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      console.error('[monthly-report] Auth error:', authError?.message)
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
    console.log('[monthly-report] User verified:', user.id)

    const { data: profile, error: profileError } = await userClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'owner') {
      console.error('[monthly-report] Forbidden: caller is not owner')
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // --- Step 2: Parse body ---
    console.log('[monthly-report] Step 2: Parsing request body...')
    const { month, year } = await req.json()
    if (!month || !year) throw new Error("Missing 'month' or 'year' in request body")
    const monthYear = `${year}-${String(month).padStart(2, '0')}-01`
    console.log('[monthly-report] Target month_year:', monthYear)

    // --- Step 3: Fetch Rooms (use user client so RLS restricts to owner) ---
    console.log('[monthly-report] Step 3: Fetching rooms...')
    const { data: rooms, error: roomsError } = await userClient
      .from('rooms')
      .select('id, status')

    if (roomsError) {
      console.error('[monthly-report] Rooms error:', roomsError.message)
      throw roomsError
    }
    console.log('[monthly-report] Rooms fetched:', rooms?.length ?? 0)

    const totalRooms = rooms?.length || 0
    const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    // --- Step 4: Fetch Paid Invoices ---
    console.log('[monthly-report] Step 4: Fetching invoices...')
    const { data: invoices, error: invoicesError } = await userClient
      .from('invoices')
      .select('id, total_amount')
      .eq('billing_month', monthYear)
      .eq('status', 'paid')

    if (invoicesError) {
      console.error('[monthly-report] Invoices error:', invoicesError.message)
      throw invoicesError
    }
    console.log('[monthly-report] Invoices fetched:', invoices?.length ?? 0)

    const totalPaidInvoices = invoices?.length || 0
    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0

    // --- Step 5: Insert Report Snapshot (use service role to bypass RLS on insert) ---
    console.log('[monthly-report] Step 5: Inserting report snapshot...')
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const reportData = {
      owner_id: user.id,
      month_year: monthYear,
      total_revenue: totalRevenue,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      occupancy_rate: occupancyRate,
      total_paid_invoices: totalPaidInvoices,
    }

    const { data: insertedReport, error: insertError } = await adminClient
      .from('reports')
      .insert(reportData)
      .select()
      .single()

    if (insertError) {
      console.error('[monthly-report] Insert error:', insertError.message, insertError.details)
      throw insertError
    }
    console.log('[monthly-report] Report snapshot inserted successfully.')

    // --- Step 6: Return success ---
    return new Response(JSON.stringify(insertedReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[monthly-report] Unhandled error:', error?.message, error?.details ?? '')
    return new Response(JSON.stringify({ error: error.message, details: error.details ?? null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
