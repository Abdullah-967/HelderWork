import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const publishSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  is_published: z.boolean(),
})

export async function POST(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const body = await request.json()
    const validation = publishSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { week_start, is_published } = validation.data

    // Check if board exists to preserve preferences or set defaults
    const { data: existingBoard } = await supabase
      .from('shift_boards')
      .select('preferences, requests_window_start, requests_window_end')
      .eq('workplace_id', workplaceId)
      .eq('week_start_date', week_start)
      .single()

    const defaultPreferences = {
        closed_days: ['friday'],
        number_of_shifts_per_day: 2,
    }

    // When publishing, fetch all shifts for the week to create content snapshot
    let content = {}
    if (is_published) {
      // Calculate week end date (6 days after start)
      const weekStartDate = new Date(week_start)
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekStartDate.getDate() + 6)
      const weekEndStr = weekEndDate.toISOString().split('T')[0]

      // Fetch all shifts with their assignments for this week
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          id,
          shift_date,
          shift_part,
          shift_workers (
            id,
            user_id,
            assigned_at,
            comment,
            users (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('workplace_id', workplaceId)
        .gte('shift_date', week_start)
        .lte('shift_date', weekEndStr)
        .order('shift_date', { ascending: true })

      if (shiftsError) {
        return NextResponse.json(
          { error: 'Failed to fetch shifts for publishing: ' + shiftsError.message },
          { status: 500 }
        )
      }

      // Create content snapshot with assignments
      content = {
        shifts: shifts || [],
        published_at: new Date().toISOString(),
        published_by: user.id,
        total_shifts: shifts?.length || 0,
        total_assignments: shifts?.reduce((acc, shift) => acc + (shift.shift_workers?.length || 0), 0) || 0
      }
    }

    // Set default request window if not exists (7 days before week starts)
    let requestsWindowStart = existingBoard?.requests_window_start
    let requestsWindowEnd = existingBoard?.requests_window_end

    if (!requestsWindowStart || !requestsWindowEnd) {
      const weekStartDate = new Date(week_start)
      const defaultWindowStart = new Date(weekStartDate)
      defaultWindowStart.setDate(weekStartDate.getDate() - 7) // 7 days before
      const defaultWindowEnd = new Date(weekStartDate)
      defaultWindowEnd.setDate(weekStartDate.getDate() - 1) // 1 day before

      requestsWindowStart = requestsWindowStart || defaultWindowStart.toISOString()
      requestsWindowEnd = requestsWindowEnd || defaultWindowEnd.toISOString()
    }

    // Upsert the shift board status
    const { data, error } = await supabase
      .from('shift_boards')
      .upsert(
        {
          workplace_id: workplaceId,
          week_start_date: week_start,
          is_published: is_published,
          preferences: existingBoard?.preferences || defaultPreferences,
          content: is_published ? content : {}, // Only store content when publishing
          requests_window_start: requestsWindowStart,
          requests_window_end: requestsWindowEnd,
        },
        {
          onConflict: 'workplace_id,week_start_date',
        }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, shift_board: data })
  })
}

export async function GET(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('week_start')

    if (!weekStart) {
      return NextResponse.json(
        { error: 'week_start parameter is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('shift_boards')
      .select('*')
      .eq('workplace_id', workplaceId)
      .eq('week_start_date', weekStart)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ shift_board: data || null })
  })
}