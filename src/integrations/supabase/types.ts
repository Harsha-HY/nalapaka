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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      locked_seats: {
        Row: {
          id: string
          locked_at: string
          order_id: string
          seat: string
          table_number: string
        }
        Insert: {
          id?: string
          locked_at?: string
          order_id: string
          seat: string
          table_number: string
        }
        Update: {
          id?: string
          locked_at?: string
          order_id?: string
          seat?: string
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "locked_seats_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_available: boolean
          name: string
          name_kn: string
          price: number
          time_slot: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          is_available?: boolean
          name: string
          name_kn: string
          price: number
          time_slot: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
          name_kn?: string
          price?: number
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          archived_at: string | null
          base_items: Json | null
          confirmed_at: string | null
          created_at: string
          customer_name: string
          eating_finished: boolean
          extra_items: Json | null
          id: string
          order_stage: string | null
          order_status: Database["public"]["Enums"]["order_status"]
          order_type: Database["public"]["Enums"]["order_type"] | null
          ordered_items: Json
          payment_confirmed: boolean
          payment_intent: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          phone_number: string
          seats: string[] | null
          server_id: string | null
          server_name: string | null
          table_number: string
          total_amount: number
          updated_at: string
          user_id: string
          wait_time_minutes: number | null
        }
        Insert: {
          archived_at?: string | null
          base_items?: Json | null
          confirmed_at?: string | null
          created_at?: string
          customer_name: string
          eating_finished?: boolean
          extra_items?: Json | null
          id?: string
          order_stage?: string | null
          order_status?: Database["public"]["Enums"]["order_status"]
          order_type?: Database["public"]["Enums"]["order_type"] | null
          ordered_items?: Json
          payment_confirmed?: boolean
          payment_intent?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          phone_number: string
          seats?: string[] | null
          server_id?: string | null
          server_name?: string | null
          table_number: string
          total_amount?: number
          updated_at?: string
          user_id: string
          wait_time_minutes?: number | null
        }
        Update: {
          archived_at?: string | null
          base_items?: Json | null
          confirmed_at?: string | null
          created_at?: string
          customer_name?: string
          eating_finished?: boolean
          extra_items?: Json | null
          id?: string
          order_stage?: string | null
          order_status?: Database["public"]["Enums"]["order_status"]
          order_type?: Database["public"]["Enums"]["order_type"] | null
          ordered_items?: Json
          payment_confirmed?: boolean
          payment_intent?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          phone_number?: string
          seats?: string[] | null
          server_id?: string | null
          server_name?: string | null
          table_number?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          wait_time_minutes?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          customer_name: string
          food_rating: number | null
          hotel_rating: number | null
          id: string
          order_id: string | null
          phone_number: string | null
          review_text: string | null
          seats: string[] | null
          server_name: string | null
          service_rating: number | null
          table_number: string
          website_rating: number | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          food_rating?: number | null
          hotel_rating?: number | null
          id?: string
          order_id?: string | null
          phone_number?: string | null
          review_text?: string | null
          seats?: string[] | null
          server_name?: string | null
          service_rating?: number | null
          table_number: string
          website_rating?: number | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          food_rating?: number | null
          hotel_rating?: number | null
          id?: string
          order_id?: string | null
          phone_number?: string | null
          review_text?: string | null
          seats?: string[] | null
          server_name?: string | null
          service_rating?: number | null
          table_number?: string
          website_rating?: number | null
        }
        Relationships: []
      }
      servers: {
        Row: {
          assigned_tables: string[]
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_tables?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_tables?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_server_tables: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: never; Returns: boolean }
      is_server: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "manager" | "customer" | "server"
      order_status: "Pending" | "Confirmed" | "Cancelled"
      order_type: "dine-in" | "parcel"
      payment_mode: "Not Paid" | "Cash" | "Online"
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
      app_role: ["manager", "customer", "server"],
      order_status: ["Pending", "Confirmed", "Cancelled"],
      order_type: ["dine-in", "parcel"],
      payment_mode: ["Not Paid", "Cash", "Online"],
    },
  },
} as const
