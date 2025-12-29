import { useQuery } from '@tanstack/react-query'

export interface Workplace {
  id: string
  name: string
  business_name: string
  manager_id: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  username: string
  avatar_url: string | null
  is_manager: boolean
  is_approved: boolean
  workplace_id: string | null
  created_at: string
  workplaces?: Workplace
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile')

      if (!res.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await res.json()
      return data.profile as UserProfile
    },
  })
}
