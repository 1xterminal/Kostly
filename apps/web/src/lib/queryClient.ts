import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time of 5 minutes — data won't refetch unless older than 5 min
            staleTime: 1000 * 60 * 5,
            // Refetch on window focus to keep dashboard data fresh
            refetchOnWindowFocus: true,
            // Retry once on failure
            retry: 1,
        },
    },
})