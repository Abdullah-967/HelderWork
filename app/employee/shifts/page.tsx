'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMyShifts } from '@/lib/hooks/use-shifts'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, RefreshCw } from 'lucide-react'
import { formatDate, addDays } from '@/lib/utils'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'

export default function ShiftsPage() {
  const { data: shifts, isLoading, refetch, isRefetching } = useMyShifts()

  const getShiftBadgeColor = (part: string) => {
    const colors = {
      morning: 'bg-blue-100 text-blue-900 border-blue-300',
      noon: 'bg-amber-100 text-amber-900 border-amber-300',
      evening: 'bg-purple-100 text-purple-900 border-purple-300',
    }
    return colors[part as keyof typeof colors] || ''
  }

  const getShiftTime = (part: string) => {
    const times = {
      morning: '8:00 AM',
      noon: '2:00 PM',
      evening: '8:00 PM',
    }
    return times[part as keyof typeof times] || part
  }

  const groupedShifts = shifts?.reduce((acc, shift) => {
    const date = shift.shift_date
    if (!acc[date]) acc[date] = []
    acc[date].push(shift)
    return acc
  }, {} as Record<string, typeof shifts>)

  const sortedDates = Object.keys(groupedShifts || {}).sort()

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Shifts</h1>
          <p className="text-muted-foreground">
            View your assigned shifts and schedule
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching || isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <CardDescription>All assigned shifts</CardDescription>
          </div>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{shifts?.length || 0}</div>
        </CardContent>
      </Card>

      {/* Shifts List */}
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
      >
        {!groupedShifts || sortedDates.length === 0 ? (
          <motion.div variants={slideUpVariants}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No shifts assigned</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for your schedule
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          sortedDates.map((date) => {
            const dayShifts = groupedShifts[date]
            const todayStr = formatDate(new Date())
            const isToday = date === todayStr
            const isPast = date < todayStr

            return (
              <motion.div
                key={date}
                variants={slideUpVariants}
                whileHover={hoverLiftVariants.hover}
                transition={fastTransition}
              >
                <Card className={isToday ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </CardTitle>
                      {isToday && (
                        <Badge className="mt-1">Today</Badge>
                      )}
                      {isPast && !isToday && (
                        <Badge variant="outline" className="mt-1 opacity-50">Past</Badge>
                      )}
                    </div>
                    <Badge variant="outline">
                      {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.assignment_id}
                        className="flex flex-col gap-2 p-3 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium capitalize">{shift.shift_part}</p>
                              <p className="text-sm text-muted-foreground">
                                {getShiftTime(shift.shift_part)}
                              </p>
                            </div>
                          </div>
                          <Badge className={getShiftBadgeColor(shift.shift_part)}>
                            {shift.shift_part}
                          </Badge>
                        </div>

                        {/* Show comment if exists */}
                        {shift.comment && (
                          <div className="mt-2 rounded-md bg-muted/50 p-3 border-l-2 border-primary">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Manager Notes:</p>
                            <p className="text-sm whitespace-pre-wrap">{shift.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
