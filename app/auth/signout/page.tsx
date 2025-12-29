'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/providers/auth-provider'

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Failed to sign out:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <LogOut className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign Out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out of your account?
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          You will need to enter your credentials again to access your dashboard and schedule.
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            variant="destructive" 
            className="w-full h-11 text-base font-semibold"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Yes, Sign Out'}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full flex items-center gap-2"
            onClick={() => router.back()}
            disabled={isSigningOut}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
