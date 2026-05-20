import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({
      error: 'create-tenant is retired. Use create-tenant-account, then assign-tenant-room.',
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 410,
    },
  )
})
