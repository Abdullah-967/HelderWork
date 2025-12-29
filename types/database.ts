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
      shift_boards: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          is_published: boolean | null
          preferences: Json | null
          requests_window_end: string | null
          requests_window_start: string | null
          updated_at: string | null
          week_start_date: string
          workplace_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          preferences?: Json | null
          requests_window_end?: string | null
          requests_window_start?: string | null
          updated_at?: string | null
          week_start_date: string
          workplace_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          preferences?: Json | null
          requests_window_end?: string | null
          requests_window_start?: string | null
          updated_at?: string | null
          week_start_date?: string
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_boards_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_workers: {
        Row: {
          assigned_at: string | null
          comment: string | null
          id: string
          shift_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          comment?: string | null
          id?: string
          shift_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          comment?: string | null
          id?: string
          shift_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_workers_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          id: string
          shift_date: string
          shift_part: Database["public"]["Enums"]["shift_part"]
          workplace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          shift_date: string
          shift_part: Database["public"]["Enums"]["shift_part"]
          workplace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          shift_date?: string
          shift_part?: Database["public"]["Enums"]["shift_part"]
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_requests: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          requests: string | null
          user_id: string | null
          workplace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          requests?: string | null
          user_id?: string | null
          workplace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          requests?: string | null
          user_id?: string | null
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_requests_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          google_id: string | null
          id: string
          is_active: boolean
          is_approved: boolean
          is_manager: boolean
          updated_at: string | null
          username: string
          workplace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          google_id?: string | null
          id: string
          is_active?: boolean
          is_approved?: boolean
          is_manager?: boolean
          updated_at?: string | null
          username: string
          workplace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          google_id?: string | null
          id?: string
          is_active?: boolean
          is_approved?: boolean
          is_manager?: boolean
          updated_at?: string | null
          username?: string
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_workplace"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workplaces: {
        Row: {
          business_name: string
          created_at: string | null
          id: string
          manager_id: string | null
          name: string
        }
        Insert: {
          business_name: string
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name: string
        }
        Update: {
          business_name?: string
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "workplaces_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_shift: { Args: { shift_uuid: string }; Returns: boolean }
      get_user_workplace: { Args: { user_uuid: string }; Returns: string }
      is_manager: { Args: { user_uuid: string }; Returns: boolean }
      is_request_window_open: {
        Args: { workplace_uuid: string }
        Returns: boolean
      }
      next_sunday: { Args: never; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      shift_part: "morning" | "noon" | "evening"
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
    : never,
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
      shift_part: ["morning", "noon", "evening"],
    },
  },
} as const

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Workplace = Database['public']['Tables']['workplaces']['Row']
export type UserRequest = Database['public']['Tables']['user_requests']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type ShiftWorker = Database['public']['Tables']['shift_workers']['Row']
export type ShiftBoard = Database['public']['Tables']['shift_boards']['Row']

export interface ShiftBoardPreferences {
  closed_days: string[]
  number_of_shifts_per_day: number
}

export interface EmployeeWithShifts extends User {
  shifts?: ShiftWorker[]
}

export interface ShiftWithWorkers extends Shift {
  workers?: User[]
}

export interface WorkplaceWithManager extends Workplace {
  manager?: User
}