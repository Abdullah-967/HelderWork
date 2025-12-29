import { NextResponse } from 'next/server'
import { withEmployeeAuth } from '@/lib/api-utils'
import { z } from 'zod'
import { Database } from '@/types/database'

const submitRequestSchema = z.object({
  requests: z.string().min(1, 'Request cannot be empty'),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function GET(request: Request) {
  return withEmployeeAuth(async (user, supabase, workplaceId) => {
    const { data: userRequests, error } = await supabase
      .from('user_requests')
      .select(`
        *,
        users (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .eq('workplace_id', workplaceId)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests: userRequests })
  })
}

export async function POST(request: Request) {
  return withEmployeeAuth(async (user, supabase, workplaceId) => {
    const body = await request.json()
    const validation = submitRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { requests } = validation.data

    // Upsert user request
    const { data, error } = await supabase
      .from('user_requests')
      .upsert(
        {
          user_id: user.id,
          workplace_id: workplaceId,
          requests: requests,
          // updated_at is handled by DB trigger
        },
        {
          onConflict: 'user_id,workplace_id',
        }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  })
}