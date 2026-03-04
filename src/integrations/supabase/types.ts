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
      admin_metric_alerts: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          label: string
          metric_key: string
          operator: string
          severity: string
          threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          label: string
          metric_key: string
          operator?: string
          severity?: string
          threshold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          label?: string
          metric_key?: string
          operator?: string
          severity?: string
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_name: string
          client_whatsapp: string
          created_at: string
          id: string
          notes: string | null
          preferred_date: string | null
          status: string
          treatment_category: string
        }
        Insert: {
          client_name: string
          client_whatsapp: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          status?: string
          treatment_category: string
        }
        Update: {
          client_name?: string
          client_whatsapp?: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          status?: string
          treatment_category?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: string
          nome: string
          notas: string | null
          servico_interesse: string
          status: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          notas?: string | null
          servico_interesse: string
          status?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          notas?: string | null
          servico_interesse?: string
          status?: string
          whatsapp?: string
        }
        Relationships: []
      }
      lgpd_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          phone: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          request_type: string
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type?: string
          status?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          agent_limit: number | null
          created_at: string
          id: string
          lead_limit: number | null
          name: string
          price_brl: number
          slug: string
        }
        Insert: {
          agent_limit?: number | null
          created_at?: string
          id?: string
          lead_limit?: number | null
          name: string
          price_brl?: number
          slug: string
        }
        Update: {
          agent_limit?: number | null
          created_at?: string
          id?: string
          lead_limit?: number | null
          name?: string
          price_brl?: number
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          onboarding_completed: boolean | null
          plan: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          onboarding_completed?: boolean | null
          plan?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          onboarding_completed?: boolean | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vox_agents: {
        Row: {
          ai_avatar_url: string | null
          chat_theme: string
          chat_theme_config: Json | null
          created_at: string
          custom_css: string | null
          id: string
          is_active: boolean
          name: string
          primary_color: string
          system_prompt: string | null
          updated_at: string
          user_id: string
          voice_accent: string | null
          voice_enabled: boolean | null
          voice_name: string | null
          voice_response_pct: number | null
          voice_show_text: boolean | null
          voice_speed: number | null
          webhook_url: string | null
          welcome_message: string
          widget_position: string | null
          widget_trigger_scroll: number | null
          widget_trigger_seconds: number | null
        }
        Insert: {
          ai_avatar_url?: string | null
          chat_theme?: string
          chat_theme_config?: Json | null
          created_at?: string
          custom_css?: string | null
          id?: string
          is_active?: boolean
          name?: string
          primary_color?: string
          system_prompt?: string | null
          updated_at?: string
          user_id: string
          voice_accent?: string | null
          voice_enabled?: boolean | null
          voice_name?: string | null
          voice_response_pct?: number | null
          voice_show_text?: boolean | null
          voice_speed?: number | null
          webhook_url?: string | null
          welcome_message?: string
          widget_position?: string | null
          widget_trigger_scroll?: number | null
          widget_trigger_seconds?: number | null
        }
        Update: {
          ai_avatar_url?: string | null
          chat_theme?: string
          chat_theme_config?: Json | null
          created_at?: string
          custom_css?: string | null
          id?: string
          is_active?: boolean
          name?: string
          primary_color?: string
          system_prompt?: string | null
          updated_at?: string
          user_id?: string
          voice_accent?: string | null
          voice_enabled?: boolean | null
          voice_name?: string | null
          voice_response_pct?: number | null
          voice_show_text?: boolean | null
          voice_speed?: number | null
          webhook_url?: string | null
          welcome_message?: string
          widget_position?: string | null
          widget_trigger_scroll?: number | null
          widget_trigger_seconds?: number | null
        }
        Relationships: []
      }
      vox_knowledge: {
        Row: {
          agent_id: string | null
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vox_knowledge_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vox_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vox_leads: {
        Row: {
          agent_id: string | null
          city: string | null
          created_at: string
          email: string | null
          handoff_requested: boolean | null
          id: string
          ip_address: string | null
          name: string
          notes: string | null
          phone: string | null
          qualification_score: number | null
          qualified: boolean
          region: string | null
          source: string | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          agent_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          handoff_requested?: boolean | null
          id?: string
          ip_address?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          qualification_score?: number | null
          qualified?: boolean
          region?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          agent_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          handoff_requested?: boolean | null
          id?: string
          ip_address?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          qualification_score?: number | null
          qualified?: boolean
          region?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vox_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vox_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vox_messages: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          id: string
          lead_id: string
          message_type: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id: string
          message_type?: string
          metadata?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          message_type?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vox_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vox_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vox_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vox_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      vox_rate_limits: {
        Row: {
          id: string
          ip_address: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          id?: string
          ip_address: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          id?: string
          ip_address?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      vox_settings: {
        Row: {
          ai_avatar_url: string | null
          ai_name: string
          braip_pixel: string | null
          chat_theme: string
          chat_theme_config: Json | null
          created_at: string
          custom_css: string | null
          eduzz_pixel: string | null
          google_ads: string | null
          google_analytics: string | null
          greenn_pixel: string | null
          hotmart_pixel: string | null
          id: string
          kiwify_pixel: string | null
          kwai_pixel: string | null
          meta_pixel: string | null
          monetizze_pixel: string | null
          notify_email: string | null
          notify_on_new_lead: boolean | null
          notify_on_qualified: boolean | null
          perfectpay_pixel: string | null
          pre_chat_fields: Json | null
          primary_color: string
          system_prompt: string | null
          taboola_pixel: string | null
          ticto_pixel: string | null
          tiktok_pixel: string | null
          updated_at: string
          user_id: string
          voice_accent: string | null
          voice_enabled: boolean | null
          voice_name: string | null
          voice_response_pct: number | null
          voice_show_text: boolean | null
          voice_speed: number | null
          webhook_url: string | null
          welcome_message: string
          widget_position: string | null
          widget_trigger_scroll: number | null
          widget_trigger_seconds: number | null
        }
        Insert: {
          ai_avatar_url?: string | null
          ai_name?: string
          braip_pixel?: string | null
          chat_theme?: string
          chat_theme_config?: Json | null
          created_at?: string
          custom_css?: string | null
          eduzz_pixel?: string | null
          google_ads?: string | null
          google_analytics?: string | null
          greenn_pixel?: string | null
          hotmart_pixel?: string | null
          id?: string
          kiwify_pixel?: string | null
          kwai_pixel?: string | null
          meta_pixel?: string | null
          monetizze_pixel?: string | null
          notify_email?: string | null
          notify_on_new_lead?: boolean | null
          notify_on_qualified?: boolean | null
          perfectpay_pixel?: string | null
          pre_chat_fields?: Json | null
          primary_color?: string
          system_prompt?: string | null
          taboola_pixel?: string | null
          ticto_pixel?: string | null
          tiktok_pixel?: string | null
          updated_at?: string
          user_id: string
          voice_accent?: string | null
          voice_enabled?: boolean | null
          voice_name?: string | null
          voice_response_pct?: number | null
          voice_show_text?: boolean | null
          voice_speed?: number | null
          webhook_url?: string | null
          welcome_message?: string
          widget_position?: string | null
          widget_trigger_scroll?: number | null
          widget_trigger_seconds?: number | null
        }
        Update: {
          ai_avatar_url?: string | null
          ai_name?: string
          braip_pixel?: string | null
          chat_theme?: string
          chat_theme_config?: Json | null
          created_at?: string
          custom_css?: string | null
          eduzz_pixel?: string | null
          google_ads?: string | null
          google_analytics?: string | null
          greenn_pixel?: string | null
          hotmart_pixel?: string | null
          id?: string
          kiwify_pixel?: string | null
          kwai_pixel?: string | null
          meta_pixel?: string | null
          monetizze_pixel?: string | null
          notify_email?: string | null
          notify_on_new_lead?: boolean | null
          notify_on_qualified?: boolean | null
          perfectpay_pixel?: string | null
          pre_chat_fields?: Json | null
          primary_color?: string
          system_prompt?: string | null
          taboola_pixel?: string | null
          ticto_pixel?: string | null
          tiktok_pixel?: string | null
          updated_at?: string
          user_id?: string
          voice_accent?: string | null
          voice_enabled?: boolean | null
          voice_name?: string | null
          voice_response_pct?: number | null
          voice_show_text?: boolean | null
          voice_speed?: number | null
          webhook_url?: string | null
          welcome_message?: string
          widget_position?: string | null
          widget_trigger_scroll?: number | null
          widget_trigger_seconds?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_lead_limit: { Args: { _user_id: string }; Returns: boolean }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
