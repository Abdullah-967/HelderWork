import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const requestWindowSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requests_window_start: z.string().datetime(),
  requests_window_end: z.string().datetime(),
})

export async function PUT(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const body = await request.json()
    const validation = requestWindowSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { week_start, requests_window_start, requests_window_end } = validation.data

    // Validate that end is after start
    if (new Date(requests_window_end) <= new Date(requests_window_start)) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Upsert shift board with request window
    const { data, error } = await supabase
      .from('shift_boards')
      .upsert(
        {
          workplace_id: workplaceId,
          week_start_date: week_start,
          requests_window_start,
          requests_window_end,
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
