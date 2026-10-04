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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      child_learning_progress: {
        Row: {
          child_id: string
          last_active_date: string | null
          state: Json
          streak: number
          total_xp: number
          updated_at: string
        }
        Insert: {
          child_id: string
          last_active_date?: string | null
          state?: Json
          streak?: number
          total_xp?: number
          updated_at?: string
        }
        Update: {
          child_id?: string
          last_active_date?: string | null
          state?: Json
          streak?: number
          total_xp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_learning_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar: string | null
          created_at: string
          grade: number
          id: string
          name: string
          parent_id: string
          pin_failed_count: number
          pin_hash: string
          pin_locked_until: string | null
          school: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          grade: number
          id?: string
          name: string
          parent_id: string
          pin_failed_count?: number
          pin_hash: string
          pin_locked_until?: string | null
          school?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          grade?: number
          id?: string
          name?: string
          parent_id?: string
          pin_failed_count?: number
          pin_hash?: string
          pin_locked_until?: string | null
          school?: string | null
        }
        Relationships: []
      }
      chunks_completed: {
        Row: {
          child_id: string
          chunk_index: number
          chunk_type: string
          completed_at: string
          duration_seconds: number | null
          id: string
          session_id: string
        }
        Insert: {
          child_id: string
          chunk_index: number
          chunk_type: string
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          session_id: string
        }
        Update: {
          child_id?: string
          chunk_index?: number
          chunk_type?: string
          completed_at?: string
          duration_seconds?: number | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_completed_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_completed_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_session_child_fk"
            columns: ["session_id", "child_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id", "child_id"]
          },
        ]
      }
      image_cache: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          prompt_hash: string
          storage_path: string
          storage_url: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          prompt_hash: string
          storage_path: string
          storage_url?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          prompt_hash?: string
          storage_path?: string
          storage_url?: string | null
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
          child_id: string
          ended_at: string | null
          id: string
          lesson_id: string
          started_at: string
          xp: number
        }
        Insert: {
          child_id: string
          ended_at?: string | null
          id?: string
          lesson_id: string
          started_at?: string
          xp?: number
        }
        Update: {
          child_id?: string
          ended_at?: string | null
          id?: string
          lesson_id?: string
          started_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_chunks: {
        Row: {
          chunk_type: string
          content: Json
          id: string
          lesson_id: string
          position: number
        }
        Insert: {
          chunk_type: string
          content: Json
          id?: string
          lesson_id: string
          position: number
        }
        Update: {
          chunk_type?: string
          content?: Json
          id?: string
          lesson_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_chunks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          approved: boolean
          content: Json | null
          created_at: string
          grade: number
          id: string
          position: number
          prerequisite_id: string | null
          slug: string | null
          subject: string
          title: string
          unit: string
          unit_id: string | null
        }
        Insert: {
          approved?: boolean
          content?: Json | null
          created_at?: string
          grade: number
          id?: string
          position?: number
          prerequisite_id?: string | null
          slug?: string | null
          subject: string
          title: string
          unit: string
          unit_id?: string | null
        }
        Update: {
          approved?: boolean
          content?: Json | null
          created_at?: string
          grade?: number
          id?: string
          position?: number
          prerequisite_id?: string | null
          slug?: string | null
          subject?: string
          title?: string
          unit?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_prerequisite_id_fkey"
            columns: ["prerequisite_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          child_id: string
          id: string
          kind: string
          notification_id: string
          parent_id: string
          sent_at: string
        }
        Insert: {
          child_id: string
          id?: string
          kind: string
          notification_id: string
          parent_id: string
          sent_at?: string
        }
        Update: {
          child_id?: string
          id?: string
          kind?: string
          notification_id?: string
          parent_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          notification_id: string
          parent_id: string
          read_at: string
        }
        Insert: {
          notification_id: string
          parent_id: string
          read_at?: string
        }
        Update: {
          notification_id?: string
          parent_id?: string
          read_at?: string
        }
        Relationships: []
      }
      parent_profiles: {
        Row: {
          consent_at: string | null
          consent_scope: string | null
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          consent_at?: string | null
          consent_scope?: string | null
          created_at?: string
          full_name: string
          id: string
        }
        Update: {
          consent_at?: string | null
          consent_scope?: string | null
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      practice_results: {
        Row: {
          accuracy: number
          child_id: string
          created_at: string
          id: string
          kind: string
          retries: number
          syllables_correct: number
          syllables_total: number
          target: string
        }
        Insert: {
          accuracy: number
          child_id: string
          created_at?: string
          id?: string
          kind: string
          retries?: number
          syllables_correct?: number
          syllables_total?: number
          target: string
        }
        Update: {
          accuracy?: number
          child_id?: string
          created_at?: string
          id?: string
          kind?: string
          retries?: number
          syllables_correct?: number
          syllables_total?: number
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_results_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          answer_ms: number | null
          answered_at: string
          attempt: number
          child_id: string
          chunk_index: number
          id: string
          is_correct: boolean
          session_id: string
        }
        Insert: {
          answer_ms?: number | null
          answered_at?: string
          attempt?: number
          child_id: string
          chunk_index: number
          id?: string
          is_correct: boolean
          session_id: string
        }
        Update: {
          answer_ms?: number | null
          answered_at?: string
          attempt?: number
          child_id?: string
          chunk_index?: number
          id?: string
          is_correct?: boolean
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_session_child_fk"
            columns: ["session_id", "child_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id", "child_id"]
          },
        ]
      }
      screening_sessions: {
        Row: {
          child_id: string
          completed_at: string
          digit_span_score: number
          id: string
          invalid_reason: string | null
          is_valid: boolean
          phonological_score: number
          rapid_naming_score: number
          risk_level: string
          risk_score: number
          spelling_score: number
        }
        Insert: {
          child_id: string
          completed_at?: string
          digit_span_score: number
          id?: string
          invalid_reason?: string | null
          is_valid?: boolean
          phonological_score: number
          rapid_naming_score: number
          risk_level: string
          risk_score: number
          spelling_score: number
        }
        Update: {
          child_id?: string
          completed_at?: string
          digit_span_score?: number
          id?: string
          invalid_reason?: string | null
          is_valid?: boolean
          phonological_score?: number
          rapid_naming_score?: number
          risk_level?: string
          risk_score?: number
          spelling_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "screening_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          approved: boolean
          grade: number
          id: string
          overview: Json | null
          position: number
          subject: string
          title: string
        }
        Insert: {
          approved?: boolean
          grade: number
          id?: string
          overview?: Json | null
          position?: number
          subject: string
          title: string
        }
        Update: {
          approved?: boolean
          grade?: number
          id?: string
          overview?: Json | null
          position?: number
          subject?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_child_pin: {
        Args: { p_child_id: string; p_pin: string }
        Returns: boolean
      }
      verify_child_pin: {
        Args: { p_child_id: string; p_pin: string }
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
    Enums: {},
  },
} as const

