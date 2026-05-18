import { useState, useEffect } from 'react'

export type PaymentWithDetails = {
  id: string
  invoice_id: string
  tenant_id: string
  proof_images: string
  transaction_date: string
  is_verified: boolean
  status: 'not_verified' | 'verified' | 'rejected'
  rejection_reason?: string | null
  invoices: {
    id: string
    total_amount: number
    billing_month: string
    status: string
    contracts: {
      id: string
      room_id: string
      rooms: {
        number: string
      }
    }
  }
  tenant: {
    name: string
    email: string
    phone_number: string | null
  }
}

// Mock Data
const MOCK_PAYMENTS: PaymentWithDetails[] = [
  {
    id: 'pay-1',
    invoice_id: 'inv-1',
    tenant_id: 'usr-1',
    proof_images: 'https://via.placeholder.com/600x800?text=Bukti+Transfer+Budi',
    transaction_date: new Date().toISOString(),
    is_verified: false,
    status: 'not_verified',
    invoices: {
      id: 'inv-1',
      total_amount: 1500000,
      billing_month: '2026-05-01',
      status: 'pending',
      contracts: { id: 'ctx-1', room_id: 'rm-1', rooms: { number: '101' } }
    },
    tenant: { name: 'Budi Santoso', email: 'budi@example.com', phone_number: '08123456789' }
  },
  {
    id: 'pay-2',
    invoice_id: 'inv-2',
    tenant_id: 'usr-2',
    proof_images: 'https://via.placeholder.com/600x800?text=Bukti+Transfer+Siti',
    transaction_date: new Date(Date.now() - 86400000).toISOString(),
    is_verified: true,
    status: 'verified',
    invoices: {
      id: 'inv-2',
      total_amount: 2000000,
      billing_month: '2026-04-01',
      status: 'paid',
      contracts: { id: 'ctx-2', room_id: 'rm-2', rooms: { number: '202' } }
    },
    tenant: { name: 'Siti Aminah', email: 'siti@example.com', phone_number: '08987654321' }
  }
]

export function usePayments() {
  const [data, setData] = useState<PaymentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      // Simulate network delay
      await new Promise(res => setTimeout(res, 500))
      
      // Load from localStorage or use default mock
      const saved = localStorage.getItem('mock_payments')
      if (saved) {
        setData(JSON.parse(saved))
      } else {
        setData(MOCK_PAYMENTS)
        localStorage.setItem('mock_payments', JSON.stringify(MOCK_PAYMENTS))
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const approvePayment = async (paymentId: string) => {
    const updated = data.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'verified' as const,
          is_verified: true,
          invoices: { ...p.invoices, status: 'paid' }
        }
      }
      return p
    })
    setData(updated)
    localStorage.setItem('mock_payments', JSON.stringify(updated))
  }

  const rejectPayment = async (paymentId: string, reason: string) => {
    const updated = data.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'rejected' as const,
          is_verified: false,
          rejection_reason: reason,
          invoices: { ...p.invoices, status: 'unpaid' }
        }
      }
      return p
    })
    setData(updated)
    localStorage.setItem('mock_payments', JSON.stringify(updated))
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  return { data, isLoading, error, refetch: fetchPayments, approvePayment, rejectPayment }
}
