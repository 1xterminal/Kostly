// ─── Shared TypeScript types mirroring the Supabase schema ───────────────────
// Keep in sync with supabase/migrations/init_schema.sql

export type UserRole = 'owner' | 'tenant'
export type TenantStatus = 'active' | 'archived'
export type RoomStatus = 'available' | 'occupied' | 'maintenance'
export type ContractStatus = 'active' | 'expired' | 'terminated'
export type InvoiceStatus = 'unpaid' | 'pending' | 'paid'
export type PaymentStatus = 'not_verified' | 'verified' | 'rejected'
export type TicketStatus = 'reported' | 'in_progress' | 'resolved' | 'closed'
export type ExtendReqStatus = 'pending' | 'approved' | 'rejected'

export interface AppUser {
  id: string
  email: string
  name: string
  phone_number: string | null
  role: UserRole
  onboarding: boolean
  tenant_status: TenantStatus | null
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  owner_id: string
  number: string
  price: number
  status: RoomStatus
  wifi_password: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  room_id: string
  tenant_id: string
  start_date: string   // ISO date YYYY-MM-DD
  end_date: string     // ISO date YYYY-MM-DD
  monthly_rate: number
  status: ContractStatus
  created_at: string
  updated_at: string
  // Joined
  room?: Room
  tenant?: AppUser
}

export interface Invoice {
  id: string
  contract_id: string
  tenant_id: string
  invoice_date: string
  due_date: string
  total_amount: number
  billing_month: string  // YYYY-MM-01
  status: InvoiceStatus
  created_at: string
  updated_at: string
  // Joined
  contract?: Contract
  tenant?: AppUser
}

export interface Payment {
  id: string
  invoice_id: string
  tenant_id: string
  proof_images: string  // Supabase Storage path
  transaction_date: string
  is_verified: boolean
  status: PaymentStatus
  rejection_reason: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
  // Joined
  invoice?: Invoice
  tenant?: AppUser
}

export interface MaintenanceTicket {
  id: string
  reported_by_user_id: string
  room_id: string
  date_created: string
  description: string
  ticket_status: TicketStatus
  resolved_message: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  // Joined
  room?: Room
  reporter?: AppUser
  replies?: TicketReply[]
}

export interface TicketReply {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  created_at: string
  sender?: AppUser
}

export interface ExtendRequest {
  id: string
  contract_id: string
  tenant_id: string
  requested_end_date: string
  note: string | null
  status: ExtendReqStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  tenant?: AppUser
  contract?: Contract
}

export interface Report {
  id: string
  owner_id: string
  month_year: string      // YYYY-MM-01
  total_revenue: number
  total_rooms: number
  occupied_rooms: number
  occupancy_rate: number  // 0–100
  total_paid_invoices: number
  created_at: string
}
