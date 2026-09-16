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
      ad_clicks: {
        Row: {
          creative_id: string
          id: string
          occurred_at: string | null
          placement_id: string
          user_id: string | null
        }
        Insert: {
          creative_id: string
          id?: string
          occurred_at?: string | null
          placement_id: string
          user_id?: string | null
        }
        Update: {
          creative_id?: string
          id?: string
          occurred_at?: string | null
          placement_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          body: string | null
          call_to_action: string | null
          campaign_id: string
          created_at: string | null
          destination_url: string | null
          headline: string | null
          id: string
          media_asset_id: string | null
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          call_to_action?: string | null
          campaign_id: string
          created_at?: string | null
          destination_url?: string | null
          headline?: string | null
          id?: string
          media_asset_id?: string | null
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          call_to_action?: string | null
          campaign_id?: string
          created_at?: string | null
          destination_url?: string | null
          headline?: string | null
          id?: string
          media_asset_id?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ad_impressions: {
        Row: {
          creative_id: string
          id: string
          occurred_at: string | null
          placement_id: string
          user_id: string | null
        }
        Insert: {
          creative_id: string
          id?: string
          occurred_at?: string | null
          placement_id: string
          user_id?: string | null
        }
        Update: {
          creative_id?: string
          id?: string
          occurred_at?: string | null
          placement_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          created_at: string | null
          description: string | null
          height: number
          id: string
          name: string
          position: string
          updated_by: string | null
          width: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          height?: number
          id?: string
          name: string
          position: string
          updated_by?: string | null
          width?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          height?: number
          id?: string
          name?: string
          position?: string
          updated_by?: string | null
          width?: number
        }
        Relationships: []
      }
      admin_action_logs: {
        Row: {
          action: string
          actor_admin_id: string | null
          actor_role: string
          actor_user_id: string | null
          created_at: string
          domain: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_admin_id?: string | null
          actor_role: string
          actor_user_id?: string | null
          created_at?: string
          domain: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_admin_id?: string | null
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          domain?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_override_logs: {
        Row: {
          action: string
          admin_id: string | null
          city_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          city_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          city_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_override_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          auth_uid: string | null
          city_ids: string[] | null
          created_at: string | null
          email: string
          id: string
          password_hash: string | null
          primary_city_slug: string | null
          role: string
          status: string
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          auth_uid?: string | null
          city_ids?: string[] | null
          created_at?: string | null
          email: string
          id?: string
          password_hash?: string | null
          primary_city_slug?: string | null
          role: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          auth_uid?: string | null
          city_ids?: string[] | null
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string | null
          primary_city_slug?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_response_cache: {
        Row: {
          cache_key: string
          city_name: string | null
          created_at: string | null
          id: string
          response: string
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cache_key: string
          city_name?: string | null
          created_at?: string | null
          id?: string
          response: string
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cache_key?: string
          city_name?: string | null
          created_at?: string | null
          id?: string
          response?: string
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          city_name: string | null
          cost_estimate: number | null
          created_at: string | null
          endpoint: string
          id: string
          metadata: Json | null
          model: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          city_name?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          endpoint: string
          id?: string
          metadata?: Json | null
          model: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          city_name?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          metadata?: Json | null
          model?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          color_primary: string | null
          color_secondary: string | null
          country: string | null
          created_at: string | null
          domain: string
          electrum_year: number | null
          electrum_year_label: string | null
          founded_year: number | null
          hero_image_url: string | null
          id: string
          incorporated_year: number | null
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          motion_style: string | null
          name: string
          population: number | null
          primary_temporal_layer_id: string | null
          slug: string
          state_province: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          color_primary?: string | null
          color_secondary?: string | null
          country?: string | null
          created_at?: string | null
          domain: string
          electrum_year?: number | null
          electrum_year_label?: string | null
          founded_year?: number | null
          hero_image_url?: string | null
          id?: string
          incorporated_year?: number | null
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          motion_style?: string | null
          name: string
          population?: number | null
          primary_temporal_layer_id?: string | null
          slug: string
          state_province?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          color_primary?: string | null
          color_secondary?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string
          electrum_year?: number | null
          electrum_year_label?: string | null
          founded_year?: number | null
          hero_image_url?: string | null
          id?: string
          incorporated_year?: number | null
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          motion_style?: string | null
          name?: string
          population?: number | null
          primary_temporal_layer_id?: string | null
          slug?: string
          state_province?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      city_brand_settings: {
        Row: {
          accessibility: Json | null
          child_safety: Json | null
          city_id: string
          created_at: string | null
          description: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_subtitle: string | null
          hero_title: string | null
          homepage_subtitle: string | null
          homepage_tagline: string | null
          id: string
          logo: Json | null
          pages: Json | null
          slideshow_asset_ids: string[] | null
          social_bluesky: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_youtube: string | null
          summary: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accessibility?: Json | null
          child_safety?: Json | null
          city_id: string
          created_at?: string | null
          description?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          homepage_subtitle?: string | null
          homepage_tagline?: string | null
          id?: string
          logo?: Json | null
          pages?: Json | null
          slideshow_asset_ids?: string[] | null
          social_bluesky?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_youtube?: string | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accessibility?: Json | null
          child_safety?: Json | null
          city_id?: string
          created_at?: string | null
          description?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          homepage_subtitle?: string | null
          homepage_tagline?: string | null
          id?: string
          logo?: Json | null
          pages?: Json | null
          slideshow_asset_ids?: string[] | null
          social_bluesky?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_youtube?: string | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_brand_settings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_brand_settings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      city_budget: {
        Row: {
          allocated_cents: number
          city_id: string
          created_at: string
          created_by: string
          fiscal_year: number
          id: string
          period_label: string | null
          remaining_amount_cents: number | null
          spent_amount_cents: number
          status: string
          total_budget_cents: number
          updated_at: string
        }
        Insert: {
          allocated_cents?: number
          city_id: string
          created_at?: string
          created_by: string
          fiscal_year: number
          id?: string
          period_label?: string | null
          remaining_amount_cents?: number | null
          spent_amount_cents?: number
          status?: string
          total_budget_cents: number
          updated_at?: string
        }
        Update: {
          allocated_cents?: number
          city_id?: string
          created_at?: string
          created_by?: string
          fiscal_year?: number
          id?: string
          period_label?: string | null
          remaining_amount_cents?: number | null
          spent_amount_cents?: number
          status?: string
          total_budget_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_budget_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_budget_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_budget_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      city_design_system: {
        Row: {
          city_id: string | null
          draft_theme: Json | null
          id: string
          published_theme: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id?: string | null
          draft_theme?: Json | null
          id?: string
          published_theme?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string | null
          draft_theme?: Json | null
          id?: string
          published_theme?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_design_system_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_design_system_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      city_feature_toggles: {
        Row: {
          city_id: string
          created_at: string | null
          enabled: boolean | null
          feature_name: string
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          enabled?: boolean | null
          feature_name: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          enabled?: boolean | null
          feature_name?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_feature_toggles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_feature_toggles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      city_freeze_events: {
        Row: {
          city_id: string
          created_at: string | null
          end_at: string | null
          id: string
          issued_by_user_id: string | null
          notes: string | null
          reason_code: string
          start_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          issued_by_user_id?: string | null
          notes?: string | null
          reason_code: string
          start_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          issued_by_user_id?: string | null
          notes?: string | null
          reason_code?: string
          start_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_freeze_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_freeze_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      city_navigation: {
        Row: {
          city_id: string
          created_at: string
          id: string
          nav_links: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          nav_links?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          nav_links?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_navigation_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_navigation_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      city_prompts: {
        Row: {
          city_name: string
          created_at: string | null
          domain: string
          id: number
          system_prompt: string
          updated_by: string | null
        }
        Insert: {
          city_name: string
          created_at?: string | null
          domain: string
          id?: number
          system_prompt: string
          updated_by?: string | null
        }
        Update: {
          city_name?: string
          created_at?: string | null
          domain?: string
          id?: number
          system_prompt?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      city_safety_settings: {
        Row: {
          city_id: string
          created_at: string | null
          id: string
          local_rules_json: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          id?: string
          local_rules_json?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          id?: string
          local_rules_json?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_safety_settings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_safety_settings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_artifacts: {
        Row: {
          artifact_type: string
          city_id: string | null
          city_slug: string | null
          created_at: string | null
          description: string | null
          hero_360_url: string | null
          hero_image_url: string | null
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          is_published: boolean | null
          media_url: string | null
          media_urls: string[] | null
          related_event_ids: string[] | null
          slug: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          year: number | null
        }
        Insert: {
          artifact_type: string
          city_id?: string | null
          city_slug?: string | null
          created_at?: string | null
          description?: string | null
          hero_360_url?: string | null
          hero_image_url?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          media_url?: string | null
          media_urls?: string[] | null
          related_event_ids?: string[] | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          year?: number | null
        }
        Update: {
          artifact_type?: string
          city_id?: string | null
          city_slug?: string | null
          created_at?: string | null
          description?: string | null
          hero_360_url?: string | null
          hero_image_url?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          media_url?: string | null
          media_urls?: string[] | null
          related_event_ids?: string[] | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_artifacts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_artifacts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_entities: {
        Row: {
          birth_year: number | null
          city_id: string | null
          created_at: string | null
          death_year: number | null
          description: string | null
          entity_type: string
          era_id: string | null
          hero_360_url: string | null
          hero_image_url: string | null
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          is_published: boolean | null
          media_urls: string[] | null
          name: string
          roles: string | null
          slug: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          updated_by: string | null
          year: number | null
        }
        Insert: {
          birth_year?: number | null
          city_id?: string | null
          created_at?: string | null
          death_year?: number | null
          description?: string | null
          entity_type: string
          era_id?: string | null
          hero_360_url?: string | null
          hero_image_url?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          media_urls?: string[] | null
          name: string
          roles?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year?: number | null
        }
        Update: {
          birth_year?: number | null
          city_id?: string | null
          created_at?: string | null
          death_year?: number | null
          description?: string | null
          entity_type?: string
          era_id?: string | null
          hero_360_url?: string | null
          hero_image_url?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          media_urls?: string[] | null
          name?: string
          roles?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_entities_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "civic_eras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_entities_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "public_civic_eras"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_eras: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          end_year: number | null
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          is_published: boolean | null
          name: string
          slug: string | null
          start_year: number | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          name: string
          slug?: string | null
          start_year?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          name?: string
          slug?: string | null
          start_year?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_eras_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_eras_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_events: {
        Row: {
          casualties: number | null
          city_id: string | null
          created_at: string | null
          description: string | null
          economic_impact: number | null
          end_date: string | null
          event_type: string
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          is_published: boolean | null
          name: string
          severity: string | null
          slug: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          thumbnail_360_url: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          casualties?: number | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          economic_impact?: number | null
          end_date?: string | null
          event_type: string
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          name: string
          severity?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_360_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          casualties?: number | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          economic_impact?: number | null
          end_date?: string | null
          event_type?: string
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          name?: string
          severity?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_360_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_moments: {
        Row: {
          body: string | null
          city_id: string | null
          created_at: string | null
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          inline_360_urls: string[] | null
          is_published: boolean | null
          moment_time: string
          slug: string | null
          status: string | null
          thumbnail_360_url: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          city_id?: string | null
          created_at?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          inline_360_urls?: string[] | null
          is_published?: boolean | null
          moment_time: string
          slug?: string | null
          status?: string | null
          thumbnail_360_url?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          city_id?: string | null
          created_at?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          inline_360_urls?: string[] | null
          is_published?: boolean | null
          moment_time?: string
          slug?: string | null
          status?: string | null
          thumbnail_360_url?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moments_primary_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_primary_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_neighborhoods: {
        Row: {
          city_id: string
          created_at: string | null
          description: string | null
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          is_published: boolean | null
          name: string
          slug: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          name: string
          slug: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          name?: string
          slug?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_object_suggestions: {
        Row: {
          created_at: string
          id: string
          object_id: string
          object_type: string
          payload: Json
          suggestion_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          object_id: string
          object_type: string
          payload: Json
          suggestion_type: string
        }
        Update: {
          created_at?: string
          id?: string
          object_id?: string
          object_type?: string
          payload?: Json
          suggestion_type?: string
        }
        Relationships: []
      }
      civic_places: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          is_published: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          place_type: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          year_built: number | null
          year_demolished: number | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          place_type?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year_built?: number | null
          year_demolished?: number | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ingestion_metadata?: Json | null
          ingestion_source?: string | null
          is_published?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          place_type?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year_built?: number | null
          year_demolished?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_relationships: {
        Row: {
          created_at: string | null
          from_id: string
          from_type: string
          id: string
          to_id: string
          to_type: string
        }
        Insert: {
          created_at?: string | null
          from_id: string
          from_type: string
          id?: string
          to_id: string
          to_type: string
        }
        Update: {
          created_at?: string | null
          from_id?: string
          from_type?: string
          id?: string
          to_id?: string
          to_type?: string
        }
        Relationships: []
      }
      civic_stories: {
        Row: {
          author_name: string | null
          body: string | null
          category: string | null
          city: string | null
          city_id: string | null
          contributor_id: string | null
          created_at: string | null
          cross_city_links: string[] | null
          date_range: string | null
          editor_id: string | null
          entities: string[] | null
          flag_reason: string | null
          hero_360_url: string | null
          hero_image_url: string | null
          id: string
          image_description: string | null
          inline_360_urls: string[] | null
          is_frozen: boolean | null
          is_published: boolean | null
          neighborhood: string | null
          neighborhood_360_url: string | null
          published_at: string | null
          related_entity_ids: string[] | null
          related_event_ids: string[] | null
          related_moment_ids: string[] | null
          related_place_ids: string[] | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          revision_notes: string | null
          revision_requested: boolean | null
          revision_submitted_at: string | null
          slug: string | null
          sponsor_360_url: string | null
          sponsor_alt_text: string | null
          sponsor_flat_url: string | null
          sponsor_link: string | null
          sponsor_name: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_360_url: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          year: number | null
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          city?: string | null
          city_id?: string | null
          contributor_id?: string | null
          created_at?: string | null
          cross_city_links?: string[] | null
          date_range?: string | null
          editor_id?: string | null
          entities?: string[] | null
          flag_reason?: string | null
          hero_360_url?: string | null
          hero_image_url?: string | null
          id?: string
          image_description?: string | null
          inline_360_urls?: string[] | null
          is_frozen?: boolean | null
          is_published?: boolean | null
          neighborhood?: string | null
          neighborhood_360_url?: string | null
          published_at?: string | null
          related_entity_ids?: string[] | null
          related_event_ids?: string[] | null
          related_moment_ids?: string[] | null
          related_place_ids?: string[] | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          revision_notes?: string | null
          revision_requested?: boolean | null
          revision_submitted_at?: string | null
          slug?: string | null
          sponsor_360_url?: string | null
          sponsor_alt_text?: string | null
          sponsor_flat_url?: string | null
          sponsor_link?: string | null
          sponsor_name?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_360_url?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          year?: number | null
        }
        Update: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          city?: string | null
          city_id?: string | null
          contributor_id?: string | null
          created_at?: string | null
          cross_city_links?: string[] | null
          date_range?: string | null
          editor_id?: string | null
          entities?: string[] | null
          flag_reason?: string | null
          hero_360_url?: string | null
          hero_image_url?: string | null
          id?: string
          image_description?: string | null
          inline_360_urls?: string[] | null
          is_frozen?: boolean | null
          is_published?: boolean | null
          neighborhood?: string | null
          neighborhood_360_url?: string | null
          published_at?: string | null
          related_entity_ids?: string[] | null
          related_event_ids?: string[] | null
          related_moment_ids?: string[] | null
          related_place_ids?: string[] | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          revision_notes?: string | null
          revision_requested?: boolean | null
          revision_submitted_at?: string | null
          slug?: string | null
          sponsor_360_url?: string | null
          sponsor_alt_text?: string | null
          sponsor_flat_url?: string | null
          sponsor_link?: string | null
          sponsor_name?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_360_url?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      contributors: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          city_id: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          display_name: string
          email: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_eras: {
        Row: {
          created_at: string | null
          era_id: string | null
          event_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          era_id?: string | null
          event_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          era_id?: string | null
          event_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_eras_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "civic_eras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_eras_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "public_civic_eras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_eras_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "civic_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_eras_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_civic_events"
            referencedColumns: ["id"]
          },
        ]
      }
      flag_events: {
        Row: {
          city_id: string
          content_item_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          city_id: string
          content_item_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          city_id?: string
          content_item_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flag_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flag_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flag_events_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "civic_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flag_events_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "civic_stories_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flag_events_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "civic_stories_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flag_events_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "public_civic_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_contributor_state: {
        Row: {
          city_id: string | null
          contributor_id: string | null
          fraud_level: string | null
          fraud_score: number | null
          last_rule_hit_at: string | null
          last_rule_id: string | null
          last_signal_at: string | null
          latest_story_id: string | null
          locked: boolean | null
          locked_at: string | null
          locked_reason: string | null
          signal_count: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          city_id?: string | null
          contributor_id?: string | null
          fraud_level?: string | null
          fraud_score?: number | null
          last_rule_hit_at?: string | null
          last_rule_id?: string | null
          last_signal_at?: string | null
          latest_story_id?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_reason?: string | null
          signal_count?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          city_id?: string | null
          contributor_id?: string | null
          fraud_level?: string | null
          fraud_score?: number | null
          last_rule_hit_at?: string | null
          last_rule_id?: string | null
          last_signal_at?: string | null
          latest_story_id?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_reason?: string | null
          signal_count?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_contributor_state_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: true
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_contributor_state_last_rule_id_fkey"
            columns: ["last_rule_id"]
            isOneToOne: false
            referencedRelation: "fraud_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_rules: {
        Row: {
          action: string | null
          applies_to_signal_type: string
          city_id: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          label: string
          rule_type: string | null
          score_impact: number | null
          severity: string | null
          threshold_count: number
          threshold_window_minutes: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          action?: string | null
          applies_to_signal_type: string
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          label: string
          rule_type?: string | null
          score_impact?: number | null
          severity?: string | null
          threshold_count: number
          threshold_window_minutes: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          action?: string | null
          applies_to_signal_type?: string
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          label?: string
          rule_type?: string | null
          score_impact?: number | null
          severity?: string | null
          threshold_count?: number
          threshold_window_minutes?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      fraud_signals: {
        Row: {
          city_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          reviewed: boolean | null
          score_impact: number | null
          severity: string | null
          signal_type: string
          signal_value: number | null
          user_id: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reviewed?: boolean | null
          score_impact?: number | null
          severity?: string | null
          signal_type: string
          signal_value?: number | null
          user_id?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reviewed?: boolean | null
          score_impact?: number | null
          severity?: string | null
          signal_type?: string
          signal_value?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_signals_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_signals_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
        ]
      }
      game_answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "game_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "public_game_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_attempts: {
        Row: {
          city_id: string
          completed_at: string | null
          game_id: string
          id: string
          score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          city_id: string
          completed_at?: string | null
          game_id: string
          id?: string
          score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          city_id?: string
          completed_at?: string | null
          game_id?: string
          id?: string
          score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_attempts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_attempts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_question_options: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean | null
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "game_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "public_game_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_questions: {
        Row: {
          ai_assisted: boolean | null
          created_at: string | null
          game_id: string
          id: string
          question_text: string
          status: string
        }
        Insert: {
          ai_assisted?: boolean | null
          created_at?: string | null
          game_id: string
          id?: string
          question_text: string
          status?: string
        }
        Update: {
          ai_assisted?: boolean | null
          created_at?: string | null
          game_id?: string
          id?: string
          question_text?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          city_name: string
          completed: boolean
          created_at: string
          game_id: string
          game_session_data: Json | null
          game_type: string
          id: string
          score: number
          time_taken: number
          user_id: string
        }
        Insert: {
          city_name: string
          completed?: boolean
          created_at?: string
          game_id: string
          game_session_data?: Json | null
          game_type: string
          id?: string
          score?: number
          time_taken: number
          user_id: string
        }
        Update: {
          city_name?: string
          completed?: boolean
          created_at?: string
          game_id?: string
          game_session_data?: Json | null
          game_type?: string
          id?: string
          score?: number
          time_taken?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          city_name: string
          created_at: string
          difficulty: string
          game_data: Json
          game_type: string
          id: string
          owner_id: string | null
          published: boolean
          published_at: string | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          city_name: string
          created_at?: string
          difficulty?: string
          game_data: Json
          game_type: string
          id?: string
          owner_id?: string | null
          published?: boolean
          published_at?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          city_name?: string
          created_at?: string
          difficulty?: string
          game_data?: Json
          game_type?: string
          id?: string
          owner_id?: string | null
          published?: boolean
          published_at?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: []
      }
      global_brand_settings: {
        Row: {
          accessibility_defaults_json: Json | null
          child_safety_display_rules_json: Json | null
          created_at: string | null
          dark_mode_enabled: boolean | null
          iconography_style: string | null
          id: string
          logo_asset_id: string | null
          motion_settings_json: Json | null
          neutral_palette_json: Json | null
          primary_color: string | null
          secondary_color: string | null
          typography_json: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accessibility_defaults_json?: Json | null
          child_safety_display_rules_json?: Json | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          iconography_style?: string | null
          id?: string
          logo_asset_id?: string | null
          motion_settings_json?: Json | null
          neutral_palette_json?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          typography_json?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accessibility_defaults_json?: Json | null
          child_safety_display_rules_json?: Json | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          iconography_style?: string | null
          id?: string
          logo_asset_id?: string | null
          motion_settings_json?: Json | null
          neutral_palette_json?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          typography_json?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      global_feature_toggles: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          feature_name: string
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          feature_name: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          feature_name?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      global_permissions: {
        Row: {
          city_admin_permissions_json: Json
          contributor_permissions_json: Json
          created_at: string
          editor_permissions_json: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          city_admin_permissions_json?: Json
          contributor_permissions_json?: Json
          created_at?: string
          editor_permissions_json?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          city_admin_permissions_json?: Json
          contributor_permissions_json?: Json
          created_at?: string
          editor_permissions_json?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      global_safety_settings: {
        Row: {
          child_safety_display_rules_json: Json | null
          content_warning_rules_json: Json | null
          created_at: string | null
          fraud_thresholds_json: Json | null
          id: string
          max_points_per_day: number | null
          max_quiz_attempts_per_day: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          child_safety_display_rules_json?: Json | null
          content_warning_rules_json?: Json | null
          created_at?: string | null
          fraud_thresholds_json?: Json | null
          id?: string
          max_points_per_day?: number | null
          max_quiz_attempts_per_day?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          child_safety_display_rules_json?: Json | null
          content_warning_rules_json?: Json | null
          created_at?: string | null
          fraud_thresholds_json?: Json | null
          id?: string
          max_points_per_day?: number | null
          max_quiz_attempts_per_day?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          created_at: string | null
          default_language: string | null
          default_timezone: string | null
          id: string
          legal_footer_json: Json | null
          maintenance_mode: boolean | null
          public_launch_mode:
            | Database["public"]["Enums"]["public_launch_mode_enum"]
            | null
          support_email: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          default_language?: string | null
          default_timezone?: string | null
          id?: string
          legal_footer_json?: Json | null
          maintenance_mode?: boolean | null
          public_launch_mode?:
            | Database["public"]["Enums"]["public_launch_mode_enum"]
            | null
          support_email?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          default_language?: string | null
          default_timezone?: string | null
          id?: string
          legal_footer_json?: Json | null
          maintenance_mode?: boolean | null
          public_launch_mode?:
            | Database["public"]["Enums"]["public_launch_mode_enum"]
            | null
          support_email?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      moment_entities: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          moment_id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          moment_id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          moment_id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moment_entity_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "civic_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_entity_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "public_civic_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_entity_links_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "civic_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_eras: {
        Row: {
          era_id: string | null
          id: string
          moment_id: string | null
        }
        Insert: {
          era_id?: string | null
          id: string
          moment_id?: string | null
        }
        Update: {
          era_id?: string | null
          id?: string
          moment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moment_eras_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "civic_eras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_eras_era_id_fkey"
            columns: ["era_id"]
            isOneToOne: false
            referencedRelation: "public_civic_eras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_eras_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "civic_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_neighborhoods: {
        Row: {
          id: string
          moment_id: string | null
          neighborhood_id: string | null
        }
        Insert: {
          id: string
          moment_id?: string | null
          neighborhood_id?: string | null
        }
        Update: {
          id?: string
          moment_id?: string | null
          neighborhood_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moment_neighborhoods_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "civic_moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_neighborhoods_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "civic_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_neighborhoods_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "public_civic_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_neighborhoods_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "public_neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_places: {
        Row: {
          id: string
          moment_id: string | null
          place_id: string | null
        }
        Insert: {
          id: string
          moment_id?: string | null
          place_id?: string | null
        }
        Update: {
          id?: string
          moment_id?: string | null
          place_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moment_places_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "civic_moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "civic_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "public_civic_places"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_stories: {
        Row: {
          created_at: string | null
          id: string
          moment_id: string
          story_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          moment_id: string
          story_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          moment_id?: string
          story_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moment_story_links_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "civic_moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_story_links_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "civic_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_story_links_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "civic_stories_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_story_links_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "civic_stories_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_story_links_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "public_civic_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batch_items: {
        Row: {
          amount_cents: number
          city_id: string
          civic_story_id: string | null
          created_at: string
          description: string | null
          id: string
          payee_id: string
          payout_batch_id: string
          production_unit_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          city_id: string
          civic_story_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payee_id: string
          payout_batch_id: string
          production_unit_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          city_id?: string
          civic_story_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payee_id?: string
          payout_batch_id?: string
          production_unit_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batch_items_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_civic_story_id_fkey"
            columns: ["civic_story_id"]
            isOneToOne: false
            referencedRelation: "civic_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_civic_story_id_fkey"
            columns: ["civic_story_id"]
            isOneToOne: false
            referencedRelation: "civic_stories_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_civic_story_id_fkey"
            columns: ["civic_story_id"]
            isOneToOne: false
            referencedRelation: "civic_stories_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_civic_story_id_fkey"
            columns: ["civic_story_id"]
            isOneToOne: false
            referencedRelation: "public_civic_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_payout_batch_id_fkey"
            columns: ["payout_batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batch_items_production_unit_id_fkey"
            columns: ["production_unit_id"]
            isOneToOne: false
            referencedRelation: "production_units"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          batch_ref: string | null
          city_budget_id: string
          city_id: string
          created_at: string
          created_by: string
          id: string
          paid_at: string | null
          status: string
          submitted_at: string | null
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          batch_ref?: string | null
          city_budget_id: string
          city_id: string
          created_at?: string
          created_by: string
          id?: string
          paid_at?: string | null
          status?: string
          submitted_at?: string | null
          total_amount_cents?: number
          updated_at?: string
        }
        Update: {
          batch_ref?: string | null
          city_budget_id?: string
          city_id?: string
          created_at?: string
          created_by?: string
          id?: string
          paid_at?: string | null
          status?: string
          submitted_at?: string | null
          total_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batches_city_budget_id_fkey"
            columns: ["city_budget_id"]
            isOneToOne: false
            referencedRelation: "city_budget"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batches_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batches_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          ai_analytics_enabled: boolean | null
          created_at: string
          debug_mode: boolean | null
          email_notifications: boolean | null
          id: string
          maintenance_mode: boolean | null
          safety_settings: Json | null
          security_alerts: boolean | null
          updated_at: string
          user_id: string
          weekly_reports: boolean | null
        }
        Insert: {
          ai_analytics_enabled?: boolean | null
          created_at?: string
          debug_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          maintenance_mode?: boolean | null
          safety_settings?: Json | null
          security_alerts?: boolean | null
          updated_at?: string
          user_id: string
          weekly_reports?: boolean | null
        }
        Update: {
          ai_analytics_enabled?: boolean | null
          created_at?: string
          debug_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          maintenance_mode?: boolean | null
          safety_settings?: Json | null
          security_alerts?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_reports?: boolean | null
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          campaign_id: string | null
          city_id: string | null
          city_slug: string
          created_at: string | null
          game_id: string | null
          id: string
          metadata: Json | null
          points: number
          source: string
          type: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          city_id?: string | null
          city_slug: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          points: number
          source: string
          type: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          city_id?: string | null
          city_slug?: string
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_city_slug_fkey"
            columns: ["city_slug"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "points_ledger_city_slug_fkey"
            columns: ["city_slug"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "points_ledger_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      production_units: {
        Row: {
          city_budget_id: string | null
          city_id: string
          contributor_payout: number | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          editor_payout: number | null
          gross_cost: number | null
          id: string
          net_city_cost: number | null
          settled_at: string | null
          sponsor_credit: number | null
          status: string
          target_payout_cents: number | null
          title: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          city_budget_id?: string | null
          city_id: string
          contributor_payout?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          editor_payout?: number | null
          gross_cost?: number | null
          id?: string
          net_city_cost?: number | null
          settled_at?: string | null
          sponsor_credit?: number | null
          status?: string
          target_payout_cents?: number | null
          title: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          city_budget_id?: string | null
          city_id?: string
          contributor_payout?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          editor_payout?: number | null
          gross_cost?: number | null
          id?: string
          net_city_cost?: number | null
          settled_at?: string | null
          sponsor_credit?: number | null
          status?: string
          target_payout_cents?: number | null
          title?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_units_city_budget_id_fkey"
            columns: ["city_budget_id"]
            isOneToOne: false
            referencedRelation: "city_budget"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_units_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_units_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_units_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          nickname: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          nickname?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          nickname?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          action: string
          city_id: string | null
          created_at: string | null
          id: string
          metadata_json: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          city_id?: string | null
          created_at?: string | null
          id?: string
          metadata_json?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          city_id?: string | null
          created_at?: string | null
          id?: string
          metadata_json?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_limit_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_ingestion: {
        Row: {
          id: string
          ingested_at: string
          payload: Json
          processed: boolean
          source_name: string
          source_object_id: string
        }
        Insert: {
          id?: string
          ingested_at?: string
          payload: Json
          processed?: boolean
          source_name: string
          source_object_id: string
        }
        Update: {
          id?: string
          ingested_at?: string
          payload?: Json
          processed?: boolean
          source_name?: string
          source_object_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_role: string | null
          old_role: string | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_role?: string | null
          old_role?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_role?: string | null
          old_role?: string | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sponsor_allocations: {
        Row: {
          amount_cents: number
          city_budget_id: string
          city_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          sponsor_name: string
          sponsor_ref: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          city_budget_id: string
          city_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          sponsor_name: string
          sponsor_ref?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          city_budget_id?: string
          city_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          sponsor_name?: string
          sponsor_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_allocations_city_budget_id_fkey"
            columns: ["city_budget_id"]
            isOneToOne: false
            referencedRelation: "city_budget"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_allocations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_allocations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          contact_email: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      civic_stories_admin: {
        Row: {
          id: string | null
          is_frozen: boolean | null
          is_published: boolean | null
          primary_city_id: string | null
          title: string | null
        }
        Insert: {
          id?: string | null
          is_frozen?: boolean | null
          is_published?: boolean | null
          primary_city_id?: string | null
          title?: string | null
        }
        Update: {
          id?: string | null
          is_frozen?: boolean | null
          is_published?: boolean | null
          primary_city_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["primary_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["primary_city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_stories_public: {
        Row: {
          author_name: string | null
          body: string | null
          category: string | null
          city: string | null
          contributor_id: string | null
          created_at: string | null
          cross_city_links: Json | null
          date_range: string | null
          entities: Json | null
          id: string | null
          image_description: string | null
          is_frozen: boolean | null
          is_published: boolean | null
          neighborhood: string | null
          primary_city_id: string | null
          related_entity_ids: Json | null
          related_moment_ids: Json | null
          related_place_ids: Json | null
          slug: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          city?: string | null
          contributor_id?: string | null
          created_at?: string | null
          cross_city_links?: never
          date_range?: string | null
          entities?: never
          id?: string | null
          image_description?: string | null
          is_frozen?: boolean | null
          is_published?: boolean | null
          neighborhood?: string | null
          primary_city_id?: string | null
          related_entity_ids?: never
          related_moment_ids?: never
          related_place_ids?: never
          slug?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          city?: string | null
          contributor_id?: string | null
          created_at?: string | null
          cross_city_links?: never
          date_range?: string | null
          entities?: never
          id?: string | null
          image_description?: string | null
          is_frozen?: boolean | null
          is_published?: boolean | null
          neighborhood?: string | null
          primary_city_id?: string | null
          related_entity_ids?: never
          related_moment_ids?: never
          related_place_ids?: never
          slug?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["primary_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["primary_city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_ad_slots: {
        Row: {
          created_at: string | null
          description: string | null
          height: number | null
          id: string | null
          name: string | null
          position: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string | null
          name?: string | null
          position?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string | null
          name?: string | null
          position?: string | null
          width?: number | null
        }
        Relationships: []
      }
      public_cities: {
        Row: {
          accessibility: Json | null
          child_safety: Json | null
          country: string | null
          description: string | null
          domain: string | null
          electrum_year: number | null
          electrum_year_label: string | null
          founded_year: number | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          homepage_subtitle: string | null
          homepage_tagline: string | null
          id: string | null
          incorporated_year: number | null
          is_primary: boolean | null
          latitude: number | null
          logo: Json | null
          longitude: number | null
          name: string | null
          pages: Json | null
          population: number | null
          primary_temporal_layer_id: string | null
          slideshow_asset_ids: string[] | null
          slug: string | null
          social_bluesky: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_youtube: string | null
          state_province: string | null
          status: string | null
          summary: string | null
        }
        Relationships: []
      }
      public_civic_artifacts: {
        Row: {
          artifact_type: string | null
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          media_url: string | null
          title: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          artifact_type?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          media_url?: string | null
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          artifact_type?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          media_url?: string | null
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_artifacts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_artifacts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_civic_entities: {
        Row: {
          birth_year: number | null
          city_id: string | null
          created_at: string | null
          death_year: number | null
          description: string | null
          entity_type: string | null
          id: string | null
          name: string | null
          roles: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          birth_year?: number | null
          city_id?: string | null
          created_at?: string | null
          death_year?: number | null
          description?: string | null
          entity_type?: string | null
          id?: string | null
          name?: string | null
          roles?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_year?: number | null
          city_id?: string | null
          created_at?: string | null
          death_year?: number | null
          description?: string | null
          entity_type?: string | null
          id?: string | null
          name?: string | null
          roles?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_civic_eras: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          end_year: number | null
          id: string | null
          name: string | null
          start_year: number | null
          updated_at: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string | null
          name?: string | null
          start_year?: number | null
          updated_at?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          end_year?: number | null
          id?: string | null
          name?: string | null
          start_year?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_eras_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_eras_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_civic_events: {
        Row: {
          casualties: number | null
          city_id: string | null
          created_at: string | null
          description: string | null
          economic_impact: number | null
          end_date: string | null
          event_type: string | null
          id: string | null
          name: string | null
          severity: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          casualties?: number | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          economic_impact?: number | null
          end_date?: string | null
          event_type?: string | null
          id?: string | null
          name?: string | null
          severity?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          casualties?: number | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          economic_impact?: number | null
          end_date?: string | null
          event_type?: string | null
          id?: string | null
          name?: string | null
          severity?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_civic_neighborhoods: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_civic_places: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          neighborhood: string | null
          place_type: string | null
          updated_at: string | null
          year_built: number | null
          year_demolished: number | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          neighborhood?: string | null
          place_type?: string | null
          updated_at?: string | null
          year_built?: number | null
          year_demolished?: number | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          neighborhood?: string | null
          place_type?: string | null
          updated_at?: string | null
          year_built?: number | null
          year_demolished?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_civic_stories: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_primary_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_game_question_options: {
        Row: {
          id: string | null
          option_text: string | null
          question_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "game_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "public_game_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      public_game_questions: {
        Row: {
          ai_assisted: boolean | null
          created_at: string | null
          game_id: string | null
          id: string | null
          question_text: string | null
        }
        Insert: {
          ai_assisted?: boolean | null
          created_at?: string | null
          game_id?: string | null
          id?: string | null
          question_text?: string | null
        }
        Update: {
          ai_assisted?: boolean | null
          created_at?: string | null
          game_id?: string | null
          id?: string | null
          question_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
        ]
      }
      public_games: {
        Row: {
          city_name: string | null
          created_at: string | null
          difficulty: string | null
          game_data: Json | null
          game_type: string | null
          id: string | null
          published: boolean | null
          published_at: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          city_name?: string | null
          created_at?: string | null
          difficulty?: string | null
          game_data?: Json | null
          game_type?: string | null
          id?: string | null
          published?: boolean | null
          published_at?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          city_name?: string | null
          created_at?: string | null
          difficulty?: string | null
          game_data?: Json | null
          game_type?: string | null
          id?: string | null
          published?: boolean | null
          published_at?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      public_neighborhoods: {
        Row: {
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "public_cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_create_city: {
        Args: {
          country: string
          domain: string
          incorporated_year: number
          latitude: number
          longitude: number
          metadata?: Json
          name: string
          population: number
          slug: string
          state_province: string
          status: string
        }
        Returns: string
      }
      admin_delete_city: {
        Args: { city_id: string; metadata?: Json }
        Returns: undefined
      }
      admin_freeze_story: {
        Args: { story_id: string }
        Returns: undefined
      }
      admin_freeze_city: {
        Args: { city_id: string; metadata?: Json }
        Returns: undefined
      }
      admin_get_contributor_actions: {
        Args: { _contributor_id: string }
        Returns: {
          action: string
          created_at: string
          id: string
          metadata: Json
        }[]
      }
      admin_get_contributor_stories: {
        Args: { _contributor_id: string }
        Returns: {
          id: string
          is_frozen: boolean
          is_published: boolean
          published_at: string
          title: string
        }[]
      }
      admin_get_contributors: {
        Args: never
        Returns: {
          city: string
          display_name: string
          fraud_level: string
          fraud_score: number
          id: string
          locked: boolean
        }[]
      }
      admin_get_stories:
        | {
            Args: never
            Returns: {
              author_name: string
              category: string
              city: string
              created_at: string
              id: string
              is_frozen: boolean
              is_published: boolean
              primary_city_id: string
              title: string
            }[]
          }
        | {
            Args: { city_uuid: string }
            Returns: {
              id: string | null
              is_frozen: boolean | null
              is_published: boolean | null
              primary_city_id: string | null
              title: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "civic_stories_admin"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      admin_get_story_details: {
        Args: { story_id: string }
        Returns: {
          author_name: string
          body: string
          category: string
          city: string
          created_at: string
          date_range: string
          id: string
          image_description: string
          is_frozen: boolean
          is_published: boolean
          neighborhood: string
          primary_city_id: string
          related_entity_ids: string[]
          related_moment_ids: string[]
          related_place_ids: string[]
          summary: string
          tags: string[]
          title: string
          updated_at: string
          year: number
        }[]
      }
      admin_hide_city: {
        Args: { city_id: string; metadata?: Json }
        Returns: undefined
      }
      admin_get_user_contact_info: {
        Args: { justification: string; target_user_id: string }
        Returns: {
          access_timestamp: string
          display_name: string
          email: string
          user_id: string
        }[]
      }
      admin_get_user_overview: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          games_played: number
          has_email: boolean
          last_activity: string
          total_score: number
          user_id: string
        }[]
      }
      admin_get_user_stats: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          games_played: number
          last_game_date: string
          total_score: number
          user_id: string
        }[]
      }
      admin_hide_story: {
        Args: { story_id: string }
        Returns: undefined
      }
      admin_lock_contributor: {
        Args: { city_id: string; contributor_id: string }
        Returns: undefined
      }
      admin_republish_story: {
        Args: { story_id: string }
        Returns: undefined
      }
      admin_republish_city: {
        Args: { city_id: string; metadata?: Json }
        Returns: undefined
      }
      admin_set_fraud_level: {
        Args: { city_id: string; contributor_id: string; fraud_level: string }
        Returns: undefined
      }
      admin_set_fraud_score: {
        Args: { city_id: string; contributor_id: string; fraud_score: number }
        Returns: undefined
      }
      admin_unfreeze_story: {
        Args: { story_id: string }
        Returns: undefined
      }
      admin_unfreeze_city: {
        Args: { city_id: string; metadata?: Json }
        Returns: undefined
      }
      admin_unlock_contributor: {
        Args: { city_id: string; contributor_id: string }
        Returns: undefined
      }
      admin_update_city: {
        Args: {
          city_id: string
          country: string
          domain: string
          incorporated_year: number
          latitude: number
          longitude: number
          metadata?: Json
          name: string
          population: number
          slug: string
          state_province: string
          status: string
        }
        Returns: undefined
      }
      admin_update_contributor_status: {
        Args: { action: string; contributor_id: string; metadata: Json }
        Returns: undefined
      }
      admin_update_story_status: {
        Args: { action: string; metadata: Json; story_id: string }
        Returns: undefined
      }
      admin_update_user: {
        Args: {
          p_city_ids: string[]
          p_primary_city_slug: string
          p_role: string
          p_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      append_slideshow_asset: {
        Args: { asset_id_input: string; city_id_input: string }
        Returns: undefined
      }
      apply_sponsor_credit: {
        Args: { production_unit_id: string }
        Returns: undefined
      }
      assemble_payout_batch: {
        Args: { admin_id: string; city_id: string }
        Returns: string
      }
      audit_admin_email_access: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      audit_email_exposure: { Args: never; Returns: string }
      authorize_payout_batch: {
        Args: { batch_id: string; ceo_id: string }
        Returns: undefined
      }
      award_badge: {
        Args: {
          badge_description_param?: string
          badge_name_param: string
          badge_type_param: string
          icon_name_param?: string
          metadata_param?: Json
          target_user_id: string
        }
        Returns: boolean
      }
      award_points: {
        Args: { p_campaign_id: string; p_game_id: string; p_user_id: string }
        Returns: {
          new_balance: number
        }[]
      }
      can_delete_civic_item: {
        Args: { item_id: string; item_type: string }
        Returns: boolean
      }
      check_and_award_game_badges: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          action_type_param: string
          max_attempts?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      civic_item_exists: {
        Args: { item_id: string; item_type: string }
        Returns: boolean
      }
      claim_quiz_ownership: { Args: { quiz_id: number }; Returns: boolean }
      claim_section_ownership: {
        Args: { section_id: number }
        Returns: boolean
      }
      clean_old_ai_cache: { Args: never; Returns: undefined }
      create_demo_project_from_existing: {
        Args: { source_project_id: string }
        Returns: string
      }
      create_notification: {
        Args: {
          message_text: string
          project_id_param?: string
          target_user_id: string
          title_text: string
          type_text?: string
        }
        Returns: undefined
      }
      create_production_unit: {
        Args: { city_admin_id: string; story_id: string }
        Returns: string
      }
      debug_jwt: { Args: never; Returns: string }
      debug_jwt_raw: { Args: never; Returns: Json }
      delete_links_for_item: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      force_delete_civic_item: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      generate_coupon: {
        Args: { p_campaign_id: string; p_user_id: string }
        Returns: {
          code: string
          coupon_id: string
          description: string
          expires_at: string
        }[]
      }
      get_active_campaigns: {
        Args: { p_city_slug: string }
        Returns: {
          description: string
          ends_at: string
          game_id: string
          id: string
          name: string
          points_per_completion: number
          sponsor_name: string
          sponsor_slug: string
          starts_at: string
        }[]
      }
      get_city_score_summary: {
        Args: { p_city_slug: string }
        Returns: {
          active_campaigns: number
          active_coupons: number
          active_sponsors: number
          total_points: number
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_demo_project: {
        Args: { project_id: string }
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          created_at: string
          description: string
          domain: string
          id: string
          logo_url: string
          status: string
          store_url: string
          updated_at: string
        }[]
      }
      get_demo_project_data: {
        Args: never
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          description: string
          domain: string
          id: string
          logo_url: string
          more_content: Json
          store_url: string
        }[]
      }
      get_leaderboard: {
        Args: {
          city_filter?: string
          game_type_filter?: string
          limit_count?: number
          time_period?: string
        }
        Returns: {
          city_name: string
          created_at: string
          display_name: string
          game_type: string
          rank: number
          score: number
          time_taken: number
          user_id: string
        }[]
      }
      get_minimal_public_projects: {
        Args: never
        Returns: {
          city_name: string
          created_at: string
          description: string
          id: string
          logo_url: string
          status: string
        }[]
      }
      get_owned_project_data: {
        Args: { project_id: string }
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          description: string
          domain: string
          id: string
          knowledge_base: string
          logo_url: string
          map_data: string
          more_content: Json
          quiz_questions: string
          status: string
          store_url: string
          theme_colors: Json
        }[]
      }
      get_platform_config: { Args: { config_key: string }; Returns: string }
      get_project_preview_data: {
        Args: { project_id: string }
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          description: string
          domain: string
          id: string
          logo_url: string
          more_content: string
          store_url: string
        }[]
      }
      get_public_city_list: {
        Args: never
        Returns: {
          city_name: string
          description: string
          logo_url: string
        }[]
      }
      get_public_game_user_data: {
        Args: { target_user_id?: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          games_played: number
          total_score: number
          user_id: string
        }[]
      }
      get_recent_activity: {
        Args: { p_user_id: string }
        Returns: {
          campaign_id: string | null
          city_id: string | null
          city_slug: string
          created_at: string | null
          game_id: string | null
          id: string
          metadata: Json | null
          points: number
          source: string
          type: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "points_ledger"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_related_places: {
        Args: { target_place_id: string }
        Returns: {
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ingestion_metadata: Json | null
          ingestion_source: string | null
          is_published: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          place_type: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          year_built: number | null
          year_demolished: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "civic_places"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_related_stories: {
        Args: { target_story_id: string }
        Returns: {
          author_name: string | null
          body: string | null
          category: string | null
          city: string | null
          city_id: string | null
          contributor_id: string | null
          created_at: string | null
          cross_city_links: string[] | null
          date_range: string | null
          editor_id: string | null
          entities: string[] | null
          flag_reason: string | null
          hero_360_url: string | null
          hero_image_url: string | null
          id: string
          image_description: string | null
          inline_360_urls: string[] | null
          is_frozen: boolean | null
          is_published: boolean | null
          neighborhood: string | null
          neighborhood_360_url: string | null
          published_at: string | null
          related_entity_ids: string[] | null
          related_event_ids: string[] | null
          related_moment_ids: string[] | null
          related_place_ids: string[] | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          revision_notes: string | null
          revision_requested: boolean | null
          revision_submitted_at: string | null
          slug: string | null
          sponsor_360_url: string | null
          sponsor_alt_text: string | null
          sponsor_flat_url: string | null
          sponsor_link: string | null
          sponsor_name: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_360_url: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          year: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "civic_stories"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_safe_game_user_profile: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          games_played: number
          id: string
          total_score: number
          updated_at: string
          user_id: string
        }[]
      }
      get_safe_game_users_data: {
        Args: { target_user_id?: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          games_played: number
          id: string
          total_score: number
          updated_at: string
          user_id: string
        }[]
      }
      get_safe_leaderboard_data: {
        Args: {
          city_filter?: string
          game_type_filter?: string
          limit_count?: number
          time_period?: string
        }
        Returns: {
          city_name: string
          created_at: string
          display_name: string
          game_type: string
          rank: number
          score: number
          time_taken: number
          user_id: string
        }[]
      }
      get_safe_project_preview: {
        Args: { project_id: string }
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          description: string
          domain: string
          id: string
          logo_url: string
          store_url: string
        }[]
      }
      get_safe_public_project_info: {
        Args: { project_id: string }
        Returns: {
          city_name: string
          description: string
          id: string
          logo_url: string
          status: string
        }[]
      }
      get_safe_public_projects: {
        Args: never
        Returns: {
          city_name: string
          created_at: string
          description: string
          domain: string
          id: string
          logo_url: string
          status: string
        }[]
      }
      get_safe_site_sections: {
        Args: { domain_filter?: string }
        Returns: {
          display_label: string
          enabled: boolean
          id: number
          section_group: string
          section_name: string
          settings_json: Json
          site_domain: string
          sort_order: number
          updated_at: string
        }[]
      }
      get_secure_city_data_by_domain: {
        Args: { domain_param: string }
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          description: string
          domain: string
          id: string
          logo_url: string
          map_data: string
          theme_colors: Json
        }[]
      }
      get_secure_city_page_data: {
        Args: { domain_or_city: string }
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          description: string
          domain: string
          id: string
          logo_url: string
          theme_colors: Json
        }[]
      }
      get_secure_demo_project_data: {
        Args: { project_id: string }
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          description: string
          domain: string
          id: string
          logo_url: string
          status: string
          store_url: string
          theme_colors: Json
        }[]
      }
      get_secure_public_projects: {
        Args: never
        Returns: {
          city_name: string
          created_at: string
          description: string
          domain: string
          id: string
          logo_url: string
          status: string
        }[]
      }
      get_sponsor_tiles: {
        Args: { p_city_slug: string }
        Returns: {
          active_campaigns: number
          logo_url: string
          sponsor_id: string
          sponsor_name: string
          sponsor_slug: string
        }[]
      }
      get_ultra_safe_leaderboard: {
        Args: {
          city_filter?: string
          game_type_filter?: string
          limit_count?: number
          time_period?: string
        }
        Returns: {
          city_name: string
          created_at: string
          display_name: string
          game_type: string
          rank: number
          score: number
          time_taken: number
          user_id: string
        }[]
      }
      get_ultra_secure_leaderboard: {
        Args: {
          city_filter?: string
          game_type_filter?: string
          limit_count?: number
          time_period?: string
        }
        Returns: {
          city_name: string
          created_at: string
          display_name: string
          game_type: string
          rank: number
          score: number
          time_taken: number
          user_id: string
        }[]
      }
      get_user_best_scores: {
        Args: { target_user_id: string }
        Returns: {
          best_score: number
          best_time: number
          city_name: string
          completed_plays: number
          game_type: string
          total_plays: number
        }[]
      }
      get_user_email_for_admin: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_points: { Args: { p_user_id: string }; Returns: number }
      get_user_score_overview: {
        Args: { p_city_slug: string; p_user_id: string }
        Returns: Json
      }
      has_city_role: {
        Args: { city: string; role_name: string }
        Returns: boolean
      }
      has_project_access: {
        Args: { project_id_param: string; user_id_param: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { role_name: string }; Returns: boolean }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_valid_civic_type: { Args: { t: string }; Returns: boolean }
      is_valid_relationship: { Args: { label: string }; Returns: boolean }
      jwt_custom_claims: { Args: never; Returns: Json }
      link_artifact_to_entity: {
        Args: { artifact_id: string; entity_id: string; relationship?: string }
        Returns: string
      }
      link_artifact_to_event: {
        Args: { artifact_id: string; event_id: string; relationship?: string }
        Returns: string
      }
      link_artifact_to_place: {
        Args: { artifact_id: string; place_id: string; relationship?: string }
        Returns: string
      }
      link_civic_items: {
        Args: {
          relationship?: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Returns: string
      }
      link_entity_to_artifact: {
        Args: { artifact_id: string; entity_id: string; relationship?: string }
        Returns: string
      }
      link_entity_to_event: {
        Args: { entity_id: string; event_id: string; relationship?: string }
        Returns: string
      }
      link_entity_to_place: {
        Args: { entity_id: string; place_id: string; relationship?: string }
        Returns: string
      }
      link_event_to_place: {
        Args: { event_id: string; place_id: string; relationship?: string }
        Returns: string
      }
      link_item_to_era: {
        Args: {
          era_id: string
          relationship?: string
          source_id: string
          source_type: string
        }
        Returns: string
      }
      list_demo_projects: {
        Args: never
        Returns: {
          background_image_urls: string[]
          chatbot_name: string
          city_name: string
          created_at: string
          description: string
          domain: string
          id: string
          logo_url: string
          status: string
          store_url: string
          updated_at: string
        }[]
      }
      log_activity: {
        Args: {
          action_text: string
          details_param?: Json
          project_id_param?: string
          target_id_text: string
          target_type_text: string
        }
        Returns: undefined
      }
      log_admin_action:
        | {
            Args: {
              action: string
              metadata?: Json
              new_role?: string
              old_role?: string
              target_user_id?: string
              user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              action: string
              actor_admin_id: string
              actor_role: string
              actor_user_id: string
              domain: string
              entity_id?: string
              entity_type?: string
              ip_address?: unknown
              metadata?: Json
              target_user_id?: string
              user_agent?: string
            }
            Returns: undefined
          }
      log_sensitive_operation: {
        Args: {
          additional_details?: Json
          operation_type: string
          target_resource: string
        }
        Returns: undefined
      }
      mark_batch_paid: { Args: { batch_id: string }; Returns: undefined }
      mark_payout_item_paid: { Args: { item_id: string }; Returns: undefined }
      normalize_slug: { Args: { in_slug: string }; Returns: string }
      publish_civic_item: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      publish_item_and_links: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      publish_links_for_item: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      publish_scheduled_posts: { Args: never; Returns: undefined }
      publish_story: {
        Args: { city_admin_id: string; story_id: string }
        Returns: undefined
      }
      recalculate_city_budget: { Args: { city_id: string }; Returns: undefined }
      redeem_points: {
        Args: { p_city_slug: string; p_points: number; p_user_id: string }
        Returns: {
          new_balance: number
        }[]
      }
      remove_slideshow_asset: {
        Args: { asset_id_input: string; city_id_input: string }
        Returns: undefined
      }
      revoke_admin_email_access: {
        Args: { admin_user_id: string }
        Returns: undefined
      }
      rpc_apply_suggestion: {
        Args: { suggestion_id: string }
        Returns: undefined
      }
      rpc_ingest_raw: {
        Args: { payload: Json; source_name: string; source_object_id: string }
        Returns: string
      }
      rpc_mark_ingestion_processed: {
        Args: { raw_id: string }
        Returns: undefined
      }
      rpc_normalize_object: { Args: { raw_id: string }; Returns: undefined }
      safe_delete_artifact: { Args: { artifact_id: string }; Returns: boolean }
      safe_delete_civic_item: {
        Args: { item_id: string; item_type: string }
        Returns: boolean
      }
      safe_delete_entity: { Args: { entity_id: string }; Returns: boolean }
      safe_delete_event: { Args: { event_id: string }; Returns: boolean }
      safe_delete_place: { Args: { place_id: string }; Returns: boolean }
      schema_overview: {
        Args: never
        Returns: {
          column_name: string
          data_type: string
          table_name: string
        }[]
      }
      track_ad_click: {
        Args: { placement_id: string; post_id_param?: number }
        Returns: undefined
      }
      track_ad_impression: {
        Args: { placement_id: string; post_id_param?: number }
        Returns: undefined
      }
      unpublish_civic_item: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      unpublish_item_and_links: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      unpublish_links_for_item: {
        Args: { item_id: string; item_type: string }
        Returns: undefined
      }
      validate_civic_link: {
        Args: {
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Returns: boolean
      }
      validate_full_civic_link: {
        Args: {
          relationship: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }
        Returns: boolean
      }
      verify_email_protection: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator" | "blog"
      media_asset_type:
        | "logo"
        | "hero"
        | "slideshow"
        | "place_hero"
        | "place_gallery"
      public_launch_mode_enum: "private" | "soft_launch" | "public"
      temporal_type:
        | "founded"
        | "incorporated"
        | "reincorporated"
        | "chartered"
        | "capitalized"
        | "municipalized"
        | "annexed"
        | "merged"
        | "separated"
        | "reestablished"
        | "archaeological_emergence"
        | "proto_urban"
        | "urban_peak"
        | "mythic_founding"
        | "dynastic_establishment"
        | "imperial_reorganization"
        | "destroyed"
        | "abandoned"
        | "final_civic_phase"
        | "dissolved"
        | "absorbed"
        | "colonial_founding"
        | "colonial_charter"
        | "postcolonial_recharter"
        | "protectorate_establishment"
        | "renamed"
        | "religious_founding"
        | "trade_post_establishment"
        | "fort_establishment"
        | "industrial_establishment"
        | "planned_city_establishment"
        | "other"
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
      app_role: ["admin", "user", "moderator", "blog"],
      media_asset_type: [
        "logo",
        "hero",
        "slideshow",
        "place_hero",
        "place_gallery",
      ],
      public_launch_mode_enum: ["private", "soft_launch", "public"],
      temporal_type: [
        "founded",
        "incorporated",
        "reincorporated",
        "chartered",
        "capitalized",
        "municipalized",
        "annexed",
        "merged",
        "separated",
        "reestablished",
        "archaeological_emergence",
        "proto_urban",
        "urban_peak",
        "mythic_founding",
        "dynastic_establishment",
        "imperial_reorganization",
        "destroyed",
        "abandoned",
        "final_civic_phase",
        "dissolved",
        "absorbed",
        "colonial_founding",
        "colonial_charter",
        "postcolonial_recharter",
        "protectorate_establishment",
        "renamed",
        "religious_founding",
        "trade_post_establishment",
        "fort_establishment",
        "industrial_establishment",
        "planned_city_establishment",
        "other",
      ],
    },
  },
} as const
