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
    throw new Error('Forbidden: Only owners can review payments')
  }

  return user.id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const ownerId = await assertOwner(req)
    const { payment_id, action, rejection_reason } = await req.json()

    if (!payment_id || !action) {
      throw new Error('Payment and action are required')
    }

    const serviceRoleKey = getServiceRoleKey()
    if (!serviceRoleKey) throw new Error('Missing service role key')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
    )

    const { data: payment, error: reviewError } = await supabaseAdmin
      .rpc('review_payment_tx', {
        p_owner_id: ownerId,
        p_payment_id: payment_id,
        p_action: action,
        p_rejection_reason: rejection_reason ?? null,
      })

    if (reviewError) throw reviewError

    return json({ success: true, payment })
  } catch (error: unknown) {
    return json({ error: (error as Error).message }, 400)
  }
})
