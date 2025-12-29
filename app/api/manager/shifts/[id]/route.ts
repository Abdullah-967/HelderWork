import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { z } from 'zod'

const updateShiftSchema = z.object({
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD").optional(),
  shift_part: z.enum(['morning', 'noon', 'evening']).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
  
) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const body = await request.json()
    const validation = updateShiftSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }
    const { id } = await params;
    const { data, error } = await supabase
      .from('shifts')
      .update(validation.data)
      .eq('id', id)
      .eq('workplace_id', workplaceId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, shift: data })
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise <{id: string}> }
) {

  return withManagerAuth(async (user, supabase, workplaceId) => {
    // open the Promise
    const { id } = await params;
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id)
      .eq('workplace_id', workplaceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  })
}
