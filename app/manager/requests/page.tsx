'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRequests } from '@/lib/hooks/use-requests'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'

export default function RequestsPage() {
  const { data: requests, isLoading } = useRequests()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Invalid Date'
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Availability Requests</h1>
        <p className="text-muted-foreground">
          Review employee shift preferences and availability
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <CardDescription>Employee availability submissions</CardDescription>
          </div>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{requests?.length || 0}</div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
      >
        {requests && requests.length === 0 ? (
          <motion.div variants={slideUpVariants}>
            <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold mb-2">No requests yet</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Employees haven't submitted availability requests. They can submit requests from their dashboard.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          requests?.map((request) => (
            <motion.div
              key={request.id}
              variants={slideUpVariants}
              whileHover={hoverLiftVariants.hover}
              transition={fastTransition}
            >
              <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={request.users.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(request.users.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.users.full_name}</CardTitle>
                    <CardDescription>{request.users.email}</CardDescription>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last updated: {formatDate(request.updated_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm whitespace-pre-wrap">{request.requests}</p>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}
