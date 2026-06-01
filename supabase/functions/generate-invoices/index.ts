// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // 1. Verify Authorization Header, it will pass the service_role key as a bearer token
  const authHeader = req.headers.get('Authorization')
  let serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRoleKey) {
    const secretKeysStr = Deno.env.get('SUPABASE_SECRET_KEYS')
    if (secretKeysStr) {
      serviceRoleKey = JSON.parse(secretKeysStr)['default']
    }
  }

  if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized: Missing Authorization header', {
      status: 401
    })
  }

  // 2. Initializing the Supabase CLient
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey
  )

  try {
    // 3. Set up billing dates where billing_month is always YYYY-MM-01
    const today = new Date()
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
    const nextMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))
    const monthEnd = new Date(nextMonthStart)
    monthEnd.setUTCDate(monthEnd.getUTCDate() - 1)

    const toDateString = (date: Date) => date.toISOString().slice(0, 10)
    const currentMonth = toDateString(monthStart)
    const monthEndDate = toDateString(monthEnd)

    // 4. Fetch active month-to-month contracts that have already started.
    const {
      data: contracts,
      error: contractsError
    } = await supabaseAdmin
      .from('contracts')
      .select("*")
      .eq('status', 'active')
      .lte('start_date', monthEndDate)

    if (contractsError) throw contractsError

    let createdCount = 0

    // 5. Generate invoices for each active contract
    for (const contract of contracts || []) {
      // Due date is 5 days from today
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + 5)

      // The (contract_id, billing_month) unique constraint is the idempotency guard.
      const {
        error: insertError
      } = await supabaseAdmin
        .from('invoices')
        .insert({
          contract_id: contract.id,
          tenant_id: contract.tenant_id,
          invoice_date: toDateString(today),
          due_date: toDateString(dueDate),
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
