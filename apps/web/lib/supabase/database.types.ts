export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_legal_documents: {
        Args: { p_document_ids: string[] }
        Returns: Json
      }
      cancel_scheduled_test: {
        Args: { p_idempotency_key: string; p_test_id: string }
        Returns: Json
      }
      create_store: {
        Args: {
          p_address: string
          p_category_id: number
          p_name: string
          p_region_code: string
        }
        Returns: Json
      }
      create_test_draft: {
        Args: {
          p_ends_at: string
          p_question: string
          p_reward_points: number
          p_starts_at: string
          p_store_id: string
          p_target_votes: number
          p_title: string
        }
        Returns: Json
      }
      get_catalog: { Args: never; Returns: Json }
      get_current_legal_documents: { Args: never; Returns: Json }
      get_my_profile: { Args: never; Returns: Json }
      get_my_stores: { Args: never; Returns: Json }
      get_owner_dashboard: { Args: { p_store_id: string }; Returns: Json }
      get_owner_wallet: { Args: never; Returns: Json }
      get_public_result: { Args: { p_slug: string }; Returns: Json }
      get_reward_wallet: { Args: never; Returns: Json }
      get_test_progress: { Args: { p_test_id: string }; Returns: Json }
      get_test_results: { Args: { p_test_id: string }; Returns: Json }
      get_vote_context: { Args: { p_slug: string }; Returns: Json }
      record_test_detail_view: { Args: { p_slug: string }; Returns: Json }
      set_test_option_asset: {
        Args: { p_asset_path: string; p_option_id: string; p_test_id: string }
        Returns: Json
      }
      start_test: {
        Args: { p_idempotency_key: string; p_test_id: string }
        Returns: Json
      }
      submit_vote: {
        Args: { p_idempotency_key: string; p_option_id: string; p_slug: string }
        Returns: Json
      }
      update_my_profile: {
        Args: {
          p_age_band?: Database["public"]["Enums"]["age_band"]
          p_display_name: string
          p_interest_category_ids?: number[]
          p_region_code?: string
        }
        Returns: Json
      }
      update_test_draft: {
        Args: {
          p_ends_at: string
          p_question: string
          p_reward_points: number
          p_starts_at: string
          p_target_votes: number
          p_test_id: string
          p_title: string
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
  private: {
    Tables: {
      owner_credit_accounts: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_credit_entries: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          entry_type: Database["private"]["Enums"]["owner_credit_entry_type"]
          id: string
          idempotency_key: string
          note: string | null
          test_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          entry_type: Database["private"]["Enums"]["owner_credit_entry_type"]
          id?: string
          idempotency_key: string
          note?: string | null
          test_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          entry_type?: Database["private"]["Enums"]["owner_credit_entry_type"]
          id?: string
          idempotency_key?: string
          note?: string | null
          test_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reward_point_accounts: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_point_entries: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          entry_type: Database["private"]["Enums"]["reward_point_entry_type"]
          id: string
          idempotency_key: string
          note: string | null
          user_id: string
          vote_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          entry_type: Database["private"]["Enums"]["reward_point_entry_type"]
          id?: string
          idempotency_key: string
          note?: string | null
          user_id: string
          vote_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          entry_type?: Database["private"]["Enums"]["reward_point_entry_type"]
          id?: string
          idempotency_key?: string
          note?: string | null
          user_id?: string
          vote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_point_entries_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      test_billings: {
        Row: {
          cancel_idempotency_key: string | null
          package_price: number
          payer_user_id: string
          refunded_credits: number
          reserved_at: string
          settled_at: string | null
          start_idempotency_key: string
          status: Database["private"]["Enums"]["billing_status"]
          test_id: string
          used_credits: number | null
        }
        Insert: {
          cancel_idempotency_key?: string | null
          package_price: number
          payer_user_id: string
          refunded_credits?: number
          reserved_at?: string
          settled_at?: string | null
          start_idempotency_key: string
          status?: Database["private"]["Enums"]["billing_status"]
          test_id: string
          used_credits?: number | null
        }
        Update: {
          cancel_idempotency_key?: string | null
          package_price?: number
          payer_user_id?: string
          refunded_credits?: number
          reserved_at?: string
          settled_at?: string | null
          start_idempotency_key?: string
          status?: Database["private"]["Enums"]["billing_status"]
          test_id?: string
          used_credits?: number | null
        }
        Relationships: []
      }
      test_detail_views: {
        Row: {
          created_at: string
          test_id: string
          user_id: string
          viewed_on: string
        }
        Insert: {
          created_at?: string
          test_id: string
          user_id: string
          viewed_on: string
        }
        Update: {
          created_at?: string
          test_id?: string
          user_id?: string
          viewed_on?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          option_id: string
          reward_points_snapshot: number
          test_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          option_id: string
          reward_points_snapshot: number
          test_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          option_id?: string
          reward_points_snapshot?: number
          test_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_test_lifecycle: { Args: never; Returns: number }
      before_user_created: { Args: { event: Json }; Returns: Json }
      can_manage_test_asset: { Args: { object_name: string }; Returns: boolean }
      can_read_test_asset: { Args: { object_name: string }; Returns: boolean }
      current_user_id: { Args: never; Returns: string }
      finalize_test: { Args: { p_test_id: string }; Returns: Json }
      grant_owner_credit: {
        Args: {
          p_amount: number
          p_idempotency_key: string
          p_note?: string
          p_user_id: string
        }
        Returns: number
      }
      has_required_consents: { Args: { p_user_id: string }; Returns: boolean }
      is_current_store_owner: { Args: { store_id: string }; Returns: boolean }
      is_store_owner: {
        Args: { store_id: string; user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      billing_status: "reserved" | "settled" | "cancelled"
      owner_credit_entry_type:
        "admin_grant" | "test_charge" | "test_refund" | "adjustment"
      reward_point_entry_type: "vote_reward" | "adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: never
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          document_key: string
          effective_at: string
          id: string
          is_required: boolean
          retired_at: string | null
          title: string
          version: string
        }
        Insert: {
          document_key: string
          effective_at: string
          id?: string
          is_required: boolean
          retired_at?: string | null
          title: string
          version: string
        }
        Update: {
          document_key?: string
          effective_at?: string
          id?: string
          is_required?: boolean
          retired_at?: string | null
          title?: string
          version?: string
        }
        Relationships: []
      }
      pricing_packages: {
        Row: {
          is_active: boolean
          price_credits: number
          reward_points: number
          target_votes: number
          updated_at: string
        }
        Insert: {
          is_active?: boolean
          price_credits: number
          reward_points?: number
          target_votes: number
          updated_at?: string
        }
        Update: {
          is_active?: boolean
          price_credits?: number
          reward_points?: number
          target_votes?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_interests: {
        Row: {
          category_id: number
          created_at: string
          user_id: string
        }
        Insert: {
          category_id: number
          created_at?: string
          user_id: string
        }
        Update: {
          category_id?: number
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_preferences: {
        Row: {
          age_band: Database["public"]["Enums"]["age_band"] | null
          region_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_band?: Database["public"]["Enums"]["age_band"] | null
          region_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_band?: Database["public"]["Enums"]["age_band"] | null
          region_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          onboarding_completed_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          category_id: number
          created_at: string
          id: string
          name: string
          owner_id: string
          region_code: string
          updated_at: string
        }
        Insert: {
          address: string
          category_id: number
          created_at?: string
          id?: string
          name: string
          owner_id: string
          region_code: string
          updated_at?: string
        }
        Update: {
          address?: string
          category_id?: number
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          region_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_options: {
        Row: {
          asset_path: string | null
          created_at: string
          id: string
          position: number
          test_id: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          asset_path?: string | null
          created_at?: string
          id?: string
          position: number
          test_id: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          asset_path?: string | null
          created_at?: string
          id?: string
          position?: number
          test_id?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_options_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          question: string
          reward_points: number
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["test_status"]
          store_id: string
          target_votes: number
          title: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          question: string
          reward_points?: number
          slug?: string
          starts_at: string
          status?: Database["public"]["Enums"]["test_status"]
          store_id: string
          target_votes: number
          title: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          question?: string
          reward_points?: number
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["test_status"]
          store_id?: string
          target_votes?: number
          title?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_target_votes_fkey"
            columns: ["target_votes"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["target_votes"]
          },
        ]
      }
      user_consents: {
        Row: {
          agreed_at: string
          document_id: string
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          agreed_at?: string
          document_id: string
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          agreed_at?: string
          document_id?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      age_band:
        | "teens"
        | "twenties"
        | "thirties"
        | "forties"
        | "fifties"
        | "sixties_plus"
      test_status: "draft" | "scheduled" | "active" | "completed" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  api: {
    Enums: {},
  },
  private: {
    Enums: {
      billing_status: ["reserved", "settled", "cancelled"],
      owner_credit_entry_type: [
        "admin_grant",
        "test_charge",
        "test_refund",
        "adjustment",
      ],
      reward_point_entry_type: ["vote_reward", "adjustment"],
    },
  },
  public: {
    Enums: {
      age_band: [
        "teens",
        "twenties",
        "thirties",
        "forties",
        "fifties",
        "sixties_plus",
      ],
      test_status: ["draft", "scheduled", "active", "completed", "cancelled"],
    },
  },
} as const
