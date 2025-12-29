import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'

/**
 * Approve employee with optimistic updates
 */
export function useApproveEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetch(`/api/manager/employees/${employeeId}/approve`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to approve employee')
      }

      return res.json()
    },
    onMutate: async (employeeId) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] })

      const previousEmployees = queryClient.getQueryData(['employees'])

      // Optimistically update
      queryClient.setQueryData(['employees'], (old: any) => {
        if (!old) return old

        const employeeToApprove = old.pending.find(
          (e: any) => e.id === employeeId
        )

        if (!employeeToApprove) return old

        return {
          ...old,
          approved: [...old.approved, { ...employeeToApprove, is_approved: true }],
          pending: old.pending.filter((e: any) => e.id !== employeeId),
          total: old.total,
        }
      })

      return { previousEmployees }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees'], context.previousEmployees)
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast({
        title: 'Success',
        description: 'Employee approved successfully',
      })
    },
  })
}

/**
 * Reject employee with optimistic updates
 */
export function useRejectEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetch(`/api/manager/employees/${employeeId}/reject`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reject employee')
      }

      return res.json()
    },
    onMutate: async (employeeId) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] })

      const previousEmployees = queryClient.getQueryData(['employees'])

      // Optimistically remove from pending
      queryClient.setQueryData(['employees'], (old: any) => {
        if (!old) return old

        return {
          ...old,
          pending: old.pending.filter((e: any) => e.id !== employeeId),
          total: old.total - 1,
        }
      })

      return { previousEmployees }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees'], context.previousEmployees)
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast({
        title: 'Success',
        description: 'Employee rejected and removed',
      })
    },
  })
}
