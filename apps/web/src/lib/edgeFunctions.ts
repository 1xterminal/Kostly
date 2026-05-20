import { supabase } from './supabase'

export async function callEdgeFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token

  if (!token) throw new Error('Not authenticated')

  const baseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
  const res = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload.error || `Failed to call ${functionName}`)
  }

  return payload as TResponse
}
