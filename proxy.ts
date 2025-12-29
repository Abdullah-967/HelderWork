import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protected routes check
  const isManagerRoute = path.startsWith('/manager')
  const isEmployeeRoute = path.startsWith('/employee')
  const isAuthRoute = path.startsWith('/auth')
  const isApiRoute = path.startsWith('/api')

  if ((isManagerRoute || isEmployeeRoute) && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && !isApiRoute) {
    // Fetch profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('is_manager, is_approved, workplace_id')
      .eq('id', user.id)
      .maybeSingle()

    // 1. Incomplete profile check
    if (!profile || !profile.workplace_id) {
      if (path !== '/auth/complete-profile' && !path.startsWith('/api') && path !== '/auth/login' && path !== '/auth/signup' && path !== '/api/auth/callback') {
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      }
    } 
    // 2. Manager accessing employee routes or vice versa
    else if (isManagerRoute && !profile.is_manager) {
      return NextResponse.redirect(new URL('/employee/dashboard', request.url))
    } 
    else if (isEmployeeRoute && profile.is_manager) {
      return NextResponse.redirect(new URL('/manager/dashboard', request.url))
    }
    // 3. Unapproved employee check
    else if (isEmployeeRoute && !profile.is_approved && !profile.is_manager) {
        if (path !== '/auth/pending-approval') {
            return NextResponse.redirect(new URL('/auth/pending-approval', request.url))
        }
    }
    // 4. Redirect logged in users away from auth/landing pages (except signout, complete-profile, and pending-approval)
    else if ((isAuthRoute || path === '/') && profile.workplace_id && path !== '/auth/signout') {
        const isCompleteProfile = path === '/auth/complete-profile'
        const isPendingApproval = path === '/auth/pending-approval'

        if (profile.is_manager) {
            const target = '/manager/dashboard'
            if (path !== target && !isCompleteProfile) {
                return NextResponse.redirect(new URL(target, request.url))
            }
        } else if (profile.is_approved) {
            const target = '/employee/dashboard'
            if (path !== target && !isCompleteProfile) {
                return NextResponse.redirect(new URL(target, request.url))
            }
        } else {
            const target = '/auth/pending-approval'
            if (path !== target && !isCompleteProfile) {
                return NextResponse.redirect(new URL(target, request.url))
            }
        }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}