import { createClient } from '@supabase/supabase-js'

// 1. Replace this with your full 'sb_secret_...' key from your Supabase Dashboard -> API Settings
const SERVICE_ROLE_KEY = 'sb_publishable__5_AmgoWXGfYFYup8pYoxA_tjmdeptr'

// 2. The credentials you want to log in with
const email = 'admin@kostly.com'
const password = 'supersecretpassword'

const supabaseUrl = 'https://hacurygvlcnhfdosktfe.supabase.co'
const supabase = createClient(supabaseUrl, SERVICE_ROLE_KEY)

async function createOwner() {
  console.log(`Creating owner account for ${email}...`)
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      role: 'owner', // This is what our Auth Guard checks for!
      full_name: 'Kostly Admin'
    }
  })

  if (error) {
    console.error('Error creating user:', error.message)
    return
  }

  console.log('✅ Success! Owner created.')
  console.log('ID:', data.user.id)
  console.log('\nYou can now log in to the web dashboard with:')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

createOwner()
