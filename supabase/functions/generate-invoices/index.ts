// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // 1. Verify Authorization Header, it will pass the service_role key as a bearer token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized: Missing Authorization header', {
      status: 401
    })
  }

  // 2. Initializing the Supabase CLient
  const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    SUPABASE_SECRET_KEYS['default'],
    {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    }
  )

  try {
    // 3. Fetch all active contracts
    const {
      data: contracts,
      error: contractsError
    } = await supabaseAdmin
      .from('contracts')
      .select("*")
      .eq('status', 'active')

    if (contractsError) throw contractsError

    // 4. Set up billing dates where billing_month is always YYYY-MM-01
    const today = new Date()
    const currentMonth = today.toISOString().slice(0, 8) + '01'

    let createdCount = 0

    // 5. Generate invoices for each active contract
    for (const contract of contracts || []) {
      // Due date is 5 days from today
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + 5)

      // the (contract_id, billing_month) unique constraint acts as idempotency guard:
      // if this function runs twice in a month, the second insert is a no-op (erro 23505)
      const {
        error: insertError
      } = await supabaseAdmin
        .from('invoices')
        .insert({
          contract_id: contract.id,
          tenant_id: contract.tenant_id,
          due_date: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
          total_amount: contract.monthly_rate,
          billing_month: currentMonth,
          status: 'unpaid'
        })

      if (!insertError) {
        createdCount++
      } else if (insertError.code !== '23505') {
        // 23505 = unique_violation is safe to ignore, since invoice already exists for this month
        console.error(`Error generating invoice for contract ${contract.id}`, insertError)
      }  
    }

    return new Response(JSON.stringify({
      created: createdCount,
      message: "Invoices generated successfully."
    }), {
      headers: {
        'Content-Type': 'application/json' },
        status: 200,
    })
  } catch (error: any) {
    console.error("function error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-invoices' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
