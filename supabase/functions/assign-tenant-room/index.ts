import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function getServiceRoleKey() {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (key) return key

  const secretKeysStr = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (!secretKeysStr) return null

  return JSON.parse(secretKeysStr)['default'] as string | undefined
}

async function assertOwner(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing Authorization header')

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'owner') {
    throw new Error('Forbidden: Only owners can assign tenant rooms')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    await assertOwner(req)

    const { tenant_id, room_id, start_date, end_date } = await req.json()
    if (!tenant_id || !room_id || !start_date || !end_date) {
      throw new Error('Tenant, room, start date, and end date are required')
    }

    const serviceRoleKey = getServiceRoleKey()
    if (!serviceRoleKey) throw new Error('Missing service role key')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
    )

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('users')
      .select('id, role, tenant_status')
      .eq('id', tenant_id)
      .single()

    if (tenantError || tenant?.role !== 'tenant') {
      throw new Error('Tenant account not found')
    }

    if (tenant.tenant_status === 'archived') {
      throw new Error('Archived tenants cannot be assigned to a room')
    }

    const { data: activeTenantContract, error: activeTenantContractError } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('status', 'active')
      .maybeSingle()

    if (activeTenantContractError) throw activeTenantContractError
    if (activeTenantContract) throw new Error('Tenant already has an active contract')

    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('id, price, status')
      .eq('id', room_id)
      .single()

    if (roomError || !room) throw new Error('Room not found')
    if (room.status !== 'available') throw new Error('Room is not available')

    const { data: activeRoomContract, error: activeRoomContractError } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .eq('room_id', room_id)
      .eq('status', 'active')
      .maybeSingle()

    if (activeRoomContractError) throw activeRoomContractError
    if (activeRoomContract) throw new Error('Room already has an active contract')

    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .insert({
        tenant_id,
        room_id,
        start_date,
        end_date,
        monthly_rate: room.price,
        status: 'active',
      })
      .select()
      .single()

    if (contractError) throw contractError

    const { error: roomUpdateError } = await supabaseAdmin
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', room_id)

    if (roomUpdateError) throw roomUpdateError

    return json({ success: true, contract })
  } catch (error: unknown) {
    return json({ error: (error as Error).message }, 400)
  }
})
