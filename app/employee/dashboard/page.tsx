'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMyShifts } from '@/lib/hooks/use-shifts'
import { Calendar, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, addDays } from '@/lib/utils'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'

export default function EmployeeDashboard() {
  const { data: shifts, isLoading } = useMyShifts({
    start_date: formatDate(new Date()),
    end_date: formatDate(addDays(new Date(), 30)),
  })

  const todayStr = formatDate(new Date())
  const upcomingShifts = shifts?.filter(s => s.shift_date >= todayStr).slice(0, 5) || []
  const nextShift = upcomingShifts[0]

  const getShiftLabel = (part: string) => {
    const labels = {
      morning: 'Morning (8:00 AM)',
      noon: 'Noon (2:00 PM)',
      evening: 'Evening (8:00 PM)',
    }
    return labels[part as keyof typeof labels] || part
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your schedule overview.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
      >
        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{upcomingShifts.length}</div>
                  <p className="text-xs text-muted-foreground">Next 30 days</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{shifts?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">All assigned shifts</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Shift</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : nextShift ? (
                <>
                  <div className="text-xl font-bold">
                    {new Date(nextShift.shift_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {nextShift.shift_part}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No upcoming shifts</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...fastTransition, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Button asChild className="h-auto flex-col gap-2 p-6">
              <Link href="/employee/shifts">
                <Calendar className="h-8 w-8" />
                <span className="text-sm font-medium">View Schedule</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-6">
              <Link href="/employee/requests">
                <FileText className="h-8 w-8" />
                <span className="text-sm font-medium">Submit Request</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-6">
              <Link href="/profile">
                <TrendingUp className="h-8 w-8" />
                <span className="text-sm font-medium">Profile</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Shifts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Shifts</CardTitle>
          <CardDescription>Your next scheduled shifts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : upcomingShifts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No upcoming shifts</p>
              <p className="text-sm">Check back later for your schedule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div
                  key={shift.assignment_id}
                  className="flex flex-col gap-2 p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {new Date(shift.shift_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getShiftLabel(shift.shift_part)}
                      </p>
                    </div>
                    <Badge className="capitalize">{shift.shift_part}</Badge>
                  </div>

                  {/* Show comment if exists */}
                  {shift.comment && (
                    <div className="mt-1 rounded-md bg-muted/50 p-2 border-l-2 border-primary">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Manager Notes:</p>
                      <p className="text-sm italic">{shift.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
