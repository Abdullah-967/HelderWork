'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/providers/auth-provider'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // If auth is loaded and user exists, redirect to appropriate dashboard
    if (!loading && user) {
      if (!user.workplace_id) {
        router.push('/auth/complete-profile')
      } else if (user.is_manager) {
        router.push('/manager/dashboard')
      } else if (user.is_approved) {
        router.push('/employee/dashboard')
      } else {
        router.push('/auth/pending-approval')
      }
    }
  }, [user, loading, router])

  // Show nothing or a minimal splash while checking auth to avoid flash of content
  if (loading || user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50">Loading...</div>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50">
      <div className="text-center max-w-2xl space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to <span className="text-primary">HelderWerk</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Modern shift management and scheduling platform for teams
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}