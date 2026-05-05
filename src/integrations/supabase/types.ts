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
      activation_codes: {
        Row: {
          assigned_tests: string[] | null
          auto_submitted: boolean
          candidate_email: string
          candidate_name: string
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean
          password: string
          position: string
          status: string
          test_completed_at: string | null
          test_started_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_tests?: string[] | null
          auto_submitted?: boolean
          candidate_email: string
          candidate_name: string
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          password: string
          position?: string
          status?: string
          test_completed_at?: string | null
          test_started_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_tests?: string[] | null
          auto_submitted?: boolean
          candidate_email?: string
          candidate_name?: string
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          password?: string
          position?: string
          status?: string
          test_completed_at?: string | null
          test_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: string
          value_type: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
          value_type?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
          value_type?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          activation_code_id: string | null
          birth_date: string | null
          created_at: string
          education: string | null
          email: string
          gender: string | null
          id: string
          name: string
          phone: string
          photo_url: string | null
          position: string
          status: string
          updated_at: string
        }
        Insert: {
          activation_code_id?: string | null
          birth_date?: string | null
          created_at?: string
          education?: string | null
          email: string
          gender?: string | null
          id?: string
          name: string
          phone?: string
          photo_url?: string | null
          position?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activation_code_id?: string | null
          birth_date?: string | null
          created_at?: string
          education?: string | null
          email?: string
          gender?: string | null
          id?: string
          name?: string
          phone?: string
          photo_url?: string | null
          position?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_activation_code_id_fkey"
            columns: ["activation_code_id"]
            isOneToOne: false
            referencedRelation: "activation_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      test_answers: {
        Row: {
          category: string | null
          correct_answer: string | null
          created_at: string
          expected_answer: string | null
          id: string
          is_correct: boolean | null
          question_number: number
          question_text: string
          question_text_en: string | null
          reaction_time_ms: number | null
          selected_answer: string
          selected_answer_label: string
          test_result_id: string
          typed_answer: string | null
        }
        Insert: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string
          expected_answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_number: number
          question_text: string
          question_text_en?: string | null
          reaction_time_ms?: number | null
          selected_answer: string
          selected_answer_label?: string
          test_result_id: string
          typed_answer?: string | null
        }
        Update: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string
          expected_answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_number?: number
          question_text?: string
          question_text_en?: string | null
          reaction_time_ms?: number | null
          selected_answer?: string
          selected_answer_label?: string
          test_result_id?: string
          typed_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "test_results"
            referencedColumns: ["id"]
          },
        ]
      }
      test_instruments: {
        Row: {
          category: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          name_en: string
          norm_reference: string
          question_count: number
          scoring_method: string
          target_audience: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          name_en?: string
          norm_reference?: string
          question_count?: number
          scoring_method?: string
          target_audience?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string
          norm_reference?: string
          question_count?: number
          scoring_method?: string
          target_audience?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_interpretations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          instrument_id: string
          interpretation_key: string
          interpretation_text: string
          interpretation_text_en: string | null
          max_value: number | null
          min_value: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          instrument_id: string
          interpretation_key: string
          interpretation_text: string
          interpretation_text_en?: string | null
          max_value?: number | null
          min_value?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          instrument_id?: string
          interpretation_key?: string
          interpretation_text?: string
          interpretation_text_en?: string | null
          max_value?: number | null
          min_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_interpretations_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "test_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_question_options: {
        Row: {
          category_target: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_correct: boolean | null
          option_definition: string | null
          option_definition_en: string | null
          option_label: string
          option_text: string
          option_text_en: string | null
          question_id: string
          score_value: number
        }
        Insert: {
          category_target?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_correct?: boolean | null
          option_definition?: string | null
          option_definition_en?: string | null
          option_label: string
          option_text: string
          option_text_en?: string | null
          question_id: string
          score_value?: number
        }
        Update: {
          category_target?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_correct?: boolean | null
          option_definition?: string | null
          option_definition_en?: string | null
          option_label?: string
          option_text?: string
          option_text_en?: string | null
          question_id?: string
          score_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          category: string | null
          created_at: string
          group_number: number | null
          id: string
          image_url: string | null
          instrument_id: string
          question_number: number
          question_text: string
          question_text_en: string | null
          question_type: string
          scoring_rule: string | null
          subtest_code: string | null
          time_limit_minutes: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          group_number?: number | null
          id?: string
          image_url?: string | null
          instrument_id: string
          question_number?: number
          question_text: string
          question_text_en?: string | null
          question_type?: string
          scoring_rule?: string | null
          subtest_code?: string | null
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          group_number?: number | null
          id?: string
          image_url?: string | null
          instrument_id?: string
          question_number?: number
          question_text?: string
          question_text_en?: string | null
          question_type?: string
          scoring_rule?: string | null
          subtest_code?: string | null
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "test_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_result_details: {
        Row: {
          accuracy_rate: number | null
          correct_count: number
          created_at: string
          id: string
          incorrect_count: number
          questions_count: number
          segment_number: number
          speed_per_minute: number | null
          test_result_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          questions_count?: number
          segment_number?: number
          speed_per_minute?: number | null
          test_result_id: string
        }
        Update: {
          accuracy_rate?: number | null
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          questions_count?: number
          segment_number?: number
          speed_per_minute?: number | null
          test_result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_result_details_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "test_results"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          accuracy_score: number | null
          answered_questions: number
          candidate_id: string | null
          candidate_name: string
          candidate_profile: Json | null
          categories: Json
          completed_at: string
          created_at: string
          duration_seconds: number | null
          id: string
          instrument_id: string | null
          interpretation: string | null
          position: string
          score: number
          speed_score: number | null
          stability_score: number | null
          status: string
          test_name: string
          total_questions: number
          webcam_photo_url: string | null
          work_capacity: number | null
        }
        Insert: {
          accuracy_score?: number | null
          answered_questions?: number
          candidate_id?: string | null
          candidate_name: string
          candidate_profile?: Json | null
          categories?: Json
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          instrument_id?: string | null
          interpretation?: string | null
          position?: string
          score?: number
          speed_score?: number | null
          stability_score?: number | null
          status?: string
          test_name?: string
          total_questions?: number
          webcam_photo_url?: string | null
          work_capacity?: number | null
        }
        Update: {
          accuracy_score?: number | null
          answered_questions?: number
          candidate_id?: string | null
          candidate_name?: string
          candidate_profile?: Json | null
          categories?: Json
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          instrument_id?: string | null
          interpretation?: string | null
          position?: string
          score?: number
          speed_score?: number | null
          stability_score?: number | null
          status?: string
          test_name?: string
          total_questions?: number
          webcam_photo_url?: string | null
          work_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "test_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          id: string
          name: string
          description: string
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          full_name: string
          role_id: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          full_name?: string
          role_id?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          full_name?: string
          role_id?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          activation_code_id: string
          answers: Json
          candidate_email: string
          completed_subtests: string[]
          created_at: string
          current_question_idx: number
          current_test_idx: number
          id: string
          is_code_deactivated: boolean
          last_active_at: string
          last_violation_at: string | null
          original_duration_seconds: number
          seconds_remaining: number
          test_started_at: string | null
          time_penalty_seconds: number
          updated_at: string
          violation_count: number
          violation_history: Json
        }
        Insert: {
          activation_code_id: string
          answers?: Json
          candidate_email: string
          completed_subtests?: string[]
          created_at?: string
          current_question_idx?: number
          current_test_idx?: number
          id?: string
          is_code_deactivated?: boolean
          last_active_at?: string
          last_violation_at?: string | null
          original_duration_seconds?: number
          seconds_remaining?: number
          test_started_at?: string | null
          time_penalty_seconds?: number
          updated_at?: string
          violation_count?: number
          violation_history?: Json
        }
        Update: {
          activation_code_id?: string
          answers?: Json
          candidate_email?: string
          completed_subtests?: string[]
          created_at?: string
          current_question_idx?: number
          current_test_idx?: number
          id?: string
          is_code_deactivated?: boolean
          last_active_at?: string
          last_violation_at?: string | null
          original_duration_seconds?: number
          seconds_remaining?: number
          test_started_at?: string | null
          time_penalty_seconds?: number
          updated_at?: string
          violation_count?: number
          violation_history?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
