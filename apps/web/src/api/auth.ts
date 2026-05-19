import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignInCredentials = {
  email: string
  password: string
}

// ─── Auth Functions ───────────────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * Throws if credentials are wrong, or if the account is not role='owner'.
 */
export async function signIn({ email, password }: SignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  // Role check — only owners can access the web dashboard.
  // Use public.users as the authorization source of truth, not user_metadata.
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || profile?.role !== 'owner') {
    await supabase.auth.signOut()
    throw new Error('Access denied. This dashboard is for property owners only.')
  }

  return data
}

/**
 * Sign out the current user and clear the session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Send a password reset email.
 * Supabase sends a recovery link to the inbox.
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

/**
 * Update the current user's password.
 * Used on the /reset-password page after arriving from the email link.
 */
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  return data
}

/**
 * Get the current session. Returns null if not logged in.
 * Use getUser() instead for RLS-sensitive operations.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/**
 * Get the current authenticated user (re-validated with Supabase server).
 * Safer than getSession() for security-sensitive checks.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}
