import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import type { ShiftFormData, BulkShiftsFormData } from '@/lib/utils/validation'

/**
 * Create a single shift
 */
export function useCreateShift() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: ShiftFormData) => {
      const res = await fetch('/api/manager/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create shift')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({
        title: 'Success',
        description: 'Shift created successfully',
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

/**
 * Create multiple shifts
 */
export function useCreateBulkShifts() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: BulkShiftsFormData) => {
      const res = await fetch('/api/manager/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create shifts')
      }

      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({
        title: 'Success',
        description: `${data.shifts?.length || 0} shifts created successfully`,
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

/**
 * Delete a shift
 */
export function useDeleteShift() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const res = await fetch(`/api/manager/shifts/${shiftId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete shift')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({
        title: 'Success',
        description: 'Shift deleted successfully',
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

/**
 * Assign worker to shift with optimistic updates
 */
export function useAssignWorker() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      shiftId,
      userId,
      comment,
    }: {
      shiftId: string
      userId: string
      comment?: string
    }) => {
      const res = await fetch(`/api/manager/shifts/${shiftId}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'add',
          comment: comment || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to assign worker')
      }

      return res.json()
    },
    onMutate: async ({ shiftId, userId, comment }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shifts'] })

      // Snapshot previous value
      const previousShifts = queryClient.getQueryData(['shifts'])

      // Optimistically update
      queryClient.setQueryData(['shifts'], (old: any) => {
        if (!old) return old

        return old.map((shift: any) =>
          shift.id === shiftId
            ? {
                ...shift,
                shift_workers: [
                  ...(shift.shift_workers || []),
                  {
                    id: `temp-${Date.now()}`,
                    user_id: userId,
                    shift_id: shiftId,
                    comment: comment || null,
                  },
                ],
              }
            : shift
        )
      })

      return { previousShifts }
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousShifts) {
        queryClient.setQueryData(['shifts'], context.previousShifts)
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      // Invalidate employee shifts to reflect new assignments
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] })
      toast({
        title: 'Success',
        description: 'Worker assigned to shift',
      })
    },
  })
}

/**
 * Remove worker from shift with optimistic updates
 */
export function useRemoveWorker() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      shiftId,
      userId,
    }: {
      shiftId: string
      userId: string
    }) => {
      const res = await fetch(`/api/manager/shifts/${shiftId}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'remove' }),
      })

      if (!res.ok) {
        throw new Error('Failed to remove worker')
      }

      return res.json()
    },
    onMutate: async ({ shiftId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ['shifts'] })

      const previousShifts = queryClient.getQueryData(['shifts'])

      queryClient.setQueryData(['shifts'], (old: any) => {
        if (!old) return old

        return old.map((shift: any) =>
          shift.id === shiftId
            ? {
                ...shift,
                shift_workers: shift.shift_workers.filter(
                  (sw: any) => sw.user_id !== userId
                ),
              }
            : shift
        )
      })

      return { previousShifts }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousShifts) {
        queryClient.setQueryData(['shifts'], context.previousShifts)
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      // Invalidate employee shifts to reflect removed assignments
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] })
      toast({
        title: 'Success',
        description: 'Worker removed from shift',
      })
    },
  })
}

/**
 * Publish or unpublish a schedule week
 */
export function usePublishSchedule() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      weekStart,
      isPublished,
    }: {
      weekStart: string
      isPublished: boolean
    }) => {
      const res = await fetch('/api/manager/schedule/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart, is_published: isPublished }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update schedule status')
      }

      return res.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate shift board query for managers
      queryClient.invalidateQueries({ queryKey: ['shift-board', variables.weekStart] })
      // Invalidate employee shifts query to show newly published assignments
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] })
      // Invalidate manager shifts query to refresh any cached data
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      toast({
        title: 'Success',
        description: `Schedule ${variables.isPublished ? 'published' : 'unpublished'} successfully`,
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

/**
 * Update comment for a shift-worker assignment
 */
export function useUpdateWorkerComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      shiftId,
      workerId,
      comment,
    }: {
      shiftId: string
      workerId: string
      comment: string
    }) => {
      const res = await fetch(`/api/manager/shifts/${shiftId}/workers/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update comment')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] })
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
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
