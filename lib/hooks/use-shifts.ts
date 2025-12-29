import { useQuery } from '@tanstack/react-query'

export interface ShiftWorker {
  id: string
  user_id: string
  comment: string | null
  users: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export interface Shift {
  id: string
  shift_date: string
  shift_part: 'morning' | 'noon' | 'evening'
  created_at: string
  shift_workers: ShiftWorker[]
}

interface UseShiftsOptions {
  start_date?: string
  end_date?: string
}

/**
 * Fetch shifts for manager (with assigned workers)
 */
export function useShifts(options: UseShiftsOptions = {}) {
  const { start_date, end_date } = options

  return useQuery({
    queryKey: ['shifts', start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)

      const res = await fetch(`/api/manager/shifts?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Failed to fetch shifts')
      }

      const data = await res.json()
      return data.shifts as Shift[]
    },
    enabled: true,
  })
}

/**
 * Fetch shifts for employee (only their assignments)
 */
export function useMyShifts(options: UseShiftsOptions = {}) {
  const { start_date, end_date } = options

  return useQuery({
    queryKey: ['my-shifts', start_date, end_date],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)

      const res = await fetch(`/api/employee/shifts?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Failed to fetch shifts')
      }

      const data = await res.json()
      return data.shifts as Array<{
        assignment_id: string
        assigned_at: string
        comment: string | null
        id: string
        shift_date: string
        shift_part: 'morning' | 'noon' | 'evening'
        workplace_id: string
      }>
    },
    enabled: true,
    staleTime: 0, // Always consider data stale to ensure fresh data on refetch
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus (already set globally)
  })
}

export interface ShiftBoard {
  id: string
  workplace_id: string
  week_start_date: string
  is_published: boolean
  created_at: string
  updated_at: string
}

/**
 * Fetch shift board status for a week
 */
export function useShiftBoard(weekStart: string) {
  return useQuery({
    queryKey: ['shift-board', weekStart],
    queryFn: async () => {
      const res = await fetch(`/api/manager/schedule/publish?week_start=${weekStart}`)

      if (!res.ok) {
        throw new Error('Failed to fetch shift board status')
      }

      const data = await res.json()
      return data.shift_board as ShiftBoard | null
    },
    enabled: !!weekStart,
  })
}
