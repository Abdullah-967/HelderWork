'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useProfile } from '@/lib/hooks/use-profile'
import { useUpdateProfile } from '@/lib/mutations/profile'
import { useAuth } from '@/lib/providers/auth-provider'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { User, Mail, Building, ShieldCheck, Save, LogOut } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/utils/validation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile()
  const updateProfile = useUpdateProfile()
  const { signOut } = useAuth()
  const router = useRouter()
  
  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: '',
      avatar_url: '',
    },
  })

  useEffect(() => {
    if (profile) {
      console.log('Profile loaded:', profile)
      form.reset({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url || '',
      })
    }
  }, [profile, form])

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile.mutate(data)
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '??'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 space-y-6 relative z-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto max-w-2xl py-20 text-center space-y-4 relative z-0">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <User className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {error ? 'Error loading profile' : 'Profile not found'}
        </h2>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "We couldn't load your profile information. Please try logging in again."}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} variant="default">
            Retry
          </Button>
          <Button onClick={() => signOut()} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    )
  }

  // Handle the case where workplaces might be an array or a single object due to Supabase join types
  const workplace = Array.isArray(profile.workplaces) 
    ? profile.workplaces[0] 
    : profile.workplaces;

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <Button variant="destructive" onClick={() => router.push('/auth/signout')} size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 relative z-0">
        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/10">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-xl bg-primary/5 text-primary">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={profile.is_manager ? "default" : "secondary"} className="h-5">
                    {profile.is_manager ? 'Manager' : 'Employee'}
                  </Badge>
                  {profile.is_approved ? (
                    <Badge variant="outline" className="h-5 bg-green-50 text-green-700 border-green-200">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-5 bg-orange-50 text-orange-700 border-orange-200">
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-2">
             <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <Building className="h-4 w-4 text-primary" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Workplace</p>
                   <p className="text-sm font-semibold">{workplace?.business_name || 'No workplace assigned'}</p>
                </div>
             </div>
             
             <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Username</p>
                   <p className="text-sm font-semibold">@{profile.username}</p>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your display name and avatar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/avatar.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Link to a profile picture
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}