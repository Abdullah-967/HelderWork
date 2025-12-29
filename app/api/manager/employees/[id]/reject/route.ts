import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  return withManagerAuth(async (user, supabase, workplaceId) => {
    const supabaseAdmin = await createAdminClient()

    // Verify employee belongs to manager's workplace
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('workplace_id, is_manager, is_approved')
      .eq('id', id)
      .single()

    if (fetchError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (employee.workplace_id !== workplaceId) {
      return NextResponse.json(
        { error: 'Employee does not belong to your workplace' },
        { status: 403 }
      )
    }

    if (employee.is_manager) {
      return NextResponse.json(
        { error: 'Cannot reject a manager account' },
        { status: 400 }
      )
    }

    // Delete the user (reject)
    const { error } = await supabaseAdmin.from('users').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Employee rejected and removed' })
  })
}
