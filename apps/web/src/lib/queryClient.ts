import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time of 1 minute — data won't refetch if it was fetched within the last minute
            staleTime: 1000 * 60,
            // Refetch on window focus to keep dashboard data fresh
            refetchOnWindowFocus: true,
            // Retry once on failure
            retry: 1,
        },
    },
})