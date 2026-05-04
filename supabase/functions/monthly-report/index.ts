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
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Initialize client passing the user's JWT
    const SUPABASE_PUBLISHABLE_KEYS = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      SUPABASE_PUBLISHABLE_KEYS['default'],
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Extract requested month and year from the payload
    const { month, year } = await req.json()
    if (!month || !year) throw new Error("Missing 'month' or 'year' in request body")
    
    const monthYear = `${year}-${String(month).padStart(2, '0')}-01`

    // 1. Fetch Rooms (RLS automatically restricts to this Owner)
    const { data: rooms, error: roomsError } = await supabaseClient
      .from('rooms')
      .select('id, status')
    
    if (roomsError) throw roomsError
    
    const totalRooms = rooms?.length || 0
    const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    // 2. Fetch Paid Invoices for this month
    // We only fetch invoices that have 'paid' status for the specified billing month
    // Again, RLS ensures the Owner only sees invoices linked to their contracts
    const { data: invoices, error: invoicesError } = await supabaseClient
      .from('invoices')
      .select('id, total_amount')
      .eq('billing_month', monthYear)
      .eq('status', 'paid')
    
    if (invoicesError) throw invoicesError

    const totalPaidInvoices = invoices?.length || 0
    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0

    // 3. Prepare the report snapshot
    const reportData = {
      owner_id: user.id,
      month_year: monthYear,
      total_revenue: totalRevenue,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      occupancy_rate: occupancyRate,
      total_paid_invoices: totalPaidInvoices,
    }

    // 4. Save/Update the snapshot in the 'reports' table
    const { error: upsertError } = await supabaseClient
      .from('reports')
      .upsert(reportData, { onConflict: 'owner_id, month_year' })
    
    if (upsertError) throw upsertError

    // 5. Return the report data to the frontend
    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("Function error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
