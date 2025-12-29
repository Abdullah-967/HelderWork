'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileFormData } from '@/lib/utils/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

export default function CompleteProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: undefined,
      businessName: '',
      fullName: '',
      inviteCode: '',
    },
  })

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      // Check if user already has a workplace_id (profile already complete)
      const { data: dbUser } = await supabase
        .from('users')
        .select('workplace_id, is_manager, is_approved')
        .eq('id', session.user.id)
        .maybeSingle()

      if (dbUser?.workplace_id) {
        // Profile already complete - redirect to appropriate dashboard
        if (dbUser.is_manager) {
          router.push('/manager/dashboard')
        } else if (dbUser.is_approved) {
          router.push('/employee/dashboard')
        } else {
          router.push('/auth/pending-approval')
        }
        return
      }

      // Pre-fill email-based username if available
      if (session.user.email) {
        const displayName = session.user.user_metadata?.full_name || ''
        form.setValue('fullName', displayName)
      }
    }

    checkAuth()
  }, [router, form, supabase])

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to complete profile')
      }

      // FIX: Trust the form selection for the redirect. 
      // Employees are ALWAYS pending initially.
      if (data.role === 'manager') {
        router.push('/manager/dashboard')
      } else {
        router.push('/auth/pending-approval')
      }
      
      // Refresh router cache to ensure new auth state is picked up
      router.refresh()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const role = form.watch('role')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manager">
                          Manager (creating a new workplace)
                        </SelectItem>
                        <SelectItem value="employee">
                          Employee (joining existing workplace)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {role === 'manager' && (
                <FormField
                  control={form.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invite Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your invite code" {...field} />
                      </FormControl>
                      <FormDescription>
                        Required for creating a new workplace.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {role === 'manager' ? 'Business Name' : 'Business Name (to join)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          role === 'manager'
                            ? 'Acme Corporation'
                            : 'Enter exact business name'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {role === 'manager'
                        ? 'This will be your workplace name'
                        : 'Enter the exact name provided by your manager'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating profile...' : 'Continue'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
