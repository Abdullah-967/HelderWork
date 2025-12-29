import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    // Initialize admin client to bypass RLS recursion on users table
    const supabaseAdmin = await createAdminClient()

    // Get all employees in the manager's workplace
    const { data: employees, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, full_name, is_approved, is_active, created_at, avatar_url, workplace_id')
      .eq('workplace_id', workplaceId)
      .eq('is_manager', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching employees:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Separate approved and pending employees
    const approved = employees.filter((e) => e.is_approved)
    const pending = employees.filter((e) => !e.is_approved)

    return NextResponse.json({
      employees: {
        approved,
        pending,
        total: employees.length,
      },
    })
  })
}
