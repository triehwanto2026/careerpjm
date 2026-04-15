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
          candidate_email: string
          candidate_name: string
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean
          password: string
          position: string
          updated_at: string
        }
        Insert: {
          candidate_email: string
          candidate_name: string
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          password: string
          position?: string
          updated_at?: string
        }
        Update: {
          candidate_email?: string
          candidate_name?: string
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          password?: string
          position?: string
          updated_at?: string
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
          id: string
          is_correct: boolean | null
          question_number: number
          question_text: string
          question_text_en: string | null
          selected_answer: string
          selected_answer_label: string
          test_result_id: string
        }
        Insert: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_number: number
          question_text: string
          question_text_en?: string | null
          selected_answer: string
          selected_answer_label?: string
          test_result_id: string
        }
        Update: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_number?: number
          question_text?: string
          question_text_en?: string | null
          selected_answer?: string
          selected_answer_label?: string
          test_result_id?: string
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
      test_results: {
        Row: {
          answered_questions: number
          candidate_id: string | null
          candidate_name: string
          candidate_profile: Json | null
          categories: Json
          completed_at: string
          created_at: string
          id: string
          interpretation: string | null
          position: string
          score: number
          status: string
          test_name: string
          total_questions: number
        }
        Insert: {
          answered_questions?: number
          candidate_id?: string | null
          candidate_name: string
          candidate_profile?: Json | null
          categories?: Json
          completed_at?: string
          created_at?: string
          id?: string
          interpretation?: string | null
          position?: string
          score?: number
          status?: string
          test_name?: string
          total_questions?: number
        }
        Update: {
          answered_questions?: number
          candidate_id?: string | null
          candidate_name?: string
          candidate_profile?: Json | null
          categories?: Json
          completed_at?: string
          created_at?: string
          id?: string
          interpretation?: string | null
          position?: string
          score?: number
          status?: string
          test_name?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
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
