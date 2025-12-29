import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import type { UpdateProfileFormData } from '@/lib/utils/validation'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: UpdateProfileFormData) => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      return res.json()
    },
    onSuccess: () => {
      // Invalidate both potential profile queries
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Since AuthProvider also fetches user profile, we might need a way to trigger its update 
      // but usually the onAuthStateChange or just refreshing will work.
      // However, TanStack Query is what many components use.
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
