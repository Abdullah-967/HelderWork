import { useQuery } from '@tanstack/react-query'

export interface UserRequest {
  id: string
  requests: string
  updated_at: string
  created_at: string
  user_id: string
  users: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

/**
 * Fetch all employee requests (manager view)
 */
export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const res = await fetch('/api/manager/requests')

      if (!res.ok) {
        throw new Error('Failed to fetch requests')
      }

      const data = await res.json()
      return data.requests as UserRequest[]
    },
  })
}

/**
 * Fetch employee's own requests
 */
export function useMyRequests() {
  return useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const res = await fetch('/api/employee/requests')

      if (!res.ok) {
        throw new Error('Failed to fetch requests')
      }

      const data = await res.json()
      return data.requests as UserRequest[]
    },
  })
}
