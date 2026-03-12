export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "worker" | "company";
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          terms_agreed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "worker" | "company";
          name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          terms_agreed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "worker" | "company";
          name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          terms_agreed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      worker_profiles: {
        Row: {
          id: string;
          specialty: string | null;
          experience: number;
          bio: string | null;
          location: string | null;
          hourly_rate: number;
          available: boolean;
          skills: string[];
          rating: number;
          review_count: number;
          completed_jobs: number;
          total_earnings: number;
          profile_views: number;
          preferred_regions: string[];
        };
        Insert: {
          id: string;
          specialty?: string | null;
          experience?: number;
          bio?: string | null;
          location?: string | null;
          hourly_rate?: number;
          available?: boolean;
          skills?: string[];
          rating?: number;
          review_count?: number;
          completed_jobs?: number;
          total_earnings?: number;
          profile_views?: number;
          preferred_regions?: string[];
        };
        Update: {
          specialty?: string | null;
          experience?: number;
          bio?: string | null;
          location?: string | null;
          hourly_rate?: number;
          available?: boolean;
          skills?: string[];
          rating?: number;
          review_count?: number;
          completed_jobs?: number;
          total_earnings?: number;
          profile_views?: number;
          preferred_regions?: string[];
        };
        Relationships: [];
      };
      company_profiles: {
        Row: {
          id: string;
          company_name: string | null;
          biz_number: string | null;
          ceo: string | null;
          industry: string | null;
          employees: string | null;
          address: string | null;
          description: string | null;
        };
        Insert: {
          id: string;
          company_name?: string | null;
          biz_number?: string | null;
          ceo?: string | null;
          industry?: string | null;
          employees?: string | null;
          address?: string | null;
          description?: string | null;
        };
        Update: {
          company_name?: string | null;
          biz_number?: string | null;
          ceo?: string | null;
          industry?: string | null;
          employees?: string | null;
          address?: string | null;
          description?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          location: string | null;
          salary: string | null;
          type: string | null;
          description: string | null;
          requirements: string[];
          benefits: string[];
          applicant_count: number;
          status: "active" | "closed" | "draft";
          posted_at: string;
          deadline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          location?: string | null;
          salary?: string | null;
          type?: string | null;
          description?: string | null;
          requirements?: string[];
          benefits?: string[];
          applicant_count?: number;
          status?: "active" | "closed" | "draft";
          posted_at?: string;
          deadline?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          location?: string | null;
          salary?: string | null;
          type?: string | null;
          description?: string | null;
          requirements?: string[];
          benefits?: string[];
          status?: "active" | "closed" | "draft";
          deadline?: string | null;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          worker_id: string;
          status: "pending" | "accepted" | "rejected";
          message: string | null;
          is_auto_applied: boolean;
          auto_apply_log_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          worker_id: string;
          status?: "pending" | "accepted" | "rejected";
          message?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "rejected";
          message?: string | null;
        };
        Relationships: [];
      };
      chat_rooms: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      chat_participants: {
        Row: {
          room_id: string;
          user_id: string;
          last_read_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          last_read_at?: string;
        };
        Update: {
          last_read_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          text: string;
          is_ai_response: boolean;
          ai_confidence: number | null;
          escalated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          text: string;
          is_ai_response?: boolean;
          ai_confidence?: number | null;
          escalated?: boolean;
          created_at?: string;
        };
        Update: {
          text?: string;
          is_ai_response?: boolean;
          ai_confidence?: number | null;
          escalated?: boolean;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          worker_id: string;
          company_id: string;
          contract_id: string | null;
          rating: number;
          categories: Json;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          company_id: string;
          contract_id?: string | null;
          rating: number;
          categories?: Json;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: number;
          categories?: Json;
          comment?: string | null;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          job_id: string | null;
          worker_id: string | null;
          company_id: string | null;
          daily_rate: number;
          work_days: number;
          total_amount: number;
          start_date: string | null;
          end_date: string | null;
          status: "pending" | "active" | "completed" | "cancelled";
          signed_by_worker: boolean;
          signed_by_company: boolean;
          signed_at: string | null;
          worker_confirmed: boolean;
          company_confirmed: boolean;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          worker_id?: string | null;
          company_id?: string | null;
          daily_rate: number;
          work_days: number;
          total_amount: number;
          start_date?: string | null;
          end_date?: string | null;
          status?: "pending" | "active" | "completed" | "cancelled";
          signed_by_worker?: boolean;
          signed_by_company?: boolean;
          signed_at?: string | null;
          worker_confirmed?: boolean;
          company_confirmed?: boolean;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          daily_rate?: number;
          work_days?: number;
          total_amount?: number;
          start_date?: string | null;
          end_date?: string | null;
          status?: "pending" | "active" | "completed" | "cancelled";
          signed_by_worker?: boolean;
          signed_by_company?: boolean;
          signed_at?: string | null;
          worker_confirmed?: boolean;
          company_confirmed?: boolean;
          confirmed_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          contract_id: string | null;
          amount: number;
          method: "card" | "bank_transfer" | "escrow" | null;
          status: "pending" | "processing" | "completed" | "failed" | "refunded";
          escrow_released: boolean;
          payment_key: string | null;
          order_id: string | null;
          toss_status: string | null;
          refund_reason: string | null;
          refunded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id?: string | null;
          amount: number;
          method?: "card" | "bank_transfer" | "escrow" | null;
          status?: "pending" | "processing" | "completed" | "failed" | "refunded";
          escrow_released?: boolean;
          payment_key?: string | null;
          order_id?: string | null;
          toss_status?: string | null;
          refund_reason?: string | null;
          refunded_at?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          method?: "card" | "bank_transfer" | "escrow" | null;
          status?: "pending" | "processing" | "completed" | "failed" | "refunded";
          escrow_released?: boolean;
          payment_key?: string | null;
          order_id?: string | null;
          toss_status?: string | null;
          refund_reason?: string | null;
          refunded_at?: string | null;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          email_enabled: boolean;
          chat_enabled: boolean;
          profile_public: boolean;
          location_enabled: boolean;
          ai_matching_enabled: boolean;
          matching_min_score: number;
          matching_max_results: number;
          matching_preferred_locations: string[];
          matching_preferred_types: string[];
        };
        Insert: {
          user_id: string;
          push_enabled?: boolean;
          email_enabled?: boolean;
          chat_enabled?: boolean;
          profile_public?: boolean;
          location_enabled?: boolean;
          ai_matching_enabled?: boolean;
          matching_min_score?: number;
          matching_max_results?: number;
          matching_preferred_locations?: string[];
          matching_preferred_types?: string[];
        };
        Update: {
          push_enabled?: boolean;
          email_enabled?: boolean;
          chat_enabled?: boolean;
          profile_public?: boolean;
          location_enabled?: boolean;
          ai_matching_enabled?: boolean;
          matching_min_score?: number;
          matching_max_results?: number;
          matching_preferred_locations?: string[];
          matching_preferred_types?: string[];
        };
        Relationships: [];
      };
      worker_experiences: {
        Row: {
          id: string;
          worker_id: string;
          company_name: string;
          work_period: string | null;
          responsibility: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          company_name: string;
          work_period?: string | null;
          responsibility?: string | null;
          created_at?: string;
        };
        Update: {
          company_name?: string;
          work_period?: string | null;
          responsibility?: string | null;
        };
        Relationships: [];
      };
      worker_certificates: {
        Row: {
          id: string;
          worker_id: string;
          cert_name: string;
          acquired_date: string | null;
          issuing_agency: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          cert_name: string;
          acquired_date?: string | null;
          issuing_agency?: string | null;
          created_at?: string;
        };
        Update: {
          cert_name?: string;
          acquired_date?: string | null;
          issuing_agency?: string | null;
        };
        Relationships: [];
      };
      auto_apply_settings: {
        Row: {
          worker_id: string;
          enabled: boolean;
          max_daily_applications: number;
          apply_time: string;
          preferred_locations: string[];
          min_daily_rate: number;
          job_types: string[];
          exclude_keywords: string[];
          templates: Json;
          active_template_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          worker_id: string;
          enabled?: boolean;
          max_daily_applications?: number;
          apply_time?: string;
          preferred_locations?: string[];
          min_daily_rate?: number;
          job_types?: string[];
          exclude_keywords?: string[];
          templates?: Json;
          active_template_id?: string | null;
        };
        Update: {
          enabled?: boolean;
          max_daily_applications?: number;
          apply_time?: string;
          preferred_locations?: string[];
          min_daily_rate?: number;
          job_types?: string[];
          exclude_keywords?: string[];
          templates?: Json;
          active_template_id?: string | null;
        };
        Relationships: [];
      };
      auto_apply_logs: {
        Row: {
          id: string;
          worker_id: string;
          job_id: string;
          application_id: string | null;
          match_score: number;
          match_reasons: string[];
          generated_message: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          job_id: string;
          application_id?: string | null;
          match_score: number;
          match_reasons?: string[];
          generated_message?: string | null;
          status?: string;
          error_message?: string | null;
        };
        Update: {
          application_id?: string | null;
          status?: string;
          error_message?: string | null;
        };
        Relationships: [];
      };
      company_bot_settings: {
        Row: {
          company_id: string;
          enabled: boolean;
          schedule_mode: string;
          custom_start_time: string | null;
          custom_end_time: string | null;
          tone: string;
          escalation_keywords: string[];
          notify_on_escalation: boolean;
          greeting_message: string | null;
          total_responses: number;
          total_escalations: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          enabled?: boolean;
          schedule_mode?: string;
          tone?: string;
          escalation_keywords?: string[];
          notify_on_escalation?: boolean;
          greeting_message?: string | null;
        };
        Update: {
          enabled?: boolean;
          schedule_mode?: string;
          custom_start_time?: string | null;
          custom_end_time?: string | null;
          tone?: string;
          escalation_keywords?: string[];
          notify_on_escalation?: boolean;
          greeting_message?: string | null;
          total_responses?: number;
          total_escalations?: number;
        };
        Relationships: [];
      };
      company_bot_faq: {
        Row: {
          id: string;
          company_id: string;
          question: string;
          answer: string;
          category: string | null;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          question: string;
          answer: string;
          category?: string | null;
          priority?: number;
        };
        Update: {
          question?: string;
          answer?: string;
          category?: string | null;
          priority?: number;
        };
        Relationships: [];
      };
      applicant_analysis: {
        Row: {
          id: string;
          job_id: string;
          application_id: string;
          worker_id: string;
          overall_score: number;
          grade: string;
          category_scores: Json;
          summary: string;
          strengths: string[];
          weaknesses: string[];
          recommendation: string | null;
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          application_id: string;
          worker_id: string;
          overall_score: number;
          grade: string;
          category_scores?: Json;
          summary: string;
          strengths?: string[];
          weaknesses?: string[];
          recommendation?: string | null;
        };
        Update: {
          overall_score?: number;
          grade?: string;
          category_scores?: Json;
          summary?: string;
          strengths?: string[];
          weaknesses?: string[];
          recommendation?: string | null;
        };
        Relationships: [];
      };
      notification_templates: {
        Row: {
          id: string;
          type: string;
          title: string;
          body: string;
          variables: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          body: string;
          variables?: string[];
        };
        Update: {
          title?: string;
          body?: string;
          variables?: string[];
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_profile_views: {
        Args: { worker_uuid: string };
        Returns: undefined;
      };
      increment_faq_use_count: {
        Args: { faq_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
