import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'

export async function GET(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    const { data: requests, error } = await supabase
      .from('user_requests')
      .select(`
        id,
        requests,
        updated_at,
        created_at,
        user_id,
        users (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('workplace_id', workplaceId)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests })
  })
}
