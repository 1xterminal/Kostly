export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          created_at: string
          end_date: string
          id: string
          monthly_rate: number
          room_id: string
          start_date: string
          status: Database["public"]["Enums"]["contract_status_enum"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          monthly_rate: number
          room_id: string
          start_date: string
          status?: Database["public"]["Enums"]["contract_status_enum"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          monthly_rate?: number
          room_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status_enum"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      extend_requests: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          note: string | null
          requested_end_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["extend_req_status_enum"]
          tenant_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          note?: string | null
          requested_end_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["extend_req_status_enum"]
          tenant_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          note?: string | null
          requested_end_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["extend_req_status_enum"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extend_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extend_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extend_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_month: string
          contract_id: string
          created_at: string
          due_date: string
          id: string
          invoice_date: string
          status: Database["public"]["Enums"]["invoice_status_enum"]
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_month: string
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_date?: string
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          tenant_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          billing_month?: string
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_date?: string
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          created_at: string
          date_created: string
          description: string
          id: string
          reported_by_user_id: string
          resolved_at: string | null
          resolved_message: string | null
          room_id: string
          ticket_status: Database["public"]["Enums"]["ticket_status_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_created?: string
          description: string
          id?: string
          reported_by_user_id: string
          resolved_at?: string | null
          resolved_message?: string | null
          room_id: string
          ticket_status?: Database["public"]["Enums"]["ticket_status_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_created?: string
          description?: string
          id?: string
          reported_by_user_id?: string
          resolved_at?: string | null
          resolved_message?: string | null
          room_id?: string
          ticket_status?: Database["public"]["Enums"]["ticket_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          is_verified: boolean
          proof_images: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["payment_status_enum"]
          tenant_id: string
          transaction_date: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          is_verified?: boolean
          proof_images: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status_enum"]
          tenant_id: string
          transaction_date?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          is_verified?: boolean
          proof_images?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status_enum"]
          tenant_id?: string
          transaction_date?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          month_year: string
          occupancy_rate: number
          occupied_rooms: number
          owner_id: string
          total_paid_invoices: number
          total_revenue: number
          total_rooms: number
        }
        Insert: {
          created_at?: string
          id?: string
          month_year: string
          occupancy_rate?: number
          occupied_rooms?: number
          owner_id: string
          total_paid_invoices?: number
          total_revenue?: number
          total_rooms?: number
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          occupancy_rate?: number
          occupied_rooms?: number
          owner_id?: string
          total_paid_invoices?: number
          total_revenue?: number
          total_rooms?: number
        }
        Relationships: [
          {
            foreignKeyName: "reports_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          number: string
          owner_id: string
          price: number
          status: Database["public"]["Enums"]["room_status_enum"]
          updated_at: string
          wifi_password: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          number: string
          owner_id: string
          price: number
          status?: Database["public"]["Enums"]["room_status_enum"]
          updated_at?: string
          wifi_password?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          number?: string
          owner_id?: string
          price?: number
          status?: Database["public"]["Enums"]["room_status_enum"]
          updated_at?: string
          wifi_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          onboarding: boolean | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_status:
            | Database["public"]["Enums"]["tenant_status_enum"]
            | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          onboarding?: boolean | null
          phone_number?: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_status?:
            | Database["public"]["Enums"]["tenant_status_enum"]
            | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          onboarding?: boolean | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_status?:
            | Database["public"]["Enums"]["tenant_status_enum"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_generate_invoices: { Args: never; Returns: undefined }
      is_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      contract_status_enum: "active" | "expired" | "terminated"
      extend_req_status_enum: "pending" | "approved" | "rejected"
      invoice_status_enum: "unpaid" | "pending" | "paid"
      payment_status_enum: "not_verified" | "verified" | "rejected"
      room_status_enum: "available" | "occupied" | "maintenance"
      tenant_status_enum: "active" | "archived"
      ticket_status_enum: "reported" | "in_progress" | "resolved" | "closed"
      user_role: "owner" | "tenant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contract_status_enum: ["active", "expired", "terminated"],
      extend_req_status_enum: ["pending", "approved", "rejected"],
      invoice_status_enum: ["unpaid", "pending", "paid"],
      payment_status_enum: ["not_verified", "verified", "rejected"],
      room_status_enum: ["available", "occupied", "maintenance"],
      tenant_status_enum: ["active", "archived"],
      ticket_status_enum: ["reported", "in_progress", "resolved", "closed"],
      user_role: ["owner", "tenant"],
    },
  },
} as const
