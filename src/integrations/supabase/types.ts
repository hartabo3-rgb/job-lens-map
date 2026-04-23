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
      applications: {
        Row: {
          applicant_id: string
          applied_at: string
          id: string
          job_id: string
          match_score: number
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          id?: string
          job_id: string
          match_score?: number
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          id?: string
          job_id?: string
          match_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          description: string
          employer_id: string
          id: string
          latitude: number
          location_name: string
          longitude: number
          required_education:
            | Database["public"]["Enums"]["education_level"]
            | null
          required_experience:
            | Database["public"]["Enums"]["experience_range"]
            | null
          required_field: string | null
          required_languages: string[] | null
          required_skills: string[] | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          employer_id: string
          id?: string
          latitude: number
          location_name: string
          longitude: number
          required_education?:
            | Database["public"]["Enums"]["education_level"]
            | null
          required_experience?:
            | Database["public"]["Enums"]["experience_range"]
            | null
          required_field?: string | null
          required_languages?: string[] | null
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          employer_id?: string
          id?: string
          latitude?: number
          location_name?: string
          longitude?: number
          required_education?:
            | Database["public"]["Enums"]["education_level"]
            | null
          required_experience?:
            | Database["public"]["Enums"]["experience_range"]
            | null
          required_field?: string | null
          required_languages?: string[] | null
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          cv_url: string | null
          education: Database["public"]["Enums"]["education_level"] | null
          email: string
          experience_years:
            | Database["public"]["Enums"]["experience_range"]
            | null
          field: string | null
          full_name: string | null
          id: string
          languages: string[] | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          cv_url?: string | null
          education?: Database["public"]["Enums"]["education_level"] | null
          email: string
          experience_years?:
            | Database["public"]["Enums"]["experience_range"]
            | null
          field?: string | null
          full_name?: string | null
          id: string
          languages?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          cv_url?: string | null
          education?: Database["public"]["Enums"]["education_level"] | null
          email?: string
          experience_years?:
            | Database["public"]["Enums"]["experience_range"]
            | null
          field?: string | null
          full_name?: string | null
          id?: string
          languages?: string[] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_score: {
        Args: { p_applicant_id: string; p_job_id: string }
        Returns: number
      }
    }
    Enums: {
      education_level: "ثانوية" | "دبلوم" | "بكالوريوس" | "ماجستير" | "دكتوراه"
      experience_range:
        | "أقل من سنة"
        | "1-3 سنوات"
        | "3-5 سنوات"
        | "5-10 سنوات"
        | "أكثر من 10 سنوات"
      job_status: "active" | "closed"
      user_role: "job_seeker" | "employer"
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
      education_level: ["ثانوية", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه"],
      experience_range: [
        "أقل من سنة",
        "1-3 سنوات",
        "3-5 سنوات",
        "5-10 سنوات",
        "أكثر من 10 سنوات",
      ],
      job_status: ["active", "closed"],
      user_role: ["job_seeker", "employer"],
    },
  },
} as const
