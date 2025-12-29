import { z } from 'zod'

/**
 * Complete profile form (auth signup)
 */
export const profileSchema = z.object({
  role: z.enum(['manager', 'employee'], {
    message: 'Please select a role',
  }),
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be less than 100 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .optional(),
  inviteCode: z.string().optional(),
}).refine((data) => {
  if (data.role === 'manager') {
    return !!data.inviteCode && data.inviteCode.length > 0
  }
  return true
}, {
  message: 'Invite code is required for managers',
  path: ['inviteCode'],
})

export type ProfileFormData = z.infer<typeof profileSchema>

/**
 * Employee availability request
 */
export const requestSchema = z.object({
  requests: z
    .string()
    .min(10, 'Please provide at least 10 characters describing your availability')
    .max(1000, 'Request must be less than 1000 characters'),
})

export type RequestFormData = z.infer<typeof requestSchema>

/**
 * Create single shift
 */
export const shiftSchema = z.object({
  shift_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  shift_part: z.enum(['morning', 'noon', 'evening'], {
    message: 'Please select a shift time',
  }),
  user_id: z.string().uuid('Invalid user ID').optional(),
  comment: z.string().optional(),
})

export type ShiftFormData = z.infer<typeof shiftSchema>

/**
 * Create multiple shifts
 */
export const bulkShiftsSchema = z.object({
  shifts: z.array(shiftSchema).min(1, 'At least one shift is required'),
})

export type BulkShiftsFormData = z.infer<typeof bulkShiftsSchema>

/**
 * Workplace preferences
 */
export const preferencesSchema = z.object({
  closed_days: z.array(z.string()).default([]),
  number_of_shifts_per_day: z
    .number()
    .min(1, 'At least 1 shift per day')
    .max(10, 'Maximum 10 shifts per day'),
})

export type PreferencesFormData = z.infer<typeof preferencesSchema>

/**
 * Request window (employee request submission window)
 */
export const requestWindowSchema = z
  .object({
    requests_window_start: z.string().datetime('Invalid start date/time'),
    requests_window_end: z.string().datetime('Invalid end date/time'),
  })
  .refine(
    (data) => {
      const start = new Date(data.requests_window_start)
      const end = new Date(data.requests_window_end)
      return end > start
    },
    {
      message: 'End time must be after start time',
      path: ['requests_window_end'],
    }
  )

export type RequestWindowFormData = z.infer<typeof requestWindowSchema>

/**
 * Assign worker to shift
 */
export const assignWorkerSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  action: z.enum(['add', 'remove']),
})

export type AssignWorkerFormData = z.infer<typeof assignWorkerSchema>

/**
 * User profile update
 */
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .optional(),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

/**
 * Generate shifts from template
 */
export const generateShiftsSchema = z
  .object({
    source_week_start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    target_week_start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  })
  .refine(
    (data) => {
      // Ensure both dates are Sundays
      const source = new Date(data.source_week_start)
      const target = new Date(data.target_week_start)
      return source.getDay() === 0 && target.getDay() === 0
    },
    {
      message: 'Both dates must be Sundays (week start)',
      path: ['target_week_start'],
    }
  )

export type GenerateShiftsFormData = z.infer<typeof generateShiftsSchema>
