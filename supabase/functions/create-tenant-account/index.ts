import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const temporaryPassword = 'Kostly123!'

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isDuplicateAuthUserError(error: { message?: string; code?: string; status?: number } | null) {
  const message = error?.message?.toLowerCase() ?? ''
  return error?.status === 422 ||
    error?.code === 'email_exists' ||
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('duplicate')
}

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
    throw new Error('Forbidden: Only owners can create tenant accounts')
  }
}

async function findAuthUserByEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
) {
  let page = 1
  const perPage = 1000

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) throw error

    const user = data.users.find((authUser) => normalizeEmail(authUser.email ?? '') === email)
    if (user) return user
    if (!data.nextPage) break
    page = data.nextPage
  }

  return null
}

async function upsertTenantProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  input: {
    id: string
    email: string
    name: string
    phone_number: string
  },
) {
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .upsert({
      id: input.id,
      email: input.email,
      name: input.name,
      phone_number: input.phone_number,
      role: 'tenant',
      tenant_status: 'active',
      onboarding: false,
    })

  if (profileError) throw profileError
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

    const { name, email, phone_number } = await req.json()
    if (!name || !email || !phone_number) {
      throw new Error('Name, email, and phone number are required')
    }

    const normalizedEmail = normalizeEmail(email)

    const serviceRoleKey = getServiceRoleKey()
    if (!serviceRoleKey) throw new Error('Missing service role key')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
    )

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingProfileError) throw existingProfileError
    if (existingProfile) {
      throw new Error('Tenant account already exists in the owner dashboard.')
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        role: 'tenant',
        name,
        full_name: name,
        must_change_password: true,
      },
    })

    if (authError && !isDuplicateAuthUserError(authError)) throw authError

    if (authError) {
      const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, normalizedEmail)
      if (!existingAuthUser) {
        throw new Error('Auth account already exists, but could not be found for repair.')
      }

      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          user_metadata: {
            ...(existingAuthUser.user_metadata ?? {}),
            role: 'tenant',
            name,
            full_name: name,
            must_change_password: true,
          },
        },
      )

      if (metadataError) throw metadataError

      await upsertTenantProfile(supabaseAdmin, {
        id: existingAuthUser.id,
        email: normalizedEmail,
        name,
        phone_number,
      })

      return json({
        success: true,
        repaired: true,
        tenant_id: existingAuthUser.id,
        temporary_password: null,
      })
    }

    const userId = authData.user?.id
    if (!userId) throw new Error('Tenant auth account was not created.')

    await upsertTenantProfile(supabaseAdmin, {
      id: userId,
      email: normalizedEmail,
      name,
      phone_number,
    })

    return json({
      success: true,
      repaired: false,
      tenant_id: userId,
      temporary_password: temporaryPassword,
    })
  } catch (error: unknown) {
    return json({ error: (error as Error).message }, 400)
  }
})
