'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/providers/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Building2, Mail, User, Calendar } from 'lucide-react'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workplace and preferences
        </p>
      </div>

      {/* Profile Information */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
      >
        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal and workplace details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </div>
              <p className="text-sm">{user.full_name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </div>
              <p className="text-sm">{user.email}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Role
              </div>
              <Badge>{user.is_manager ? 'Manager' : 'Employee'}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Joined
              </div>
              <p className="text-sm">
                {user.created_at && new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </motion.div>

        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card>
            <CardHeader>
              <CardTitle>Workplace</CardTitle>
              <CardDescription>Your workplace details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Workplace ID
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {user.workplace_id}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUpVariants}>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>More Settings Coming Soon</CardTitle>
              <CardDescription>
                Additional workplace preferences, notification settings, and more
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
