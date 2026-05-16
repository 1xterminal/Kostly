import { useQuery } from '@tanstack/react-query'
import { getRevenueData, getOccupancyStats, getPaymentStatus, reportKeys } from '@/api/reports'
export function useRevenueQuery(year: number) {
  return useQuery({
    queryKey: reportKeys.revenue(year),
    queryFn: () => getRevenueData(year)
  })
}
export function useOccupancyQuery() {
  return useQuery({
    queryKey: reportKeys.occupancy,
    queryFn: () => getOccupancyStats()
  })
}
export function usePaymentStatusQuery() {
  return useQuery({
    queryKey: reportKeys.paymentStatus,
    queryFn: () => getPaymentStatus()
  })
}