'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function PendingApprovalPage() {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  const supabase = createClient()
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    // Check current approval status
    const checkApproval = async () => {
      if (loading) return

      if (!user) {
        router.push('/auth/login')
        return
      }

      if (user.is_approved) {
        setApproved(true)
        setTimeout(() => {
          router.push('/employee/dashboard')
        }, 2000)
      }
    }

    checkApproval()
  }, [user, loading, router])

  useEffect(() => {
    // Subscribe to approval status changes
    if (!user?.id) return

    const channel = supabase
      .channel('approval-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).is_approved) {
            setApproved(true)
            setTimeout(() => {
              router.push('/employee/dashboard')
            }, 2000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <h3 className="text-xl font-semibold">Approved!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your account has been approved. Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Approval Pending</CardTitle>
          <CardDescription>
            Your account is awaiting approval from your manager
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="font-medium">Waiting for manager approval</p>
              <p className="text-sm text-muted-foreground">
                Your manager has been notified. You'll be redirected automatically
                once approved.
              </p>
            </div>
          </div>

          {user && (
            <div className="rounded-md bg-muted p-4 space-y-1">
              <p className="text-sm font-medium">Account Details:</p>
              <p className="text-sm text-muted-foreground">
                Name: {user.full_name}
              </p>
              <p className="text-sm text-muted-foreground">Email: {user.email}</p>
            </div>
          )}

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
