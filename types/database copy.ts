// Auto-generated database types for Supabase
// Based on the schema defined in supabase/migrations/001_initial_schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ShiftPart = 'morning' | 'noon' | 'evening'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string
          is_manager: boolean
          is_active: boolean
          is_approved: boolean
          workplace_id: string | null
          google_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          full_name: string
          is_manager?: boolean
          is_active?: boolean
          is_approved?: boolean
          workplace_id?: string | null
          google_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          is_manager?: boolean
          is_active?: boolean
          is_approved?: boolean
          workplace_id?: string | null
          google_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workplaces: {
        Row: {
          id: string
          name: string
          business_name: string
          manager_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          business_name: string
          manager_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_name?: string
          manager_id?: string | null
          created_at?: string
        }
      }
      user_requests: {
        Row: {
          id: string
          user_id: string | null
          workplace_id: string | null
          requests: string | null
          modified_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          workplace_id?: string | null
          requests?: string | null
          modified_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          workplace_id?: string | null
          requests?: string | null
          modified_at?: string
          created_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          workplace_id: string | null
          shift_date: string
          shift_part: ShiftPart
          created_at: string
        }
        Insert: {
          id?: string
          workplace_id?: string | null
          shift_date: string
          shift_part: ShiftPart
          created_at?: string
        }
        Update: {
          id?: string
          workplace_id?: string | null
          shift_date?: string
          shift_part?: ShiftPart
          created_at?: string
        }
      }
      shift_workers: {
        Row: {
          id: string
          shift_id: string | null
          user_id: string | null
          assigned_at: string
        }
        Insert: {
          id?: string
          shift_id?: string | null
          user_id?: string | null
          assigned_at?: string
        }
        Update: {
          id?: string
          shift_id?: string | null
          user_id?: string | null
          assigned_at?: string
        }
      }
      shift_boards: {
        Row: {
          id: string
          workplace_id: string | null
          week_start_date: string
          is_published: boolean
          content: Json
          preferences: Json
          requests_window_start: string | null
          requests_window_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workplace_id?: string | null
          week_start_date: string
          is_published?: boolean
          content?: Json
          preferences?: Json
          requests_window_start?: string | null
          requests_window_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workplace_id?: string | null
          week_start_date?: string
          is_published?: boolean
          content?: Json
          preferences?: Json
          requests_window_start?: string | null
          requests_window_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_sunday: {
        Args: Record<string, never>
        Returns: string
      }
      is_manager: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
      get_user_workplace: {
        Args: {
          user_uuid: string
        }
        Returns: string
      }
      is_request_window_open: {
        Args: {
          workplace_uuid: string
        }
        Returns: boolean
      }
      can_edit_shift: {
        Args: {
          shift_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      shift_part: ShiftPart
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Workplace = Database['public']['Tables']['workplaces']['Row']
export type UserRequest = Database['public']['Tables']['user_requests']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type ShiftWorker = Database['public']['Tables']['shift_workers']['Row']
export type ShiftBoard = Database['public']['Tables']['shift_boards']['Row']

// Preferences type for shift boards
export interface ShiftBoardPreferences {
  closed_days: string[]
  number_of_shifts_per_day: number
}

// Combined types for API responses
export interface EmployeeWithShifts extends User {
  shifts?: ShiftWorker[]
}

export interface ShiftWithWorkers extends Shift {
  workers?: User[]
}

export interface WorkplaceWithManager extends Workplace {
  manager?: User
}
