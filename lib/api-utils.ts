import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

import type { User } from '@/types/database'

/**
 * Wrapper for API routes that require basic authentication (no workplace check)
 */
export async function withBasicAuth(
  handler: (user: User, supabase: Awaited<ReturnType<typeof createClient>>) => Promise<NextResponse>
) {
  try {
    const supabase = await createClient()

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from database using Admin Client to bypass RLS
    const supabaseAdmin = await createAdminClient()
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'User profile incomplete',
          message: 'Please complete your profile to access this feature',
          redirect: '/auth/complete-profile',
          code: 'PROFILE_INCOMPLETE'
        },
        { status: 404 }
      )
    }

    return handler(user, supabase)
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Wrapper for API routes that require authentication and a workplace
 */
export async function withAuth(
  handler: (user: User, supabase: Awaited<ReturnType<typeof createClient>>) => Promise<NextResponse>
) {
  return withBasicAuth(async (user, supabase) => {
    // Check if profile has required fields
    if (!user.workplace_id) {
      return NextResponse.json(
        {
          error: 'Profile setup incomplete',
          message: 'Please complete your profile by selecting a workplace',
          redirect: '/auth/complete-profile',
          code: 'WORKPLACE_MISSING'
        },
        { status: 400 }
      )
    }

    return handler(user, supabase)
  })
}

/**
 * Wrapper for API routes that require manager authentication
 */
export async function withManagerAuth(
  handler: (
    user: User,
    supabase: Awaited<ReturnType<typeof createClient>>,
    workplaceId: string
  ) => Promise<NextResponse>
) {
  return withAuth(async (user, supabase) => {
    if (!user.is_manager) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 })
    }

    if (!user.workplace_id) {
      return NextResponse.json({ error: 'No workplace associated' }, { status: 400 })
    }

    return handler(user, supabase, user.workplace_id)
  })
}

/**
 * Wrapper for API routes that require employee authentication
 */
export async function withEmployeeAuth(
  handler: (
    user: User,
    supabase: Awaited<ReturnType<typeof createClient>>,
    workplaceId: string
  ) => Promise<NextResponse>
) {
  return withAuth(async (user, supabase) => {
    if (user.is_manager) {
      return NextResponse.json({ error: 'Forbidden - Employee access only' }, { status: 403 })
    }

    if (!user.is_approved) {
      return NextResponse.json({ error: 'Account pending approval' }, { status: 403 })
    }

    if (!user.workplace_id) {
      return NextResponse.json({ error: 'No workplace associated' }, { status: 400 })
    }

    return handler(user, supabase, user.workplace_id)
  })
}

/**
 * Standard error response
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Standard success response
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}
