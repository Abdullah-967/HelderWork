import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const createShiftSchema = z.object({
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift_part: z.enum(['morning', 'noon', 'evening']),
  user_id: z.string().uuid().optional(),
  comment: z.string().optional(),
})

const createMultipleShiftsSchema = z.object({
  shifts: z.array(createShiftSchema),
})

export async function GET(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('shifts')
      .select(`
        id,
        shift_date,
        shift_part,
        created_at,
        shift_workers (
          id,
          user_id,
          comment,
          users (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('workplace_id', workplaceId)
      .order('shift_date', { ascending: true })

    if (startDate) {
      query = query.gte('shift_date', startDate)
    }

    if (endDate) {
      query = query.lte('shift_date', endDate)
    }

    const { data: shifts, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ shifts })
  })
}

export async function POST(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const body = await request.json()

    // Check if it's a single shift or multiple shifts
    if (body.shifts && Array.isArray(body.shifts)) {
      // Multiple shifts
      const validation = createMultipleShiftsSchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      const shiftsToCreate = validation.data.shifts.map((shift) => ({
        workplace_id: workplaceId,
        shift_date: shift.shift_date,
        shift_part: shift.shift_part,
      }))

      const { data, error } = await supabase
        .from('shifts')
        .upsert(shiftsToCreate, {
          onConflict: 'workplace_id,shift_date,shift_part',
          ignoreDuplicates: true
        })
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, shifts: data })
    } else {
      // Single shift
      const validation = createShiftSchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { shift_date, shift_part, user_id, comment } = validation.data

      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          workplace_id: workplaceId,
          shift_date,
          shift_part,
        })
        .select()
        .single()

      if (shiftError) {
        if (shiftError.code === '23505') {
          return NextResponse.json(
            { error: 'Shift already exists for this date and time' },
            { status: 400 }
          )
        }
        return NextResponse.json({ error: shiftError.message }, { status: 500 })
      }

      // If user_id is provided, assign the worker
      if (user_id) {
        const { error: workerError } = await supabase
          .from('shift_workers')
          .insert({
            shift_id: shift.id,
            user_id: user_id,
            comment: comment || null,
          })

        if (workerError) {
          // We don't rollback the shift creation, but we should probably inform the user
          return NextResponse.json({ 
            success: true, 
            shift, 
            warning: 'Shift created but failed to assign worker: ' + workerError.message 
          })
        }
      }

      return NextResponse.json({ success: true, shift })
    }
  })
}
