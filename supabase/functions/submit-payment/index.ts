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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
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
      .select('role, tenant_status')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'tenant') {
      throw new Error('Only tenants can submit payments')
    }

    if (profile.tenant_status === 'archived') {
      throw new Error('Archived tenants cannot submit payments')
    }

    const { invoice_id, proof_images, transaction_date } = await req.json()
    if (!invoice_id || !proof_images || !transaction_date) {
      throw new Error('Invoice, proof image, and transaction date are required')
    }

    const serviceRoleKey = getServiceRoleKey()
    if (!serviceRoleKey) throw new Error('Missing service role key')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
    )

    const { data: payment, error: paymentError } = await supabaseAdmin
      .rpc('submit_payment_tx', {
        p_tenant_id: user.id,
        p_invoice_id: invoice_id,
        p_proof_images: proof_images,
        p_transaction_date: transaction_date,
      })

    if (paymentError) throw paymentError

    return json({ success: true, payment })
  } catch (error: unknown) {
    return json({ error: (error as Error).message }, 400)
  }
})
