import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const updateCommentSchema = z.object({
  comment: z.string(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  const { id: shiftId, workerId } = await params

  return withManagerAuth(async (user, supabase, workplaceId) => {
    // Verify shift belongs to manager's workplace
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('workplace_id')
      .eq('id', shiftId)
      .single()

    if (shiftError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (shift.workplace_id !== workplaceId) {
      return NextResponse.json(
        { error: 'Shift does not belong to your workplace' },
        { status: 403 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = updateCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { comment } = validation.data

    // Update the comment for the shift_worker assignment
    const { data, error } = await supabase
      .from('shift_workers')
      .update({ comment })
      .eq('id', workerId)
      .eq('shift_id', shiftId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Worker assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, assignment: data })
  })
}
