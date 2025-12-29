import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import type { User } from '@/types/database'
import { generateUsername } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  // Default to 'signup' if state is missing or invalid
  let state = requestUrl.searchParams.get('state')
  if (!state || (state !== 'login' && state !== 'signup')) {
    state = 'signup'
  }

  if (code) {
    const supabase = await createClient()
    
    // 1. Exchange Code for Session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Auth callback error:', sessionError)
      return NextResponse.redirect(`${origin}/auth/${state}?error=auth_failed`)
    }

    // 2. Get Authenticated User
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Failed to get user after session exchange:', userError)
      return NextResponse.redirect(`${origin}/auth/${state}?error=user_fetch_failed`)
    }

    // 3. Initialize Admin Client to Bypass RLS
    // We use this to reliably check if the profile exists, ignoring permissions
    const supabaseAdmin = await createAdminClient()

    let { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('is_manager, is_approved, workplace_id')
      .eq('id', user.id)
      .maybeSingle()

    if (dbError) {
      console.error('Database error fetching user profile:', dbError)
      return NextResponse.redirect(`${origin}/auth/${state}?error=db_fetch_failed`)
    }

    // 4. AUTO-HEAL: If profile is missing, create it now
    // This handles the Race Condition where the Trigger hasn't finished yet
    if (!dbUser) {
      console.log('Profile missing (race condition?), performing auto-heal...')
      const metadata = user.user_metadata
      
      const { error: createError } = await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email!,
        username: generateUsername(user.email || `user_${user.id}`),
        // Robust fallback for name:
        full_name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User',
        is_manager: false,
        is_active: true,
        is_approved: false,
        google_id: metadata.sub || null,
        avatar_url: metadata.avatar_url || null,
      })

      // If insert failed (e.g. duplicate key), it means the trigger beat us to it. 
      // That's fine! Just re-fetch the user.
      if (createError && createError.code !== '23505') {
         console.error('Auto-heal failed:', createError)
         return NextResponse.redirect(`${origin}/auth/${state}?error=profile_creation_failed`)
      }

      // Re-fetch the user to get the fresh record
      const { data: retryUser, error: retryError } = await supabaseAdmin
        .from('users')
        .select('is_manager, is_approved, workplace_id')
        .eq('id', user.id)
        .maybeSingle()
        
      if (retryError || !retryUser) {
        console.error('Failed to re-fetch user after auto-heal:', retryError)
        return NextResponse.redirect(`${origin}/auth/${state}?error=profile_fetch_failed`)
      }
      dbUser = retryUser
    }

    // 5. Final Safety Check
    if (!dbUser) {
      return NextResponse.redirect(`${origin}/auth/${state}?error=unknown_error`)
    }

    // 6. Routing Logic based on Profile State
    
    // A. Profile exists but is incomplete (no workplace)
    if (!dbUser.workplace_id) {
      return NextResponse.redirect(`${origin}/auth/complete-profile`)
    }

    // B. Profile is complete - Send to Dashboard
    // Use explicit checks to avoid any truthy/falsy confusion
    if (dbUser.is_manager === true) {
      return NextResponse.redirect(`${origin}/manager/dashboard`)
    } else if (dbUser.is_approved === true) {
      return NextResponse.redirect(`${origin}/employee/dashboard`)
    } else {
      // Default for unapproved employees
      return NextResponse.redirect(`${origin}/auth/pending-approval`)
    }
  }

  // Fallback for missing code
  return NextResponse.redirect(`${origin}/auth/${state}`)
}