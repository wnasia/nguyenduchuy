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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          contact_telegram: string | null
          created_at: string
          email_sent_at: string | null
          id: string
          last_message: string | null
          last_message_at: string
          unread_count: number
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          contact_telegram?: string | null
          created_at?: string
          email_sent_at?: string | null
          id: string
          last_message?: string | null
          last_message_at?: string
          unread_count?: number
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          contact_telegram?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string
          unread_count?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      blocked_entities: {
        Row: {
          blocked_by: string | null
          created_at: string
          entity_type: string
          entity_value: string
          expires_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          entity_type: string
          entity_value: string
          expires_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          entity_type?: string
          entity_value?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          note_content: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          note_content: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          note_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          auth_user_id: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          customer_name: string
          domain_expiry_date: string | null
          domain_price: number | null
          domain_provider_info: string | null
          email: string | null
          hosting_expiry_date: string | null
          hosting_price: number | null
          hosting_provider: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          services: string[] | null
          tax_rate: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_name: string
          domain_expiry_date?: string | null
          domain_price?: number | null
          domain_provider_info?: string | null
          email?: string | null
          hosting_expiry_date?: string | null
          hosting_price?: number | null
          hosting_provider?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          services?: string[] | null
          tax_rate?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string
          domain_expiry_date?: string | null
          domain_price?: number | null
          domain_provider_info?: string | null
          email?: string | null
          hosting_expiry_date?: string | null
          hosting_price?: number | null
          hosting_provider?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          services?: string[] | null
          tax_rate?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      daily_settlements: {
        Row: {
          created_at: string
          daily_budget: number
          id: string
          phase: number
          settlement_date: string
          tokens_per_view: number
          total_tokens_distributed: number
          total_valid_views: number
          unique_users: number
        }
        Insert: {
          created_at?: string
          daily_budget?: number
          id?: string
          phase?: number
          settlement_date: string
          tokens_per_view?: number
          total_tokens_distributed?: number
          total_valid_views?: number
          unique_users?: number
        }
        Update: {
          created_at?: string
          daily_budget?: number
          id?: string
          phase?: number
          settlement_date?: string
          tokens_per_view?: number
          total_tokens_distributed?: number
          total_valid_views?: number
          unique_users?: number
        }
        Relationships: []
      }
      emission_stats: {
        Row: {
          average_read_time: number
          created_at: string
          cumulative_tokens_issued: number
          id: string
          stat_date: string
          total_tokens_issued: number
          total_valid_views: number
          unique_readers: number
        }
        Insert: {
          average_read_time?: number
          created_at?: string
          cumulative_tokens_issued?: number
          id?: string
          stat_date: string
          total_tokens_issued?: number
          total_valid_views?: number
          unique_readers?: number
        }
        Update: {
          average_read_time?: number
          created_at?: string
          cumulative_tokens_issued?: number
          id?: string
          stat_date?: string
          total_tokens_issued?: number
          total_valid_views?: number
          unique_readers?: number
        }
        Relationships: []
      }
      fb_conversations: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_psid: string | null
          id: string
          is_resolved: boolean
          last_message_at: string
          last_message_text: string | null
          page_ref: string
          post_id: string | null
          thread_key: string
          thread_type: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_psid?: string | null
          id?: string
          is_resolved?: boolean
          last_message_at?: string
          last_message_text?: string | null
          page_ref: string
          post_id?: string | null
          thread_key: string
          thread_type?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_psid?: string | null
          id?: string
          is_resolved?: boolean
          last_message_at?: string
          last_message_text?: string | null
          page_ref?: string
          post_id?: string | null
          thread_key?: string
          thread_type?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_conversations_page_ref_fkey"
            columns: ["page_ref"]
            isOneToOne: false
            referencedRelation: "fb_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_messages: {
        Row: {
          attachments: Json
          conversation_id: string
          created_at: string
          direction: string
          external_id: string | null
          id: string
          message: string | null
          sender_name: string | null
          sent_at: string
        }
        Insert: {
          attachments?: Json
          conversation_id: string
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          message?: string | null
          sender_name?: string | null
          sent_at?: string
        }
        Update: {
          attachments?: Json
          conversation_id?: string
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          message?: string | null
          sender_name?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "fb_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_pages: {
        Row: {
          access_token: string
          assigned_user_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          page_id: string
          page_name: string
          updated_at: string
        }
        Insert: {
          access_token: string
          assigned_user_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          page_id: string
          page_name: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          assigned_user_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          page_id?: string
          page_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          moderated_at: string | null
          moderated_by: string | null
          rejection_reason: string | null
          status: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          created_at: string
          created_by: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          channel: string
          created_at: string
          customer_id: string
          error_message: string | null
          id: string
          message: string | null
          notification_type: string
          related_expiry_date: string | null
          related_expiry_type: string
          reminder_rule_id: string | null
          send_status: string
          sent_at: string | null
          title: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          customer_id: string
          error_message?: string | null
          id?: string
          message?: string | null
          notification_type?: string
          related_expiry_date?: string | null
          related_expiry_type: string
          reminder_rule_id?: string | null
          send_status?: string
          sent_at?: string | null
          title?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string
          error_message?: string | null
          id?: string
          message?: string | null
          notification_type?: string
          related_expiry_date?: string | null
          related_expiry_type?: string
          reminder_rule_id?: string | null
          send_status?: string
          sent_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_reminder_rule_id_fkey"
            columns: ["reminder_rule_id"]
            isOneToOne: false
            referencedRelation: "reminder_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_post_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_post_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_post_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_topics: {
        Row: {
          created_at: string
          id: string
          post_id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          topic_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_topics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_featured: boolean
          media_url: string | null
          slug: string | null
          status: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          media_url?: string | null
          slug?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          media_url?: string | null
          slug?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          created_at: string
          fingerprint: string
          heartbeat_count: number
          id: string
          invalidation_reason: string | null
          ip_address: unknown
          is_tab_visible: boolean
          is_valid: boolean | null
          last_heartbeat: string
          post_id: string
          started_at: string
          total_active_seconds: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fingerprint: string
          heartbeat_count?: number
          id?: string
          invalidation_reason?: string | null
          ip_address: unknown
          is_tab_visible?: boolean
          is_valid?: boolean | null
          last_heartbeat?: string
          post_id: string
          started_at?: string
          total_active_seconds?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fingerprint?: string
          heartbeat_count?: number
          id?: string
          invalidation_reason?: string | null
          ip_address?: unknown
          is_tab_visible?: boolean
          is_valid?: boolean | null
          last_heartbeat?: string
          post_id?: string
          started_at?: string
          total_active_seconds?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_rules: {
        Row: {
          applies_to_all: boolean
          channel: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          days_before_expiry: number
          id: string
          is_default: boolean
          is_enabled: boolean
          name: string
          reminder_type: string
          updated_at: string
        }
        Insert: {
          applies_to_all?: boolean
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          days_before_expiry: number
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          name: string
          reminder_type?: string
          updated_at?: string
        }
        Update: {
          applies_to_all?: boolean
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          days_before_expiry?: number
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          name?: string
          reminder_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_rules_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_templates: {
        Row: {
          body_template: string
          created_at: string
          id: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          id?: string
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          id?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      renewal_history: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          new_expiry_date: string
          note: string | null
          old_expiry_date: string | null
          renewal_type: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          new_expiry_date: string
          note?: string | null
          old_expiry_date?: string | null
          renewal_type: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          new_expiry_date?: string
          note?: string | null
          old_expiry_date?: string | null
          renewal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      suspicious_activity: {
        Row: {
          activity_type: string
          created_at: string
          details: Json | null
          fingerprint: string | null
          id: string
          ip_address: unknown
          resolved: boolean
          severity: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          details?: Json | null
          fingerprint?: string | null
          id?: string
          ip_address?: unknown
          resolved?: boolean
          severity?: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: Json | null
          fingerprint?: string | null
          id?: string
          ip_address?: unknown
          resolved?: boolean
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      token_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_valid_views: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_valid_views?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_valid_views?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          settlement_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          settlement_id?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          settlement_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_ledger_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "daily_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      tokenomics_config: {
        Row: {
          base_views_per_token: number
          created_at: string
          difficulty_increase_percent: number
          heartbeat_interval_seconds: number
          id: string
          is_active: boolean
          min_read_time_seconds: number
          phase_start_date: string
          phase1_budget: number
          phase1_days: number
          phase2_budget: number
          phase2_days: number
          total_supply: number
          updated_at: string
        }
        Insert: {
          base_views_per_token?: number
          created_at?: string
          difficulty_increase_percent?: number
          heartbeat_interval_seconds?: number
          id?: string
          is_active?: boolean
          min_read_time_seconds?: number
          phase_start_date?: string
          phase1_budget?: number
          phase1_days?: number
          phase2_budget?: number
          phase2_days?: number
          total_supply?: number
          updated_at?: string
        }
        Update: {
          base_views_per_token?: number
          created_at?: string
          difficulty_increase_percent?: number
          heartbeat_interval_seconds?: number
          id?: string
          is_active?: boolean
          min_read_time_seconds?: number
          phase_start_date?: string
          phase1_budget?: number
          phase1_days?: number
          phase2_budget?: number
          phase2_days?: number
          total_supply?: number
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          status: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          status?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          status?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      valid_views: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          ip_address: unknown
          post_id: string
          session_id: string | null
          settled: boolean
          tokens_earned: number | null
          user_id: string | null
          view_date: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          ip_address: unknown
          post_id: string
          session_id?: string | null
          settled?: boolean
          tokens_earned?: number | null
          user_id?: string | null
          view_date?: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          ip_address?: unknown
          post_id?: string
          session_id?: string | null
          settled?: boolean
          tokens_earned?: number | null
          user_id?: string | null
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "valid_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valid_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "reading_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          view_count: number
          youtube_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number
          youtube_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number
          youtube_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: { Args: { title: string }; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_post_views: { Args: { post_id: string }; Returns: undefined }
      link_customer_by_email: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
