import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const assignWorkerSchema = z.object({
  user_id: z.string().uuid(),
  action: z.enum(['add', 'remove']),
  comment: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shiftId } = await params

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
    const validation = assignWorkerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { user_id, action, comment } = validation.data

    // Verify worker belongs to workplace
    const { data: worker, error: workerError } = await supabase
      .from('users')
      .select('workplace_id, is_approved')
      .eq('id', user_id)
      .single()

    if (workerError || !worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    if (worker.workplace_id !== workplaceId) {
      return NextResponse.json(
        { error: 'Worker does not belong to your workplace' },
        { status: 403 }
      )
    }

    if (!worker.is_approved) {
      return NextResponse.json(
        { error: 'Worker is not approved yet' },
        { status: 400 }
      )
    }

    if (action === 'add') {
      // Add worker to shift
      const { data, error } = await supabase
        .from('shift_workers')
        .insert({
          shift_id: shiftId,
          user_id: user_id,
          comment: comment || null,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'Worker is already assigned to this shift' },
            { status: 400 }
          )
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, assignment: data })
    } else {
      // Remove worker from shift
      const { error } = await supabase
        .from('shift_workers')
        .delete()
        .eq('shift_id', shiftId)
        .eq('user_id', user_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Worker removed from shift' })
    }
  })
}
