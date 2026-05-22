import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns the live count of pending extend requests.
 * Updates in real-time via Supabase Realtime so the
 * notification dot always reflects the current state.
 */
export function usePendingExtendCount() {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    const { count: n } = await supabase
      .from('extend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    setCount(n ?? 0)
  }, [])

  useEffect(() => {
    // Initial fetch
    queueMicrotask(() => {
      void fetchCount()
    })

    // Subscribe to inserts / updates on extend_requests
    const channel = supabase
      .channel('extend-requests-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'extend_requests' },
        () => fetchCount(),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchCount])

  return count
}
