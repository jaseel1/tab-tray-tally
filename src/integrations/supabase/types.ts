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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_metadata: Json | null
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_metadata?: Json | null
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_metadata?: Json | null
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      pos_accounts: {
        Row: {
          created_at: string | null
          id: string
          mobile_number: string
          pin_hash: string
          restaurant_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mobile_number: string
          pin_hash: string
          restaurant_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mobile_number?: string
          pin_hash?: string
          restaurant_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pos_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          pos_account_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          pos_account_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          pos_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_categories_pos_account_id_fkey"
            columns: ["pos_account_id"]
            isOneToOne: false
            referencedRelation: "pos_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_digital_menus: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_generated_at: string | null
          pos_account_id: string
          public_url_slug: string
          qr_code_generated: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          pos_account_id: string
          public_url_slug: string
          qr_code_generated?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          pos_account_id?: string
          public_url_slug?: string
          qr_code_generated?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pos_menu_items: {
        Row: {
          category: string
          created_at: string | null
          id: string
          image: string | null
          name: string
          pos_account_id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          image?: string | null
          name: string
          pos_account_id: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          image?: string | null
          name?: string
          pos_account_id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_menu_items_pos_account_id_fkey"
            columns: ["pos_account_id"]
            isOneToOne: false
            referencedRelation: "pos_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_menu_themes: {
        Row: {
          active: boolean
          created_at: string
          custom_colors: Json | null
          id: string
          pos_account_id: string
          theme_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          custom_colors?: Json | null
          id?: string
          pos_account_id: string
          theme_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          custom_colors?: Json | null
          id?: string
          pos_account_id?: string
          theme_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pos_order_items: {
        Row: {
          id: string
          item_name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          item_name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          item_name?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          created_at: string | null
          id: string
          order_number: string
          payment_method: string
          pos_account_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_number: string
          payment_method: string
          pos_account_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_number?: string
          payment_method?: string
          pos_account_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_pos_account_id_fkey"
            columns: ["pos_account_id"]
            isOneToOne: false
            referencedRelation: "pos_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_settings: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          fssai_number: string | null
          gst_inclusive: boolean | null
          id: string
          phone: string | null
          pos_account_id: string
          privacy_mode: boolean | null
          restaurant_name: string
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          fssai_number?: string | null
          gst_inclusive?: boolean | null
          id?: string
          phone?: string | null
          pos_account_id: string
          privacy_mode?: boolean | null
          restaurant_name: string
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          fssai_number?: string | null
          gst_inclusive?: boolean | null
          id?: string
          phone?: string | null
          pos_account_id?: string
          privacy_mode?: boolean | null
          restaurant_name?: string
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_settings_pos_account_id_fkey"
            columns: ["pos_account_id"]
            isOneToOne: true
            referencedRelation: "pos_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          pos_account_id: string | null
          status: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pos_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pos_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_subscriptions_pos_account_id_fkey"
            columns: ["pos_account_id"]
            isOneToOne: false
            referencedRelation: "pos_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_telemetry: {
        Row: {
          created_at: string | null
          id: string
          last_active: string | null
          pos_account_id: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          pos_account_id?: string | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          pos_account_id?: string | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_telemetry_pos_account_id_fkey"
            columns: ["pos_account_id"]
            isOneToOne: false
            referencedRelation: "pos_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_login: {
        Args: { p_password: string; p_username: string }
        Returns: Json
      }
      can_edit_order: {
        Args: { p_account_id: string; p_order_id: string }
        Returns: Json
      }
      create_order: {
        Args: {
          p_account_id: string
          p_items: Json
          p_order_number: string
          p_payment_method: string
          p_total_amount: number
        }
        Returns: Json
      }
      create_pos_account: {
        Args: {
          p_license_duration_days?: number
          p_mobile_number: string
          p_pin: string
          p_restaurant_name: string
        }
        Returns: Json
      }
      delete_menu_item:
        | { Args: { p_account_id: string; p_item_id: string }; Returns: Json }
        | { Args: { p_id: string }; Returns: Json }
      generate_menu_slug: {
        Args: { p_account_id: string; p_restaurant_name: string }
        Returns: string
      }
      get_account_analytics: {
        Args: { p_account_id: string; p_days?: number }
        Returns: Json
      }
      get_account_full_details: {
        Args: { p_account_id: string }
        Returns: Json
      }
      get_account_menu: { Args: { p_account_id: string }; Returns: Json }
      get_account_orders: {
        Args: { p_account_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_admin_settings: { Args: never; Returns: Json }
      get_categories: { Args: { p_account_id: string }; Returns: Json }
      get_digital_menu_settings: {
        Args: { p_account_id: string }
        Returns: Json
      }
      get_item_sales: {
        Args: { p_account_id: string; p_days?: number }
        Returns: Json
      }
      get_orders: {
        Args: { p_account_id: string; p_limit?: number }
        Returns: Json
      }
      get_pos_accounts: {
        Args: never
        Returns: {
          days_remaining: number
          id: string
          last_active: string
          license_status: string
          license_valid_until: string
          mobile_number: string
          restaurant_name: string
          status: string
          total_orders: number
          total_revenue: number
        }[]
      }
      get_pos_settings: { Args: { p_account_id: string }; Returns: Json }
      get_public_menu: { Args: { p_slug: string }; Returns: Json }
      hash_password: { Args: { password: string }; Returns: string }
      initialize_digital_menu: {
        Args: { p_account_id: string; p_restaurant_name: string }
        Returns: Json
      }
      list_menu_items: { Args: { p_account_id: string }; Returns: Json }
      pos_login: {
        Args: { p_mobile_number: string; p_pin: string }
        Returns: Json
      }
      search_pos_accounts: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search_term?: string
          p_status?: string
        }
        Returns: Json
      }
      toggle_pos_account_status: {
        Args: { p_account_id: string }
        Returns: Json
      }
      update_menu_theme: {
        Args: {
          p_account_id: string
          p_custom_colors?: Json
          p_theme_name: string
        }
        Returns: Json
      }
      update_order_payment_method: {
        Args: {
          p_account_id: string
          p_is_admin?: boolean
          p_order_id: string
          p_payment_method: string
        }
        Returns: Json
      }
      update_pos_telemetry: {
        Args: { p_account_id: string; p_order_total: number }
        Returns: Json
      }
      upsert_admin_setting: {
        Args: { p_key: string; p_metadata?: Json; p_value: string }
        Returns: Json
      }
      upsert_categories: {
        Args: { p_account_id: string; p_categories: string[] }
        Returns: Json
      }
      upsert_menu_item: {
        Args: {
          p_account_id: string
          p_category: string
          p_image?: string
          p_item_id?: string
          p_name: string
          p_price: number
        }
        Returns: Json
      }
      upsert_pos_settings: {
        Args: {
          p_account_id: string
          p_address?: string
          p_email?: string
          p_fssai_number?: string
          p_gst_inclusive?: boolean
          p_phone?: string
          p_privacy_mode?: boolean
          p_restaurant_name: string
          p_tax_rate?: number
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
