import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // Initialize regular client to verify caller is owner
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'owner') {
      throw new Error('Forbidden: Only owners can onboard tenants')
    }

    const body = await req.json()
    const { name, email, phone_number, room_id, start_date, end_date, monthly_rate } = body

    if (!email || !name || !room_id || !start_date || !end_date || !monthly_rate) {
      throw new Error('Missing required fields')
    }

    // Initialize admin client to bypass RLS and create Auth user
    let serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      // Fallback for Kostly specific setup if used
      const secretKeysStr = Deno.env.get('SUPABASE_SECRET_KEYS')
      if (secretKeysStr) {
        serviceRoleKey = JSON.parse(secretKeysStr)['default']
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? ''
    )

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: 'Kostly123!',
      email_confirm: true,
      user_metadata: {
        role: 'tenant',
        name,
        full_name: name,
        must_change_password: true,
      }
    })

    if (authError) throw authError
    const newUserId = authData.user.id

    // 2. The app profile is the trusted membership record.
    // Auth users without this row cannot enter the tenant app.
    const { error: upsertProfileError } = await supabaseAdmin.from('users').upsert({
      id: newUserId,
      name,
      email,
      phone_number,
      role: 'tenant',
      tenant_status: 'active',
      onboarding: false
    })

    if (upsertProfileError) throw upsertProfileError

    // 3. Create the initial contract
    const { error: contractError } = await supabaseAdmin.from('contracts').insert({
      tenant_id: newUserId,
      room_id,
      start_date,
      end_date,
      monthly_rate,
      status: 'active'
    })

    if (contractError) throw contractError

    // 4. Mark room as occupied
    await supabaseAdmin.from('rooms').update({ status: 'occupied' }).eq('id', room_id)

    return new Response(JSON.stringify({ success: true, user: authData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
