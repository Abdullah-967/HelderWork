import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const generateSchema = z.object({
  target_week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  source_week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
})

export async function POST(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const body = await request.json()
    const validation = generateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { target_week_start, source_week_start } = validation.data

    // Calculate time difference to shift dates
    const targetDate = new Date(target_week_start)
    const sourceDate = new Date(source_week_start)
    const diffTime = targetDate.getTime() - sourceDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // 1. Get source shifts
    const sourceEnd = new Date(sourceDate)
    sourceEnd.setDate(sourceEnd.getDate() + 6)

    const { data: sourceShifts, error: fetchError } = await supabase
      .from('shifts')
      .select('shift_date, shift_part')
      .eq('workplace_id', workplaceId)
      .gte('shift_date', source_week_start)
      .lte('shift_date', sourceEnd.toISOString().split('T')[0])

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!sourceShifts || sourceShifts.length === 0) {
      return NextResponse.json({
        message: 'No shifts found in source week',
        count: 0,
        shifts: []
      })
    }

    // 2. Prepare new shifts
    const newShifts = sourceShifts.map((shift) => {
      const oldDate = new Date(shift.shift_date)
      const newDate = new Date(oldDate)
      newDate.setDate(newDate.getDate() + diffDays)

      return {
        workplace_id: workplaceId,
        shift_date: newDate.toISOString().split('T')[0],
        shift_part: shift.shift_part,
      }
    })

    // 3. Insert new shifts (Upsert to avoid duplicates)
    // Note: ignoreDuplicates: true is handled via onConflict DO NOTHING behavior in SQL,
    // but in Supabase JS v2, upsert with ignoreDuplicates: true does this.
    const { data: insertedShifts, error: insertError } = await supabase
      .from('shifts')
      .upsert(newShifts, {
        onConflict: 'workplace_id,shift_date,shift_part',
        ignoreDuplicates: true 
      })
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: insertedShifts?.length || 0,
      shifts: insertedShifts,
    })
  })
}
