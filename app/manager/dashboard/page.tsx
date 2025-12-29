'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEmployees } from '@/lib/hooks/use-employees'
import { useShifts } from '@/lib/hooks/use-shifts'
import { useRequests } from '@/lib/hooks/use-requests'
import { Users, Calendar, FileText, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'

export default function ManagerDashboard() {
  const { data: employeesData, isLoading: employeesLoading } = useEmployees()
  const { data: shifts, isLoading: shiftsLoading } = useShifts({
    start_date: formatDate(new Date()),
    end_date: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // Next 7 days
  })
  const { data: requests, isLoading: requestsLoading } = useRequests()

  const pendingCount = employeesData?.pending.length || 0
  const approvedCount = employeesData?.approved.length || 0
  const upcomingShiftsCount = shifts?.length || 0
  const requestsCount = requests?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your workplace.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
      >
        <motion.div
          variants={slideUpVariants}
          whileHover={hoverLiftVariants.hover}
          transition={fastTransition}
        >
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{pendingCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingCount === 1 ? 'employee' : 'employees'} awaiting approval
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={slideUpVariants}
          whileHover={hoverLiftVariants.hover}
          transition={fastTransition}
        >
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{approvedCount}</div>
                  <p className="text-xs text-muted-foreground">approved employees</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={slideUpVariants}
          whileHover={hoverLiftVariants.hover}
          transition={fastTransition}
        >
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{upcomingShiftsCount}</div>
                  <p className="text-xs text-muted-foreground">next 7 days</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={slideUpVariants}
          whileHover={hoverLiftVariants.hover}
          transition={fastTransition}
        >
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shift Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{requestsCount}</div>
                  <p className="text-xs text-muted-foreground">employee availability requests</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...fastTransition, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-auto flex-col gap-2 p-6">
              <Link href="/manager/schedule">
                <Calendar className="h-8 w-8" />
                <span className="text-sm font-medium">Manage Schedule</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-6">
              <Link href="/manager/employees">
                <Users className="h-8 w-8" />
                <span className="text-sm font-medium">View Employees</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-6">
              <Link href="/manager/requests">
                <FileText className="h-8 w-8" />
                <span className="text-sm font-medium">View Requests</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col gap-2 p-6">
              <Link href="/manager/settings">
                <TrendingUp className="h-8 w-8" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.3 }}
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">Action Required</CardTitle>
              <CardDescription className="text-orange-700">
                You have {pendingCount} {pendingCount === 1 ? 'employee' : 'employees'} waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/manager/employees">
                  Review Pending Employees
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
