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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activity_sessions: {
        Row: {
          activity_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          qr_code_url: string
          workshop_session_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_url: string
          workshop_session_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_url?: string
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_sessions_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      adoption_momentum: {
        Row: {
          company_identifier_hash: string
          company_size: string | null
          created_at: string | null
          days_between_first_last: number | null
          first_assessment_date: string | null
          id: string
          industry: string | null
          latest_assessment_date: string | null
          metadata: Json | null
          momentum_score: number | null
          momentum_tier: Database["public"]["Enums"]["momentum_tier"] | null
          recency_decay: number | null
          referral_quality_score: number | null
          referred_companies: number | null
          repeat_rate_capped: number | null
          team_growth_sqrt: number | null
          total_advisory_sprints: number | null
          total_assessments: number | null
          total_unique_users: number | null
          total_workshop_bookings: number | null
          updated_at: string | null
          verified_referrals: number | null
        }
        Insert: {
          company_identifier_hash: string
          company_size?: string | null
          created_at?: string | null
          days_between_first_last?: number | null
          first_assessment_date?: string | null
          id?: string
          industry?: string | null
          latest_assessment_date?: string | null
          metadata?: Json | null
          momentum_score?: number | null
          momentum_tier?: Database["public"]["Enums"]["momentum_tier"] | null
          recency_decay?: number | null
          referral_quality_score?: number | null
          referred_companies?: number | null
          repeat_rate_capped?: number | null
          team_growth_sqrt?: number | null
          total_advisory_sprints?: number | null
          total_assessments?: number | null
          total_unique_users?: number | null
          total_workshop_bookings?: number | null
          updated_at?: string | null
          verified_referrals?: number | null
        }
        Update: {
          company_identifier_hash?: string
          company_size?: string | null
          created_at?: string | null
          days_between_first_last?: number | null
          first_assessment_date?: string | null
          id?: string
          industry?: string | null
          latest_assessment_date?: string | null
          metadata?: Json | null
          momentum_score?: number | null
          momentum_tier?: Database["public"]["Enums"]["momentum_tier"] | null
          recency_decay?: number | null
          referral_quality_score?: number | null
          referred_companies?: number | null
          repeat_rate_capped?: number | null
          team_growth_sqrt?: number | null
          total_advisory_sprints?: number | null
          total_assessments?: number | null
          total_unique_users?: number | null
          total_workshop_bookings?: number | null
          updated_at?: string | null
          verified_referrals?: number | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          business_context: Json | null
          created_at: string
          id: string
          insights_generated: string[] | null
          question: string
          response: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_context?: Json | null
          created_at?: string
          id?: string
          insights_generated?: string[] | null
          question: string
          response: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_context?: Json | null
          created_at?: string
          id?: string
          insights_generated?: string[] | null
          question?: string
          response?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_insights_generated: {
        Row: {
          business_context: Json | null
          created_at: string
          id: string
          insight_content: string
          insight_type: string
          relevance_score: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          business_context?: Json | null
          created_at?: string
          id?: string
          insight_content: string
          insight_type: string
          relevance_score?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          business_context?: Json | null
          created_at?: string
          id?: string
          insight_content?: string
          insight_type?: string
          relevance_score?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_generated_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_leadership_index_snapshots: {
        Row: {
          avg_readiness_score: number | null
          avg_readiness_score_ci_lower: number | null
          avg_readiness_score_ci_upper: number | null
          company_size_benchmarks: Json | null
          consent_rate: number | null
          created_at: string | null
          dimension_benchmarks: Json | null
          effective_sample_size: number | null
          id: string
          industry_benchmarks: Json | null
          median_readiness_score: number | null
          metadata: Json | null
          methodology_version: string | null
          published_at: string | null
          qoq_change: number | null
          qoq_change_significant: boolean | null
          quarter: string
          role_benchmarks: Json | null
          tier_advancing_pct: number | null
          tier_emerging_pct: number | null
          tier_establishing_pct: number | null
          tier_leading_pct: number | null
          total_assessments: number | null
        }
        Insert: {
          avg_readiness_score?: number | null
          avg_readiness_score_ci_lower?: number | null
          avg_readiness_score_ci_upper?: number | null
          company_size_benchmarks?: Json | null
          consent_rate?: number | null
          created_at?: string | null
          dimension_benchmarks?: Json | null
          effective_sample_size?: number | null
          id?: string
          industry_benchmarks?: Json | null
          median_readiness_score?: number | null
          metadata?: Json | null
          methodology_version?: string | null
          published_at?: string | null
          qoq_change?: number | null
          qoq_change_significant?: boolean | null
          quarter: string
          role_benchmarks?: Json | null
          tier_advancing_pct?: number | null
          tier_emerging_pct?: number | null
          tier_establishing_pct?: number | null
          tier_leading_pct?: number | null
          total_assessments?: number | null
        }
        Update: {
          avg_readiness_score?: number | null
          avg_readiness_score_ci_lower?: number | null
          avg_readiness_score_ci_upper?: number | null
          company_size_benchmarks?: Json | null
          consent_rate?: number | null
          created_at?: string | null
          dimension_benchmarks?: Json | null
          effective_sample_size?: number | null
          id?: string
          industry_benchmarks?: Json | null
          median_readiness_score?: number | null
          metadata?: Json | null
          methodology_version?: string | null
          published_at?: string | null
          qoq_change?: number | null
          qoq_change_significant?: boolean | null
          quarter?: string
          role_benchmarks?: Json | null
          tier_advancing_pct?: number | null
          tier_emerging_pct?: number | null
          tier_establishing_pct?: number | null
          tier_leading_pct?: number | null
          total_assessments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_leadership_index_snapshots_methodology_version_fkey"
            columns: ["methodology_version"]
            isOneToOne: false
            referencedRelation: "index_publication_rules"
            referencedColumns: ["version"]
          },
        ]
      }
      ai_literacy_modules: {
        Row: {
          category: string
          challenges: string[]
          created_at: string | null
          credits: number
          description: string
          icon: string
          id: string
          learning_styles: string[]
          prerequisites: string[] | null
          target_audience: string[]
          team_sizes: string[]
          tier: string
          title: string
          updated_at: string | null
          urgency: string[]
        }
        Insert: {
          category: string
          challenges?: string[]
          created_at?: string | null
          credits: number
          description: string
          icon: string
          id: string
          learning_styles?: string[]
          prerequisites?: string[] | null
          target_audience?: string[]
          team_sizes?: string[]
          tier: string
          title: string
          updated_at?: string | null
          urgency?: string[]
        }
        Update: {
          category?: string
          challenges?: string[]
          created_at?: string | null
          credits?: number
          description?: string
          icon?: string
          id?: string
          learning_styles?: string[]
          prerequisites?: string[] | null
          target_audience?: string[]
          team_sizes?: string[]
          tier?: string
          title?: string
          updated_at?: string | null
          urgency?: string[]
        }
        Relationships: []
      }
      assessment_behavioral_adjustments: {
        Row: {
          adjustment_rationale: Json | null
          assessment_id: string | null
          created_at: string | null
          delegation_weight: number | null
          experimentation_weight: number | null
          id: string
          raw_inputs: Json | null
          stakeholder_complexity: number | null
          time_optimization: number | null
        }
        Insert: {
          adjustment_rationale?: Json | null
          assessment_id?: string | null
          created_at?: string | null
          delegation_weight?: number | null
          experimentation_weight?: number | null
          id?: string
          raw_inputs?: Json | null
          stakeholder_complexity?: number | null
          time_optimization?: number | null
        }
        Update: {
          adjustment_rationale?: Json | null
          assessment_id?: string | null
          created_at?: string | null
          delegation_weight?: number | null
          experimentation_weight?: number | null
          id?: string
          raw_inputs?: Json | null
          stakeholder_complexity?: number | null
          time_optimization?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_behavioral_adjustments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_events: {
        Row: {
          assessment_id: string | null
          context_snapshot: Json | null
          created_at: string | null
          dimension_key: string | null
          event_type: string
          flow_name: string | null
          id: string
          profile_id: string | null
          question_id: string | null
          question_text: string
          raw_input: string
          response_duration_seconds: number | null
          session_id: string | null
          structured_values: Json | null
          tool_name: string
        }
        Insert: {
          assessment_id?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          dimension_key?: string | null
          event_type: string
          flow_name?: string | null
          id?: string
          profile_id?: string | null
          question_id?: string | null
          question_text: string
          raw_input: string
          response_duration_seconds?: number | null
          session_id?: string | null
          structured_values?: Json | null
          tool_name: string
        }
        Update: {
          assessment_id?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          dimension_key?: string | null
          event_type?: string
          flow_name?: string | null
          id?: string
          profile_id?: string | null
          question_id?: string | null
          question_text?: string
          raw_input?: string
          response_duration_seconds?: number | null
          session_id?: string | null
          structured_values?: Json | null
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          active: boolean | null
          created_at: string | null
          dimension_key: string
          display_order: number | null
          id: string
          options: Json | null
          question_key: string
          question_text: string
          question_type: string | null
          reverse_scored: boolean | null
          tool_name: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          dimension_key: string
          display_order?: number | null
          id?: string
          options?: Json | null
          question_key: string
          question_text: string
          question_type?: string | null
          reverse_scored?: boolean | null
          tool_name: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          dimension_key?: string
          display_order?: number | null
          id?: string
          options?: Json | null
          question_key?: string
          question_text?: string
          question_type?: string | null
          reverse_scored?: boolean | null
          tool_name?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      assessment_referrals: {
        Row: {
          converted: boolean | null
          converted_at: string | null
          created_at: string | null
          id: string
          referee_assessment_id: string | null
          referee_email: string | null
          referee_name: string | null
          referral_code: string
          referred_at: string | null
          referrer_assessment_id: string | null
          referrer_email: string
          referrer_name: string | null
        }
        Insert: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referee_assessment_id?: string | null
          referee_email?: string | null
          referee_name?: string | null
          referral_code: string
          referred_at?: string | null
          referrer_assessment_id?: string | null
          referrer_email: string
          referrer_name?: string | null
        }
        Update: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referee_assessment_id?: string | null
          referee_email?: string | null
          referee_name?: string | null
          referral_code?: string
          referred_at?: string | null
          referrer_assessment_id?: string | null
          referrer_email?: string
          referrer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_referrals_referee_assessment_id_fkey"
            columns: ["referee_assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_referrals_referrer_assessment_id_fkey"
            columns: ["referrer_assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_workshop_sessions: {
        Row: {
          bootcamp_plan_id: string | null
          cognitive_baseline_data: Json | null
          completed_at: string | null
          created_at: string | null
          current_segment: number | null
          facilitator_email: string | null
          facilitator_name: string | null
          id: string | null
          intake_id: string | null
          participant_count: number | null
          segment_timers: Json | null
          status: string | null
          updated_at: string | null
          workshop_date: string | null
          workshop_metadata: Json | null
        }
        Insert: {
          bootcamp_plan_id?: string | null
          cognitive_baseline_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_segment?: number | null
          facilitator_email?: string | null
          facilitator_name?: string | null
          id?: string | null
          intake_id?: string | null
          participant_count?: number | null
          segment_timers?: Json | null
          status?: string | null
          updated_at?: string | null
          workshop_date?: string | null
          workshop_metadata?: Json | null
        }
        Update: {
          bootcamp_plan_id?: string | null
          cognitive_baseline_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_segment?: number | null
          facilitator_email?: string | null
          facilitator_name?: string | null
          id?: string | null
          intake_id?: string | null
          participant_count?: number | null
          segment_timers?: Json | null
          status?: string | null
          updated_at?: string | null
          workshop_date?: string | null
          workshop_metadata?: Json | null
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          company_name: string | null
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          lead_score: number | null
          notes: string | null
          phone: string | null
          preferred_time: string | null
          priority: string | null
          role: string | null
          scheduled_date: string | null
          service_title: string
          service_type: string
          session_id: string | null
          specific_needs: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          lead_score?: number | null
          notes?: string | null
          phone?: string | null
          preferred_time?: string | null
          priority?: string | null
          role?: string | null
          scheduled_date?: string | null
          service_title: string
          service_type: string
          session_id?: string | null
          specific_needs?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          lead_score?: number | null
          notes?: string | null
          phone?: string | null
          preferred_time?: string | null
          priority?: string | null
          role?: string | null
          scheduled_date?: string | null
          service_title?: string
          service_type?: string
          session_id?: string | null
          specific_needs?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bootcamp_plans: {
        Row: {
          agenda_config: Json | null
          ai_experience_level: string | null
          ai_myths_concerns: Json | null
          booked_at: string | null
          calendly_booking_url: string | null
          cognitive_baseline: Json | null
          competitive_landscape: string | null
          created_at: string
          current_bottlenecks: Json | null
          data_governance_notes: string | null
          id: string
          intake_id: string | null
          pilot_expectations: Json | null
          pilot_metrics_notes: string | null
          required_prework: Json | null
          risk_tolerance: number | null
          simulation_1_id: string | null
          simulation_1_snapshot: Json | null
          simulation_2_id: string | null
          simulation_2_snapshot: Json | null
          status: string
          strategic_goals_2026: Json | null
        }
        Insert: {
          agenda_config?: Json | null
          ai_experience_level?: string | null
          ai_myths_concerns?: Json | null
          booked_at?: string | null
          calendly_booking_url?: string | null
          cognitive_baseline?: Json | null
          competitive_landscape?: string | null
          created_at?: string
          current_bottlenecks?: Json | null
          data_governance_notes?: string | null
          id?: string
          intake_id?: string | null
          pilot_expectations?: Json | null
          pilot_metrics_notes?: string | null
          required_prework?: Json | null
          risk_tolerance?: number | null
          simulation_1_id?: string | null
          simulation_1_snapshot?: Json | null
          simulation_2_id?: string | null
          simulation_2_snapshot?: Json | null
          status?: string
          strategic_goals_2026?: Json | null
        }
        Update: {
          agenda_config?: Json | null
          ai_experience_level?: string | null
          ai_myths_concerns?: Json | null
          booked_at?: string | null
          calendly_booking_url?: string | null
          cognitive_baseline?: Json | null
          competitive_landscape?: string | null
          created_at?: string
          current_bottlenecks?: Json | null
          data_governance_notes?: string | null
          id?: string
          intake_id?: string | null
          pilot_expectations?: Json | null
          pilot_metrics_notes?: string | null
          required_prework?: Json | null
          risk_tolerance?: number | null
          simulation_1_id?: string | null
          simulation_1_snapshot?: Json | null
          simulation_2_id?: string | null
          simulation_2_snapshot?: Json | null
          status?: string
          strategic_goals_2026?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bootcamp_plans_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "exec_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      bottleneck_submissions: {
        Row: {
          activity_session_id: string | null
          bottleneck_text: string
          cluster_id: string | null
          cluster_name: string | null
          created_at: string | null
          id: string
          participant_name: string
          position_x: number | null
          position_y: number | null
          profile_id: string | null
          workshop_session_id: string | null
        }
        Insert: {
          activity_session_id?: string | null
          bottleneck_text: string
          cluster_id?: string | null
          cluster_name?: string | null
          created_at?: string | null
          id?: string
          participant_name: string
          position_x?: number | null
          position_y?: number | null
          profile_id?: string | null
          workshop_session_id?: string | null
        }
        Update: {
          activity_session_id?: string | null
          bottleneck_text?: string
          cluster_id?: string | null
          cluster_name?: string | null
          created_at?: string | null
          id?: string
          participant_name?: string
          position_x?: number | null
          position_y?: number | null
          profile_id?: string | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bottleneck_submissions_activity_session_id_fkey"
            columns: ["activity_session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bottleneck_submissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bottleneck_submissions_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          assessment_id: string | null
          content: string
          created_at: string
          id: string
          insights: Json | null
          message_type: string
          metadata: Json | null
          role: string | null
          session_id: string | null
          tool_context: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          content: string
          created_at?: string
          id?: string
          insights?: Json | null
          message_type: string
          metadata?: Json | null
          role?: string | null
          session_id?: string | null
          tool_context?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          content?: string
          created_at?: string
          id?: string
          insights?: Json | null
          message_type?: string
          metadata?: Json | null
          role?: string | null
          session_id?: string | null
          tool_context?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_identifier_salt: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          rotated_at: string | null
          salt_value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rotated_at?: string | null
          salt_value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rotated_at?: string | null
          salt_value?: string
        }
        Relationships: []
      }
      consent_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          consent_purpose: Database["public"]["Enums"]["consent_purpose"]
          id: string
          ip_address: unknown
          new_value: boolean
          participant_id: string | null
          previous_value: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          consent_purpose: Database["public"]["Enums"]["consent_purpose"]
          id?: string
          ip_address?: unknown
          new_value: boolean
          participant_id?: string | null
          previous_value?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          consent_purpose?: Database["public"]["Enums"]["consent_purpose"]
          id?: string
          ip_address?: unknown
          new_value?: boolean
          participant_id?: string | null
          previous_value?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_audit_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "index_participant_data"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          business_context: Json | null
          completed_at: string | null
          id: string
          last_activity: string
          lead_qualification_score: number | null
          session_summary: string | null
          session_title: string | null
          started_at: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          business_context?: Json | null
          completed_at?: string | null
          id?: string
          last_activity?: string
          lead_qualification_score?: number | null
          session_summary?: string | null
          session_title?: string | null
          started_at?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          business_context?: Json | null
          completed_at?: string | null
          id?: string
          last_activity?: string
          lead_qualification_score?: number | null
          session_summary?: string | null
          session_title?: string | null
          started_at?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversion_analytics: {
        Row: {
          conversion_metadata: Json | null
          conversion_type: string
          conversion_value: number | null
          created_at: string
          id: string
          insights_generated: number | null
          lead_score: number | null
          messages_exchanged: number | null
          service_type: string | null
          session_duration: number | null
          session_id: string | null
          source_channel: string | null
          topics_explored: number | null
          user_id: string | null
        }
        Insert: {
          conversion_metadata?: Json | null
          conversion_type: string
          conversion_value?: number | null
          created_at?: string
          id?: string
          insights_generated?: number | null
          lead_score?: number | null
          messages_exchanged?: number | null
          service_type?: string | null
          session_duration?: number | null
          session_id?: string | null
          source_channel?: string | null
          topics_explored?: number | null
          user_id?: string | null
        }
        Update: {
          conversion_metadata?: Json | null
          conversion_type?: string
          conversion_value?: number | null
          created_at?: string
          id?: string
          insights_generated?: number | null
          lead_score?: number | null
          messages_exchanged?: number | null
          service_type?: string | null
          session_duration?: number | null
          session_id?: string | null
          source_channel?: string | null
          topics_explored?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_frameworks: {
        Row: {
          created_at: string | null
          decision_criteria: Json | null
          decision_process: string | null
          decision_style_observed: string | null
          id: string
          key_concepts: Json | null
          major_tensions: string[] | null
          next_steps: string[] | null
          sample_artifacts: Json | null
          tension_map: Json | null
          time_to_alignment_minutes: number | null
          unresolved_disagreements: string[] | null
          updated_at: string | null
          workshop_session_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision_criteria?: Json | null
          decision_process?: string | null
          decision_style_observed?: string | null
          id?: string
          key_concepts?: Json | null
          major_tensions?: string[] | null
          next_steps?: string[] | null
          sample_artifacts?: Json | null
          tension_map?: Json | null
          time_to_alignment_minutes?: number | null
          unresolved_disagreements?: string[] | null
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision_criteria?: Json | null
          decision_process?: string | null
          decision_style_observed?: string | null
          id?: string
          key_concepts?: Json | null
          major_tensions?: string[] | null
          next_steps?: string[] | null
          sample_artifacts?: Json | null
          tension_map?: Json | null
          time_to_alignment_minutes?: number | null
          unresolved_disagreements?: string[] | null
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_frameworks_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      effortless_map_items: {
        Row: {
          activity_session_id: string | null
          constraint_inverted: boolean | null
          created_at: string | null
          id: string
          item_text: string
          lane: string
          participant_name: string
          priority_rank: number | null
          profile_id: string | null
          sponsor_name: string | null
          vote_count: number | null
          workshop_session_id: string | null
        }
        Insert: {
          activity_session_id?: string | null
          constraint_inverted?: boolean | null
          created_at?: string | null
          id?: string
          item_text: string
          lane: string
          participant_name: string
          priority_rank?: number | null
          profile_id?: string | null
          sponsor_name?: string | null
          vote_count?: number | null
          workshop_session_id?: string | null
        }
        Update: {
          activity_session_id?: string | null
          constraint_inverted?: boolean | null
          created_at?: string | null
          id?: string
          item_text?: string
          lane?: string
          participant_name?: string
          priority_rank?: number | null
          profile_id?: string | null
          sponsor_name?: string | null
          vote_count?: number | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "effortless_map_items_activity_session_id_fkey"
            columns: ["activity_session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "effortless_map_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "effortless_map_items_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_analytics: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exec_intakes: {
        Row: {
          anticipated_bottlenecks: Json | null
          board_pack_url: string | null
          company_name: string
          created_at: string
          current_ai_initiatives: string | null
          decision_type: string | null
          id: string
          industry: string | null
          organizer_email: string
          organizer_name: string
          participants: Json | null
          preferred_dates: Json | null
          scheduling_notes: string | null
          strategic_context_complete: boolean | null
          strategic_objectives_2026: string | null
          target_2026: string | null
          updated_at: string
          workflow_bottlenecks: string | null
        }
        Insert: {
          anticipated_bottlenecks?: Json | null
          board_pack_url?: string | null
          company_name: string
          created_at?: string
          current_ai_initiatives?: string | null
          decision_type?: string | null
          id?: string
          industry?: string | null
          organizer_email: string
          organizer_name: string
          participants?: Json | null
          preferred_dates?: Json | null
          scheduling_notes?: string | null
          strategic_context_complete?: boolean | null
          strategic_objectives_2026?: string | null
          target_2026?: string | null
          updated_at?: string
          workflow_bottlenecks?: string | null
        }
        Update: {
          anticipated_bottlenecks?: Json | null
          board_pack_url?: string | null
          company_name?: string
          created_at?: string
          current_ai_initiatives?: string | null
          decision_type?: string | null
          id?: string
          industry?: string | null
          organizer_email?: string
          organizer_name?: string
          participants?: Json | null
          preferred_dates?: Json | null
          scheduling_notes?: string | null
          strategic_context_complete?: boolean | null
          strategic_objectives_2026?: string | null
          target_2026?: string | null
          updated_at?: string
          workflow_bottlenecks?: string | null
        }
        Relationships: []
      }
      exec_pulses: {
        Row: {
          application_score: number | null
          awareness_score: number | null
          completed_at: string | null
          created_at: string
          governance_score: number | null
          id: string
          intake_id: string | null
          participant_email: string
          participant_name: string
          participant_role: string
          profile_id: string | null
          pulse_responses: Json | null
          trust_score: number | null
        }
        Insert: {
          application_score?: number | null
          awareness_score?: number | null
          completed_at?: string | null
          created_at?: string
          governance_score?: number | null
          id?: string
          intake_id?: string | null
          participant_email: string
          participant_name: string
          participant_role: string
          profile_id?: string | null
          pulse_responses?: Json | null
          trust_score?: number | null
        }
        Update: {
          application_score?: number | null
          awareness_score?: number | null
          completed_at?: string | null
          created_at?: string
          governance_score?: number | null
          id?: string
          intake_id?: string | null
          participant_email?: string
          participant_name?: string
          participant_role?: string
          profile_id?: string | null
          pulse_responses?: Json | null
          trust_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exec_pulses_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "exec_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exec_pulses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sheets_sync_log: {
        Row: {
          created_at: string
          data_count: number | null
          error_message: string | null
          id: string
          last_updated_at: string | null
          lead_id: string | null
          sheet_row_id: string | null
          status: string
          sync_data: Json | null
          sync_metadata: Json | null
          sync_type: string
          synced_at: string | null
        }
        Insert: {
          created_at?: string
          data_count?: number | null
          error_message?: string | null
          id?: string
          last_updated_at?: string | null
          lead_id?: string | null
          sheet_row_id?: string | null
          status?: string
          sync_data?: Json | null
          sync_metadata?: Json | null
          sync_type: string
          synced_at?: string | null
        }
        Update: {
          created_at?: string
          data_count?: number | null
          error_message?: string | null
          id?: string
          last_updated_at?: string | null
          lead_id?: string | null
          sheet_row_id?: string | null
          status?: string
          sync_data?: Json | null
          sync_metadata?: Json | null
          sync_type?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      huddle_synthesis: {
        Row: {
          created_at: string | null
          id: string
          key_themes: Json | null
          priority_actions: Json | null
          synthesis_text: string
          updated_at: string | null
          workshop_session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_themes?: Json | null
          priority_actions?: Json | null
          synthesis_text: string
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_themes?: Json | null
          priority_actions?: Json | null
          synthesis_text?: string
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "huddle_synthesis_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: true
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      index_participant_data: {
        Row: {
          ai_learning_style: string | null
          assessment_type: string | null
          company_identifier_hash: string | null
          company_size: string | null
          completed_at: string
          confidence_weight: number | null
          consent_flags: Json | null
          consent_updated_at: string | null
          created_at: string | null
          deep_profile_data: Json | null
          delegation_tasks_count: number | null
          dimension_scores: Json | null
          effective_sample_contribution: number | null
          id: string
          industry: string | null
          primary_bottleneck: string | null
          readiness_score: number | null
          role_title: string | null
          session_id: string | null
          stakeholder_count: number | null
          tier: string | null
          time_waste_pct: number | null
          urgency_level: string | null
          user_id: string | null
        }
        Insert: {
          ai_learning_style?: string | null
          assessment_type?: string | null
          company_identifier_hash?: string | null
          company_size?: string | null
          completed_at: string
          confidence_weight?: number | null
          consent_flags?: Json | null
          consent_updated_at?: string | null
          created_at?: string | null
          deep_profile_data?: Json | null
          delegation_tasks_count?: number | null
          dimension_scores?: Json | null
          effective_sample_contribution?: number | null
          id?: string
          industry?: string | null
          primary_bottleneck?: string | null
          readiness_score?: number | null
          role_title?: string | null
          session_id?: string | null
          stakeholder_count?: number | null
          tier?: string | null
          time_waste_pct?: number | null
          urgency_level?: string | null
          user_id?: string | null
        }
        Update: {
          ai_learning_style?: string | null
          assessment_type?: string | null
          company_identifier_hash?: string | null
          company_size?: string | null
          completed_at?: string
          confidence_weight?: number | null
          consent_flags?: Json | null
          consent_updated_at?: string | null
          created_at?: string | null
          deep_profile_data?: Json | null
          delegation_tasks_count?: number | null
          dimension_scores?: Json | null
          effective_sample_contribution?: number | null
          id?: string
          industry?: string | null
          primary_bottleneck?: string | null
          readiness_score?: number | null
          role_title?: string | null
          session_id?: string | null
          stakeholder_count?: number | null
          tier?: string | null
          time_waste_pct?: number | null
          urgency_level?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "index_participant_data_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      index_publication_rules: {
        Row: {
          bootstrap_iterations: number | null
          changelog: string | null
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          methodology_url: string | null
          min_effective_sample_size: number | null
          min_segment_size: number | null
          outlier_method: string | null
          outlier_threshold: number | null
          percentile_rounding: number | null
          published_at: string | null
          version: string
        }
        Insert: {
          bootstrap_iterations?: number | null
          changelog?: string | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          methodology_url?: string | null
          min_effective_sample_size?: number | null
          min_segment_size?: number | null
          outlier_method?: string | null
          outlier_threshold?: number | null
          percentile_rounding?: number | null
          published_at?: string | null
          version: string
        }
        Update: {
          bootstrap_iterations?: number | null
          changelog?: string | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          methodology_url?: string | null
          min_effective_sample_size?: number | null
          min_segment_size?: number | null
          outlier_method?: string | null
          outlier_threshold?: number | null
          percentile_rounding?: number | null
          published_at?: string | null
          version?: string
        }
        Relationships: []
      }
      insight_dimensions: {
        Row: {
          applicable_tools: string[] | null
          created_at: string | null
          description: string | null
          key: string
          name: string
          scale_labels: Json | null
          scale_type: string
        }
        Insert: {
          applicable_tools?: string[] | null
          created_at?: string | null
          description?: string | null
          key: string
          name: string
          scale_labels?: Json | null
          scale_type: string
        }
        Update: {
          applicable_tools?: string[] | null
          created_at?: string | null
          description?: string | null
          key?: string
          name?: string
          scale_labels?: Json | null
          scale_type?: string
        }
        Relationships: []
      }
      lead_qualification_scores: {
        Row: {
          business_readiness_score: number | null
          created_at: string
          engagement_score: number | null
          id: string
          implementation_readiness: number | null
          pain_point_severity: number | null
          qualification_notes: string | null
          session_id: string | null
          total_score: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_readiness_score?: number | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          implementation_readiness?: number | null
          pain_point_severity?: number | null
          qualification_notes?: string | null
          session_id?: string | null
          total_score?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_readiness_score?: number | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          implementation_readiness?: number | null
          pain_point_severity?: number | null
          qualification_notes?: string | null
          session_id?: string | null
          total_score?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_qualification_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_qualifications: {
        Row: {
          created_at: string | null
          id: string
          indicators: Json | null
          qualification_type: string
          qualified_at: string | null
          score: number
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          indicators?: Json | null
          qualification_type: string
          qualified_at?: string | null
          score: number
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          indicators?: Json | null
          qualification_type?: string
          qualified_at?: string | null
          score?: number
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_qualifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_assessments: {
        Row: {
          benchmark_score: number | null
          benchmark_tier: string | null
          created_at: string | null
          generation_status: Json | null
          has_deep_profile: boolean | null
          has_full_diagnostic: boolean | null
          id: string
          leader_id: string
          learning_style: string | null
          session_id: string | null
          source: string
          updated_at: string | null
        }
        Insert: {
          benchmark_score?: number | null
          benchmark_tier?: string | null
          created_at?: string | null
          generation_status?: Json | null
          has_deep_profile?: boolean | null
          has_full_diagnostic?: boolean | null
          id?: string
          leader_id: string
          learning_style?: string | null
          session_id?: string | null
          source: string
          updated_at?: string | null
        }
        Update: {
          benchmark_score?: number | null
          benchmark_tier?: string | null
          created_at?: string | null
          generation_status?: Json | null
          has_deep_profile?: boolean | null
          has_full_diagnostic?: boolean | null
          id?: string
          leader_id?: string
          learning_style?: string | null
          session_id?: string | null
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leader_assessments_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_dimension_scores: {
        Row: {
          assessment_id: string
          created_at: string | null
          dimension_key: string
          dimension_tier: string | null
          explanation: string | null
          id: string
          score_numeric: number | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          dimension_key: string
          dimension_tier?: string | null
          explanation?: string | null
          id?: string
          score_numeric?: number | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          dimension_key?: string
          dimension_tier?: string | null
          explanation?: string | null
          id?: string
          score_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leader_dimension_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_first_moves: {
        Row: {
          assessment_id: string
          content: string
          created_at: string | null
          id: string
          move_number: number
        }
        Insert: {
          assessment_id: string
          content: string
          created_at?: string | null
          id?: string
          move_number: number
        }
        Update: {
          assessment_id?: string
          content?: string
          created_at?: string | null
          id?: string
          move_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "leader_first_moves_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_org_scenarios: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          priority_rank: number | null
          scenario_key: string
          summary: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          priority_rank?: number | null
          scenario_key: string
          summary: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          priority_rank?: number | null
          scenario_key?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_org_scenarios_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_prompt_sets: {
        Row: {
          assessment_id: string
          category_key: string
          created_at: string | null
          description: string | null
          how_to_use: string | null
          id: string
          priority_rank: number | null
          prompts_json: Json | null
          title: string
          what_its_for: string | null
          when_to_use: string | null
        }
        Insert: {
          assessment_id: string
          category_key: string
          created_at?: string | null
          description?: string | null
          how_to_use?: string | null
          id?: string
          priority_rank?: number | null
          prompts_json?: Json | null
          title: string
          what_its_for?: string | null
          when_to_use?: string | null
        }
        Update: {
          assessment_id?: string
          category_key?: string
          created_at?: string | null
          description?: string | null
          how_to_use?: string | null
          id?: string
          priority_rank?: number | null
          prompts_json?: Json | null
          title?: string
          what_its_for?: string | null
          when_to_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leader_prompt_sets_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_risk_signals: {
        Row: {
          assessment_id: string
          created_at: string | null
          description: string
          id: string
          level: string
          priority_rank: number | null
          risk_key: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          description: string
          id?: string
          level: string
          priority_rank?: number | null
          risk_key: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          description?: string
          id?: string
          level?: string
          priority_rank?: number | null
          risk_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_risk_signals_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_tensions: {
        Row: {
          assessment_id: string
          created_at: string | null
          dimension_key: string
          id: string
          priority_rank: number | null
          summary_line: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          dimension_key: string
          id?: string
          priority_rank?: number | null
          summary_line: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          dimension_key?: string
          id?: string
          priority_rank?: number | null
          summary_line?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_tensions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "leader_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      leaders: {
        Row: {
          company: string | null
          company_size_band: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          primary_focus: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          company_size_band?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          primary_focus?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          company_size_band?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          primary_focus?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_intakes: {
        Row: {
          consent: boolean
          created_at: string | null
          engagement_model: string | null
          firm_name: string
          id: string
          objectives_json: Json
          partner_type: string | null
          pipeline_count: number
          pipeline_names: string
          region: string | null
          resources_enablement_bandwidth: string | null
          role: string | null
          sectors_json: Json | null
          updated_at: string | null
          urgency_window: string
        }
        Insert: {
          consent?: boolean
          created_at?: string | null
          engagement_model?: string | null
          firm_name: string
          id?: string
          objectives_json?: Json
          partner_type?: string | null
          pipeline_count: number
          pipeline_names: string
          region?: string | null
          resources_enablement_bandwidth?: string | null
          role?: string | null
          sectors_json?: Json | null
          updated_at?: string | null
          urgency_window: string
        }
        Update: {
          consent?: boolean
          created_at?: string | null
          engagement_model?: string | null
          firm_name?: string
          id?: string
          objectives_json?: Json
          partner_type?: string | null
          pipeline_count?: number
          pipeline_names?: string
          region?: string | null
          resources_enablement_bandwidth?: string | null
          role?: string | null
          sectors_json?: Json | null
          updated_at?: string | null
          urgency_window?: string
        }
        Relationships: []
      }
      partner_plans: {
        Row: {
          created_at: string | null
          diagnostic_count: number
          exec_bootcamp_count: number
          firm_name: string
          id: string
          intake_id: string
          literacy_sprint_count: number
          objectives_json: Json
          pipeline_count: number
          share_slug: string
          total_companies: number
          updated_at: string | null
          urgency_window: string
        }
        Insert: {
          created_at?: string | null
          diagnostic_count?: number
          exec_bootcamp_count?: number
          firm_name: string
          id?: string
          intake_id: string
          literacy_sprint_count?: number
          objectives_json?: Json
          pipeline_count: number
          share_slug: string
          total_companies?: number
          updated_at?: string | null
          urgency_window: string
        }
        Update: {
          created_at?: string | null
          diagnostic_count?: number
          exec_bootcamp_count?: number
          firm_name?: string
          id?: string
          intake_id?: string
          literacy_sprint_count?: number
          objectives_json?: Json
          pipeline_count?: number
          share_slug?: string
          total_companies?: number
          updated_at?: string | null
          urgency_window?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_plans_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "partner_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_portfolio_items: {
        Row: {
          ai_posture: string
          created_at: string | null
          data_posture: string
          decision_cadence: string
          fit_score: number
          id: string
          intake_id: string
          name: string
          recommendation: string
          risk_flags_json: Json | null
          sector: string | null
          sponsor_strength: string
          stage: string | null
          updated_at: string | null
          value_pressure: string
          willingness_60d: string
        }
        Insert: {
          ai_posture: string
          created_at?: string | null
          data_posture: string
          decision_cadence: string
          fit_score: number
          id?: string
          intake_id: string
          name: string
          recommendation: string
          risk_flags_json?: Json | null
          sector?: string | null
          sponsor_strength: string
          stage?: string | null
          updated_at?: string | null
          value_pressure: string
          willingness_60d: string
        }
        Update: {
          ai_posture?: string
          created_at?: string | null
          data_posture?: string
          decision_cadence?: string
          fit_score?: number
          id?: string
          intake_id?: string
          name?: string
          recommendation?: string
          risk_flags_json?: Json | null
          sector?: string | null
          sponsor_strength?: string
          stage?: string | null
          updated_at?: string | null
          value_pressure?: string
          willingness_60d?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_portfolio_items_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "partner_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_charter: {
        Row: {
          budget_agreement_level: string | null
          calendar_events: Json | null
          commitment_signals: Json | null
          created_at: string | null
          executive_sponsor: string
          extend_criteria: string | null
          id: string
          kill_criteria: string | null
          kill_criteria_specificity: string | null
          meeting_cadence: string
          milestone_d10: string | null
          milestone_d30: string | null
          milestone_d60: string | null
          milestone_d90: string | null
          owner_clarity_level: string | null
          pilot_budget: number | null
          pilot_owner: string
          scale_criteria: string | null
          updated_at: string | null
          workshop_session_id: string | null
        }
        Insert: {
          budget_agreement_level?: string | null
          calendar_events?: Json | null
          commitment_signals?: Json | null
          created_at?: string | null
          executive_sponsor: string
          extend_criteria?: string | null
          id?: string
          kill_criteria?: string | null
          kill_criteria_specificity?: string | null
          meeting_cadence: string
          milestone_d10?: string | null
          milestone_d30?: string | null
          milestone_d60?: string | null
          milestone_d90?: string | null
          owner_clarity_level?: string | null
          pilot_budget?: number | null
          pilot_owner: string
          scale_criteria?: string | null
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Update: {
          budget_agreement_level?: string | null
          calendar_events?: Json | null
          commitment_signals?: Json | null
          created_at?: string | null
          executive_sponsor?: string
          extend_criteria?: string | null
          id?: string
          kill_criteria?: string | null
          kill_criteria_specificity?: string | null
          meeting_cadence?: string
          milestone_d10?: string | null
          milestone_d30?: string | null
          milestone_d60?: string | null
          milestone_d90?: string | null
          owner_clarity_level?: string | null
          pilot_budget?: number | null
          pilot_owner?: string
          scale_criteria?: string | null
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_charter_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: true
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      post_session_reviews: {
        Row: {
          ai_leadership_confidence: number
          created_at: string | null
          id: string
          optional_feedback: string | null
          participant_email: string | null
          participant_name: string
          session_enjoyment: number
          workshop_session_id: string | null
        }
        Insert: {
          ai_leadership_confidence: number
          created_at?: string | null
          id?: string
          optional_feedback?: string | null
          participant_email?: string | null
          participant_name: string
          session_enjoyment: number
          workshop_session_id?: string | null
        }
        Update: {
          ai_leadership_confidence?: number
          created_at?: string | null
          id?: string
          optional_feedback?: string | null
          participant_email?: string | null
          participant_name?: string
          session_enjoyment?: number
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_session_reviews_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_workshop_inputs: {
        Row: {
          created_at: string | null
          id: string
          intake_id: string | null
          participant_email: string
          participant_name: string
          pre_work_responses: Json | null
          profile_id: string | null
          submitted_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intake_id?: string | null
          participant_email: string
          participant_name: string
          pre_work_responses?: Json | null
          profile_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intake_id?: string | null
          participant_email?: string
          participant_name?: string
          pre_work_responses?: Json | null
          profile_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_workshop_inputs_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "exec_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_workshop_inputs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_insights: {
        Row: {
          confidence: number | null
          context_snapshot: Json | null
          contradiction_flag: boolean | null
          created_at: string | null
          dimension_key: string
          evidence: string[] | null
          expires_at: string | null
          flow_name: string | null
          generated_at: string | null
          generated_by: string
          id: string
          label: string | null
          llm_summary: string | null
          profile_id: string
          score: number | null
          source_event_ids: string[] | null
          surprise_factor: string | null
          tool_name: string
        }
        Insert: {
          confidence?: number | null
          context_snapshot?: Json | null
          contradiction_flag?: boolean | null
          created_at?: string | null
          dimension_key: string
          evidence?: string[] | null
          expires_at?: string | null
          flow_name?: string | null
          generated_at?: string | null
          generated_by: string
          id?: string
          label?: string | null
          llm_summary?: string | null
          profile_id: string
          score?: number | null
          source_event_ids?: string[] | null
          surprise_factor?: string | null
          tool_name: string
        }
        Update: {
          confidence?: number | null
          context_snapshot?: Json | null
          contradiction_flag?: boolean | null
          created_at?: string | null
          dimension_key?: string
          evidence?: string[] | null
          expires_at?: string | null
          flow_name?: string | null
          generated_at?: string | null
          generated_by?: string
          id?: string
          label?: string | null
          llm_summary?: string | null
          profile_id?: string
          score?: number | null
          source_event_ids?: string[] | null
          surprise_factor?: string | null
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_insights_dimension_key_fkey"
            columns: ["dimension_key"]
            isOneToOne: false
            referencedRelation: "insight_dimensions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profile_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      prompt_library_profiles: {
        Row: {
          bottleneck_analysis: Json
          communication_style: Json
          created_at: string | null
          executive_profile: Json
          generation_model: string | null
          generation_timestamp: string | null
          id: string
          implementation_roadmap: Json
          last_updated: string | null
          leader_id: string | null
          prompt_templates: Json
          recommended_projects: Json
          session_id: string | null
          stakeholder_map: Json
          trust_calibration: Json
          user_id: string | null
          workflow_preferences: Json
        }
        Insert: {
          bottleneck_analysis?: Json
          communication_style?: Json
          created_at?: string | null
          executive_profile?: Json
          generation_model?: string | null
          generation_timestamp?: string | null
          id?: string
          implementation_roadmap?: Json
          last_updated?: string | null
          leader_id?: string | null
          prompt_templates?: Json
          recommended_projects?: Json
          session_id?: string | null
          stakeholder_map?: Json
          trust_calibration?: Json
          user_id?: string | null
          workflow_preferences?: Json
        }
        Update: {
          bottleneck_analysis?: Json
          communication_style?: Json
          created_at?: string | null
          executive_profile?: Json
          generation_model?: string | null
          generation_timestamp?: string | null
          id?: string
          implementation_roadmap?: Json
          last_updated?: string | null
          leader_id?: string | null
          prompt_templates?: Json
          recommended_projects?: Json
          session_id?: string | null
          stakeholder_map?: Json
          trust_calibration?: Json
          user_id?: string | null
          workflow_preferences?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prompt_library_profiles_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_library_profiles_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      provocation_reports: {
        Row: {
          ai_synthesis: string | null
          created_at: string | null
          id: string
          report_data: Json
          updated_at: string | null
          workshop_session_id: string | null
        }
        Insert: {
          ai_synthesis?: string | null
          created_at?: string | null
          id?: string
          report_data: Json
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Update: {
          ai_synthesis?: string | null
          created_at?: string | null
          id?: string
          report_data?: Json
          updated_at?: string | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provocation_reports_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: true
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          referral_source: string | null
          referred_at: string | null
          referred_company_completed_assessment: boolean | null
          referred_company_first_assessment_date: string | null
          referred_company_hash: string
          referring_company_hash: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          referral_source?: string | null
          referred_at?: string | null
          referred_company_completed_assessment?: boolean | null
          referred_company_first_assessment_date?: string | null
          referred_company_hash: string
          referring_company_hash: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          referral_source?: string | null
          referred_at?: string | null
          referred_company_completed_assessment?: boolean | null
          referred_company_first_assessment_date?: string | null
          referred_company_hash?: string
          referring_company_hash?: string
        }
        Relationships: []
      }
      roi_actuals: {
        Row: {
          actual_metric_description: string | null
          actual_monthly_value: number | null
          aggregate_weight: number | null
          allow_index_aggregation: boolean | null
          baseline_value_monthly: number | null
          confidence_level: string | null
          confidence_weight: number | null
          created_at: string | null
          currency_code: string | null
          exceeded_prediction: boolean | null
          fte_count: number | null
          id: string
          normalized_monthly_per_fte: number | null
          pilot_tracker_id: string | null
          predicted_conservative_monthly: number | null
          predicted_likely_monthly: number | null
          provenance: Database["public"]["Enums"]["roi_provenance"]
          provenance_weight: number | null
          reported_at: string | null
          reported_via: string | null
          roi_variance_pct: number | null
          session_id: string | null
          unit_type: Database["public"]["Enums"]["roi_unit_type"]
          unit_value_monthly: number | null
          user_id: string | null
          window_days: number | null
        }
        Insert: {
          actual_metric_description?: string | null
          actual_monthly_value?: number | null
          aggregate_weight?: number | null
          allow_index_aggregation?: boolean | null
          baseline_value_monthly?: number | null
          confidence_level?: string | null
          confidence_weight?: number | null
          created_at?: string | null
          currency_code?: string | null
          exceeded_prediction?: boolean | null
          fte_count?: number | null
          id?: string
          normalized_monthly_per_fte?: number | null
          pilot_tracker_id?: string | null
          predicted_conservative_monthly?: number | null
          predicted_likely_monthly?: number | null
          provenance: Database["public"]["Enums"]["roi_provenance"]
          provenance_weight?: number | null
          reported_at?: string | null
          reported_via?: string | null
          roi_variance_pct?: number | null
          session_id?: string | null
          unit_type: Database["public"]["Enums"]["roi_unit_type"]
          unit_value_monthly?: number | null
          user_id?: string | null
          window_days?: number | null
        }
        Update: {
          actual_metric_description?: string | null
          actual_monthly_value?: number | null
          aggregate_weight?: number | null
          allow_index_aggregation?: boolean | null
          baseline_value_monthly?: number | null
          confidence_level?: string | null
          confidence_weight?: number | null
          created_at?: string | null
          currency_code?: string | null
          exceeded_prediction?: boolean | null
          fte_count?: number | null
          id?: string
          normalized_monthly_per_fte?: number | null
          pilot_tracker_id?: string | null
          predicted_conservative_monthly?: number | null
          predicted_likely_monthly?: number | null
          provenance?: Database["public"]["Enums"]["roi_provenance"]
          provenance_weight?: number | null
          reported_at?: string | null
          reported_via?: string | null
          roi_variance_pct?: number | null
          session_id?: string | null
          unit_type?: Database["public"]["Enums"]["roi_unit_type"]
          unit_value_monthly?: number | null
          user_id?: string | null
          window_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_actuals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      segment_summaries: {
        Row: {
          created_at: string | null
          headline: string
          id: string
          key_points: string[]
          primary_metric: number | null
          primary_metric_label: string | null
          segment_data: Json | null
          segment_key: string
          workshop_session_id: string
        }
        Insert: {
          created_at?: string | null
          headline: string
          id?: string
          key_points: string[]
          primary_metric?: number | null
          primary_metric_label?: string | null
          segment_data?: Json | null
          segment_key: string
          workshop_session_id: string
        }
        Update: {
          created_at?: string | null
          headline?: string
          id?: string
          key_points?: string[]
          primary_metric?: number | null
          primary_metric_label?: string | null
          segment_data?: Json | null
          segment_key?: string
          workshop_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_summaries_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_results: {
        Row: {
          after_snapshot: Json
          ai_outputs: Json | null
          before_snapshot: Json
          cost_savings_usd: number | null
          created_at: string | null
          disagreement_points: string[] | null
          error_rate_after_pct: number | null
          error_rate_before_pct: number | null
          guardrails: Json | null
          id: string
          is_selected: boolean | null
          org_changes_checklist: Json | null
          org_changes_required: Json | null
          output_quality_ratings: Json | null
          people_involved_after: number | null
          people_involved_before: number | null
          prompts_used: Json | null
          qualitative_changes: string | null
          quality_improvement_pct: number | null
          risks_introduced: string | null
          satisfaction_after: number | null
          satisfaction_before: number | null
          scenario_context: Json | null
          selected_discussion_options: Json | null
          simulation_id: string
          simulation_name: string
          task_breakdown: Json | null
          team_reactions: Json | null
          time_savings_pct: number | null
          vote_count: number | null
          workshop_session_id: string | null
        }
        Insert: {
          after_snapshot?: Json
          ai_outputs?: Json | null
          before_snapshot?: Json
          cost_savings_usd?: number | null
          created_at?: string | null
          disagreement_points?: string[] | null
          error_rate_after_pct?: number | null
          error_rate_before_pct?: number | null
          guardrails?: Json | null
          id?: string
          is_selected?: boolean | null
          org_changes_checklist?: Json | null
          org_changes_required?: Json | null
          output_quality_ratings?: Json | null
          people_involved_after?: number | null
          people_involved_before?: number | null
          prompts_used?: Json | null
          qualitative_changes?: string | null
          quality_improvement_pct?: number | null
          risks_introduced?: string | null
          satisfaction_after?: number | null
          satisfaction_before?: number | null
          scenario_context?: Json | null
          selected_discussion_options?: Json | null
          simulation_id: string
          simulation_name: string
          task_breakdown?: Json | null
          team_reactions?: Json | null
          time_savings_pct?: number | null
          vote_count?: number | null
          workshop_session_id?: string | null
        }
        Update: {
          after_snapshot?: Json
          ai_outputs?: Json | null
          before_snapshot?: Json
          cost_savings_usd?: number | null
          created_at?: string | null
          disagreement_points?: string[] | null
          error_rate_after_pct?: number | null
          error_rate_before_pct?: number | null
          guardrails?: Json | null
          id?: string
          is_selected?: boolean | null
          org_changes_checklist?: Json | null
          org_changes_required?: Json | null
          output_quality_ratings?: Json | null
          people_involved_after?: number | null
          people_involved_before?: number | null
          prompts_used?: Json | null
          qualitative_changes?: string | null
          quality_improvement_pct?: number | null
          risks_introduced?: string | null
          satisfaction_after?: number | null
          satisfaction_before?: number | null
          scenario_context?: Json | null
          selected_discussion_options?: Json | null
          simulation_id?: string
          simulation_name?: string
          task_breakdown?: Json | null
          team_reactions?: Json | null
          time_savings_pct?: number | null
          vote_count?: number | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_results_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_addendum: {
        Row: {
          ai_leverage_points: Json | null
          ceo_approved: boolean | null
          convergence_time_minutes: number | null
          created_at: string | null
          data_governance_changes: string | null
          governance_disagreements: string[] | null
          id: string
          org_process_changes: Json | null
          pilot_kpis: string | null
          policy_risk_checklist: Json | null
          risk_alignment_level: string | null
          sticking_points: string[] | null
          targets_at_risk: string | null
          updated_at: string | null
          working_group_inputs: Json | null
          workshop_session_id: string | null
        }
        Insert: {
          ai_leverage_points?: Json | null
          ceo_approved?: boolean | null
          convergence_time_minutes?: number | null
          created_at?: string | null
          data_governance_changes?: string | null
          governance_disagreements?: string[] | null
          id?: string
          org_process_changes?: Json | null
          pilot_kpis?: string | null
          policy_risk_checklist?: Json | null
          risk_alignment_level?: string | null
          sticking_points?: string[] | null
          targets_at_risk?: string | null
          updated_at?: string | null
          working_group_inputs?: Json | null
          workshop_session_id?: string | null
        }
        Update: {
          ai_leverage_points?: Json | null
          ceo_approved?: boolean | null
          convergence_time_minutes?: number | null
          created_at?: string | null
          data_governance_changes?: string | null
          governance_disagreements?: string[] | null
          id?: string
          org_process_changes?: Json | null
          pilot_kpis?: string | null
          policy_risk_checklist?: Json | null
          risk_alignment_level?: string | null
          sticking_points?: string[] | null
          targets_at_risk?: string | null
          updated_at?: string | null
          working_group_inputs?: Json | null
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_addendum_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: true
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_profiles: {
        Row: {
          company: string | null
          company_identifier_hash: string | null
          created_at: string | null
          email: string
          first_seen_at: string | null
          id: string
          last_active_at: string | null
          latest_assessment_tier: string | null
          latest_readiness_score: number | null
          name: string | null
          role: string | null
          source_tool: string
          total_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          company_identifier_hash?: string | null
          created_at?: string | null
          email: string
          first_seen_at?: string | null
          id?: string
          last_active_at?: string | null
          latest_assessment_tier?: string | null
          latest_readiness_score?: number | null
          name?: string | null
          role?: string | null
          source_tool?: string
          total_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          company_identifier_hash?: string | null
          created_at?: string | null
          email?: string
          first_seen_at?: string | null
          id?: string
          last_active_at?: string | null
          latest_assessment_tier?: string | null
          latest_readiness_score?: number | null
          name?: string | null
          role?: string | null
          source_tool?: string
          total_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_business_context: {
        Row: {
          ai_readiness_score: number | null
          ai_trust_levels: Json | null
          bottleneck_details: Json | null
          business_description: string | null
          business_name: string | null
          communication_style: Json | null
          company_size: string | null
          context_data: Json | null
          created_at: string
          id: string
          industry: string | null
          primary_challenges: string[] | null
          stakeholder_audiences: Json | null
          thinking_process: Json | null
          updated_at: string
          user_id: string | null
          website_url: string | null
          workflow_pattern: Json | null
        }
        Insert: {
          ai_readiness_score?: number | null
          ai_trust_levels?: Json | null
          bottleneck_details?: Json | null
          business_description?: string | null
          business_name?: string | null
          communication_style?: Json | null
          company_size?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          industry?: string | null
          primary_challenges?: string[] | null
          stakeholder_audiences?: Json | null
          thinking_process?: Json | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          workflow_pattern?: Json | null
        }
        Update: {
          ai_readiness_score?: number | null
          ai_trust_levels?: Json | null
          bottleneck_details?: Json | null
          business_description?: string | null
          business_name?: string | null
          communication_style?: Json | null
          company_size?: string | null
          context_data?: Json | null
          created_at?: string
          id?: string
          industry?: string | null
          primary_challenges?: string[] | null
          stakeholder_audiences?: Json | null
          thinking_process?: Json | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          workflow_pattern?: Json | null
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
      users: {
        Row: {
          auth_user_id: string | null
          company_name: string | null
          company_size: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          industry: string | null
          profile_id: string | null
          role_title: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          profile_id?: string | null
          role_title?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          profile_id?: string | null
          role_title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      velocity_events: {
        Row: {
          action_signal_level: Database["public"]["Enums"]["action_signal_level"]
          assessment_completed_at: string
          contact_email: string
          created_at: string | null
          days_since_assessment: number | null
          event_date: string
          event_description: string | null
          event_metadata: Json | null
          event_type: string
          id: string
          initial_readiness_score: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action_signal_level: Database["public"]["Enums"]["action_signal_level"]
          assessment_completed_at: string
          contact_email: string
          created_at?: string | null
          days_since_assessment?: number | null
          event_date: string
          event_description?: string | null
          event_metadata?: Json | null
          event_type: string
          id?: string
          initial_readiness_score?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_signal_level?: Database["public"]["Enums"]["action_signal_level"]
          assessment_completed_at?: string
          contact_email?: string
          created_at?: string | null
          days_since_assessment?: number | null
          event_date?: string
          event_description?: string | null
          event_metadata?: Json | null
          event_type?: string
          id?: string
          initial_readiness_score?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "velocity_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_instrumentation: {
        Row: {
          created_at: string | null
          dwell_time_seconds: number | null
          event_type: string
          id: string
          metadata: Json | null
          module_name: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          dwell_time_seconds?: number | null
          event_type: string
          id?: string
          metadata?: Json | null
          module_name?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          dwell_time_seconds?: number | null
          event_type?: string
          id?: string
          metadata?: Json | null
          module_name?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_instrumentation_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          audio_retention_consent: boolean | null
          compass_completed_at: string | null
          compass_focus_areas: string[] | null
          compass_scores: Json | null
          compass_tier: string | null
          created_at: string | null
          gated_unlocked_at: string | null
          id: string
          roi_assumptions: string[] | null
          roi_completed_at: string | null
          roi_conservative_value: number | null
          roi_inputs: Json | null
          roi_likely_value: number | null
          roi_transcript: string | null
          session_id: string
          sprint_signup_source: string | null
          updated_at: string | null
          voice_enabled: boolean | null
        }
        Insert: {
          audio_retention_consent?: boolean | null
          compass_completed_at?: string | null
          compass_focus_areas?: string[] | null
          compass_scores?: Json | null
          compass_tier?: string | null
          created_at?: string | null
          gated_unlocked_at?: string | null
          id?: string
          roi_assumptions?: string[] | null
          roi_completed_at?: string | null
          roi_conservative_value?: number | null
          roi_inputs?: Json | null
          roi_likely_value?: number | null
          roi_transcript?: string | null
          session_id: string
          sprint_signup_source?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
        }
        Update: {
          audio_retention_consent?: boolean | null
          compass_completed_at?: string | null
          compass_focus_areas?: string[] | null
          compass_scores?: Json | null
          compass_tier?: string | null
          created_at?: string | null
          gated_unlocked_at?: string | null
          id?: string
          roi_assumptions?: string[] | null
          roi_completed_at?: string | null
          roi_conservative_value?: number | null
          roi_inputs?: Json | null
          roi_likely_value?: number | null
          roi_transcript?: string | null
          session_id?: string
          sprint_signup_source?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_results: {
        Row: {
          activity_session_id: string | null
          created_at: string | null
          dots_allocated: number | null
          id: string
          item_id: string
          item_type: string
          participant_name: string
          workshop_session_id: string | null
        }
        Insert: {
          activity_session_id?: string | null
          created_at?: string | null
          dots_allocated?: number | null
          id?: string
          item_id: string
          item_type: string
          participant_name: string
          workshop_session_id?: string | null
        }
        Update: {
          activity_session_id?: string | null
          created_at?: string | null
          dots_allocated?: number | null
          id?: string
          item_id?: string
          item_type?: string
          participant_name?: string
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_results_activity_session_id_fkey"
            columns: ["activity_session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_results_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      working_group_inputs: {
        Row: {
          activity_session_id: string | null
          created_at: string | null
          id: string
          input_category: string
          input_text: string
          participant_name: string
          profile_id: string | null
          table_number: number
          workshop_session_id: string | null
        }
        Insert: {
          activity_session_id?: string | null
          created_at?: string | null
          id?: string
          input_category: string
          input_text: string
          participant_name: string
          profile_id?: string | null
          table_number: number
          workshop_session_id?: string | null
        }
        Update: {
          activity_session_id?: string | null
          created_at?: string | null
          id?: string
          input_category?: string
          input_text?: string
          participant_name?: string
          profile_id?: string | null
          table_number?: number
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "working_group_inputs_activity_session_id_fkey"
            columns: ["activity_session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_group_inputs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_group_inputs_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_events: {
        Row: {
          context_snapshot: Json | null
          created_at: string | null
          dimension_key: string | null
          event_type: string
          flow_name: string | null
          id: string
          profile_id: string | null
          question_id: string
          question_text: string
          raw_input: string
          response_duration_seconds: number | null
          session_id: string | null
          structured_values: Json | null
          tool_name: string
          workshop_session_id: string | null
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string | null
          dimension_key?: string | null
          event_type: string
          flow_name?: string | null
          id?: string
          profile_id?: string | null
          question_id: string
          question_text: string
          raw_input: string
          response_duration_seconds?: number | null
          session_id?: string | null
          structured_values?: Json | null
          tool_name: string
          workshop_session_id?: string | null
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string | null
          dimension_key?: string | null
          event_type?: string
          flow_name?: string | null
          id?: string
          profile_id?: string | null
          question_id?: string
          question_text?: string
          raw_input?: string
          response_duration_seconds?: number | null
          session_id?: string | null
          structured_values?: Json | null
          tool_name?: string
          workshop_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "unified_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_events_workshop_session_id_fkey"
            columns: ["workshop_session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_questions: {
        Row: {
          active: boolean | null
          created_at: string | null
          dimension_key: string | null
          display_order: number | null
          flow_name: string
          id: string
          options: Json | null
          question_text: string
          question_type: string
          tool_name: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          dimension_key?: string | null
          display_order?: number | null
          flow_name: string
          id: string
          options?: Json | null
          question_text: string
          question_type: string
          tool_name: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          dimension_key?: string | null
          display_order?: number | null
          flow_name?: string
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: string
          tool_name?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      workshop_sessions: {
        Row: {
          alignment_score: number | null
          alignment_signals: Json | null
          bootcamp_plan_id: string | null
          cognitive_baseline_data: Json | null
          completed_at: string | null
          created_at: string | null
          current_segment: number | null
          decision_framework_generated: boolean | null
          facilitator_email: string
          facilitator_name: string
          id: string
          intake_id: string | null
          key_concepts_delivered: Json | null
          participant_count: number | null
          planned_duration_hours: number | null
          segment_timers: Json | null
          segments_completed: string[] | null
          status: string
          tension_map: Json | null
          tension_observations: Json | null
          updated_at: string | null
          workshop_date: string
          workshop_metadata: Json | null
        }
        Insert: {
          alignment_score?: number | null
          alignment_signals?: Json | null
          bootcamp_plan_id?: string | null
          cognitive_baseline_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_segment?: number | null
          decision_framework_generated?: boolean | null
          facilitator_email?: string
          facilitator_name: string
          id?: string
          intake_id?: string | null
          key_concepts_delivered?: Json | null
          participant_count?: number | null
          planned_duration_hours?: number | null
          segment_timers?: Json | null
          segments_completed?: string[] | null
          status?: string
          tension_map?: Json | null
          tension_observations?: Json | null
          updated_at?: string | null
          workshop_date: string
          workshop_metadata?: Json | null
        }
        Update: {
          alignment_score?: number | null
          alignment_signals?: Json | null
          bootcamp_plan_id?: string | null
          cognitive_baseline_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_segment?: number | null
          decision_framework_generated?: boolean | null
          facilitator_email?: string
          facilitator_name?: string
          id?: string
          intake_id?: string | null
          key_concepts_delivered?: Json | null
          participant_count?: number | null
          planned_duration_hours?: number | null
          segment_timers?: Json | null
          segments_completed?: string[] | null
          status?: string
          tension_map?: Json | null
          tension_observations?: Json | null
          updated_at?: string | null
          workshop_date?: string
          workshop_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_sessions_bootcamp_plan_id_fkey"
            columns: ["bootcamp_plan_id"]
            isOneToOne: false
            referencedRelation: "bootcamp_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_sessions_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "exec_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_index_snapshots: {
        Row: {
          avg_readiness_score: number | null
          avg_readiness_score_ci_lower: number | null
          avg_readiness_score_ci_upper: number | null
          company_size_benchmarks: Json | null
          consent_rate: number | null
          dimension_benchmarks: Json | null
          effective_sample_size: number | null
          industry_benchmarks: Json | null
          median_readiness_score: number | null
          methodology_version: string | null
          published_at: string | null
          qoq_change: number | null
          qoq_change_significant: boolean | null
          quarter: string | null
          role_benchmarks: Json | null
          tier_advancing_pct: number | null
          tier_emerging_pct: number | null
          tier_establishing_pct: number | null
          tier_leading_pct: number | null
          total_assessments: number | null
        }
        Insert: {
          avg_readiness_score?: number | null
          avg_readiness_score_ci_lower?: number | null
          avg_readiness_score_ci_upper?: number | null
          company_size_benchmarks?: Json | null
          consent_rate?: number | null
          dimension_benchmarks?: Json | null
          effective_sample_size?: number | null
          industry_benchmarks?: Json | null
          median_readiness_score?: number | null
          methodology_version?: string | null
          published_at?: string | null
          qoq_change?: number | null
          qoq_change_significant?: boolean | null
          quarter?: string | null
          role_benchmarks?: Json | null
          tier_advancing_pct?: number | null
          tier_emerging_pct?: number | null
          tier_establishing_pct?: number | null
          tier_leading_pct?: number | null
          total_assessments?: number | null
        }
        Update: {
          avg_readiness_score?: number | null
          avg_readiness_score_ci_lower?: number | null
          avg_readiness_score_ci_upper?: number | null
          company_size_benchmarks?: Json | null
          consent_rate?: number | null
          dimension_benchmarks?: Json | null
          effective_sample_size?: number | null
          industry_benchmarks?: Json | null
          median_readiness_score?: number | null
          methodology_version?: string | null
          published_at?: string | null
          qoq_change?: number | null
          qoq_change_significant?: boolean | null
          quarter?: string | null
          role_benchmarks?: Json | null
          tier_advancing_pct?: number | null
          tier_emerging_pct?: number | null
          tier_establishing_pct?: number | null
          tier_leading_pct?: number | null
          total_assessments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_leadership_index_snapshots_methodology_version_fkey"
            columns: ["methodology_version"]
            isOneToOne: false
            referencedRelation: "index_publication_rules"
            referencedColumns: ["version"]
          },
        ]
      }
    }
    Functions: {
      calculate_bootstrap_ci: {
        Args: {
          confidence_level?: number
          iterations?: number
          sample_values: number[]
        }
        Returns: {
          ci_lower: number
          ci_upper: number
          mean: number
        }[]
      }
      calculate_conversion_metrics: {
        Args: { session_uuid: string }
        Returns: {
          avg_lead_score: number
          conversion_rate: number
          high_value_conversions: number
          total_sessions: number
        }[]
      }
      generate_referral_code: {
        Args: { p_assessment_id: string; p_email: string }
        Returns: string
      }
      get_intake_for_registration: {
        Args: { intake_uuid: string }
        Returns: {
          company_name: string
          created_at: string
          id: string
          industry: string
          organizer_name: string
        }[]
      }
      get_or_create_profile: {
        Args: {
          p_company?: string
          p_email: string
          p_name?: string
          p_role?: string
          p_source_tool?: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_company_identifier: {
        Args: { email_domain: string }
        Returns: string
      }
      process_pending_sync_logs: {
        Args: never
        Returns: {
          error_count: number
          processed_count: number
          success_count: number
        }[]
      }
      round_percentile: {
        Args: { raw_percentile: number; rounding?: number }
        Returns: number
      }
      schedule_sync_processing: { Args: never; Returns: undefined }
      sync_lead_to_sheets: {
        Args: {
          lead_session_id?: string
          lead_user_id: string
          sync_type_param?: string
        }
        Returns: string
      }
      track_referral_conversion: {
        Args: {
          p_referee_assessment_id: string
          p_referee_email: string
          p_referee_name?: string
          p_referral_code: string
        }
        Returns: boolean
      }
      trigger_google_sheets_sync: {
        Args: { sync_type_param?: string }
        Returns: {
          records_prepared: number
          sync_id: string
          sync_status: string
        }[]
      }
    }
    Enums: {
      action_signal_level: "low" | "mid" | "high"
      app_role: "admin" | "moderator" | "user" | "facilitator"
      consent_purpose:
        | "index_publication"
        | "sales_outreach"
        | "case_study"
        | "product_improvements"
        | "research_partnerships"
      exec_role:
        | "CEO"
        | "CTO"
        | "COO"
        | "CMO"
        | "CFO"
        | "VP"
        | "Director"
        | "Other"
      momentum_tier: "experimenting" | "scaling" | "institutionalizing"
      roi_provenance: "instrumented" | "system_report" | "estimate"
      roi_unit_type:
        | "hours_saved"
        | "revenue_increase"
        | "cost_reduction"
        | "nps_increase"
        | "time_to_market"
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
      action_signal_level: ["low", "mid", "high"],
      app_role: ["admin", "moderator", "user", "facilitator"],
      consent_purpose: [
        "index_publication",
        "sales_outreach",
        "case_study",
        "product_improvements",
        "research_partnerships",
      ],
      exec_role: ["CEO", "CTO", "COO", "CMO", "CFO", "VP", "Director", "Other"],
      momentum_tier: ["experimenting", "scaling", "institutionalizing"],
      roi_provenance: ["instrumented", "system_report", "estimate"],
      roi_unit_type: [
        "hours_saved",
        "revenue_increase",
        "cost_reduction",
        "nps_increase",
        "time_to_market",
      ],
    },
  },
} as const
