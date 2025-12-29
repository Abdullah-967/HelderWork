import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types/database'

export interface EmployeeData {
  approved: User[]
  pending: User[]
  total: number
}

/**
 * Fetch all employees in manager's workplace
 */
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/manager/employees')

      if (!res.ok) {
        let errorMessage = 'Failed to fetch employees'
        try {
          const errorData = await res.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Ignore json parse error
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      return data.employees as EmployeeData
    },
  })
}
