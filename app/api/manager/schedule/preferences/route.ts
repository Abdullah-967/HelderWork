import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const preferencesSchema = z.object({
  closed_days: z.array(z.string()),
  number_of_shifts_per_day: z.number().int().min(1).max(10),
})

export async function GET(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('week_start')

    if (!weekStart) {
      return NextResponse.json(
        { error: 'week_start parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    const { data: shiftBoard, error } = await supabase
      .from('shift_boards')
      .select('id, preferences, is_published, requests_window_start, requests_window_end')
      .eq('workplace_id', workplaceId)
      .eq('week_start_date', weekStart)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No shift board found for this week
        return NextResponse.json({
          preferences: {
            closed_days: ['friday'],
            number_of_shifts_per_day: 2,
          },
          exists: false,
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      preferences: shiftBoard.preferences || {
        closed_days: ['friday'],
        number_of_shifts_per_day: 2,
      },
      is_published: shiftBoard.is_published,
      requests_window_start: shiftBoard.requests_window_start,
      requests_window_end: shiftBoard.requests_window_end,
      exists: true,
    })
  })
}

export async function PUT(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const body = await request.json()
    const { week_start, preferences } = body

    if (!week_start) {
      return NextResponse.json(
        { error: 'week_start is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    const validation = preferencesSchema.safeParse(preferences)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: validation.error.issues },
        { status: 400 }
      )
    }

    // Upsert shift board with preferences
    const { data, error } = await supabase
      .from('shift_boards')
      .upsert(
        {
          workplace_id: workplaceId,
          week_start_date: week_start,
          preferences: validation.data,
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
