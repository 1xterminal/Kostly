import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  type SignInCredentials,
} from '@/api/auth'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const authKeys = {
  session: ['session'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns the current session.
 * staleTime: Infinity — session doesn't go stale until explicitly invalidated.
 */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: getSession,
    staleTime: Infinity,
  })
}

/**
 * Sign in mutation.
 * On success: invalidates session cache → navigates to /dashboard.
 * On error: the error message is available via mutation.error.message.
 */
export function useSignIn() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (credentials: SignInCredentials) => signIn(credentials),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.session })
      navigate('/dashboard')
    },
  })
}

/**
 * Sign out mutation.
 * On success: clears all cached queries → navigates to /login.
 */
export function useSignOut() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Clear all cached data so no stale data leaks between sessions
      qc.clear()
      navigate('/login')
    },
  })
}

/**
 * Send password reset email mutation.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) => resetPassword(email),
  })
}

/**
 * Update password mutation.
 * Used on /reset-password after arriving from the email recovery link.
 */
export function useUpdatePassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (password: string) => updatePassword(password),
    onSuccess: () => navigate('/dashboard'),
  })
}
