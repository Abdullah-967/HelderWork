import { NextResponse } from 'next/server'
import { withBasicAuth } from '@/lib/api-utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  return withBasicAuth(async (user, supabase) => {
    // The 'user' object from withBasicAuth is already fetched via Admin Client
    // so it has all fields including workplace_id without RLS restrictions.

    let profile = { ...user, workplaces: null as any }

    // If user has a workplace, fetch it using Admin Client to ensure we get the data
    // bypassing any potential RLS complexity with joins
    if (user.workplace_id) {
      const supabaseAdmin = await createAdminClient()
      const { data: workplace, error: workplaceError } = await supabaseAdmin
        .from('workplaces')
        .select('id, name, business_name, manager_id')
        .eq('id', user.workplace_id)
        .single()
      
      if (!workplaceError && workplace) {
        // Return as single object or array depending on what frontend expects.
        // Frontend handles both, but let's stick to the structure implied by the join.
        // Since we are manually attaching, we can just pass the object.
        profile.workplaces = workplace
      } else {
        console.error('Error fetching workplace for profile:', workplaceError)
      }
    }

    return NextResponse.json({ profile })
  })
}

export async function PUT(request: Request) {
  return withBasicAuth(async (user, supabase) => {
    const body = await request.json()
    const { full_name, avatar_url } = body

    const updates: any = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  })
}
