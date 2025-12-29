'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEmployees } from '@/lib/hooks/use-employees'
import { useApproveEmployee, useRejectEmployee } from '@/lib/mutations/employees'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, XCircle, Mail, AlertTriangle, Users } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'

export default function EmployeesPage() {
  const { data: employeesData, isLoading, isError, error } = useEmployees()
  const approveEmployee = useApproveEmployee()
  const rejectEmployee = useRejectEmployee()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const handleApprove = (employeeId: string) => {
    approveEmployee.mutate(employeeId)
  }

  const handleRejectClick = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = () => {
    if (selectedEmployeeId) {
      rejectEmployee.mutate(selectedEmployeeId)
      setRejectDialogOpen(false)
      setSelectedEmployeeId(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-4 text-lg font-semibold">Failed to load employees</h3>
          <p className="mt-2 text-muted-foreground">
            {(error as Error)?.message || 'There was an error loading your team members. Please try again later.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage your team members and approve new employees
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({employeesData?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({employeesData?.approved.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending ({employeesData?.pending.length || 0})
            {(employeesData?.pending.length || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {employeesData?.pending.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Employees */}
        <TabsContent value="all" className="space-y-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle>All Team Members</CardTitle>
                <CardDescription>
                  View all employees in your workplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!employeesData?.total ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold mb-2">No employees yet</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Share your business name with team members to get started. They can sign up and request to join your workplace.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employeesData?.pending.map((employee) => (
                      <motion.div
                        key={employee.id}
                        variants={slideUpVariants}
                        whileHover={hoverLiftVariants.hover}
                        transition={fastTransition}
                        className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200"
                      >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          {!employee.workplace_id && (
                            <div className="flex items-center gap-1 text-xs text-yellow-700 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              Incomplete profile
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-orange-100 text-orange-900 border-orange-300">
                          Pending
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(employee.id)}
                          disabled={approveEmployee.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(employee.id)}
                          disabled={rejectEmployee.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </motion.div>
                  ))}

                  {employeesData?.approved.map((employee) => (
                    <motion.div
                      key={employee.id}
                      variants={slideUpVariants}
                      whileHover={hoverLiftVariants.hover}
                      transition={fastTransition}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          {!employee.workplace_id && (
                            <div className="flex items-center gap-1 text-xs text-yellow-700 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              Incomplete profile
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-900 border-green-300">
                        Approved
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Approved Employees */}
        <TabsContent value="approved" className="space-y-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle>Approved Employees</CardTitle>
                <CardDescription>
                  {employeesData?.approved.length || 0} approved team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!employeesData?.approved?.length ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold mb-2">No approved employees yet</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Approve pending employees to add them to your team.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employeesData?.approved.map((employee) => (
                      <motion.div
                        key={employee.id}
                        variants={slideUpVariants}
                        whileHover={hoverLiftVariants.hover}
                        transition={fastTransition}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          {!employee.workplace_id && (
                            <div className="flex items-center gap-1 text-xs text-yellow-700 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              Incomplete profile
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-900 border-green-300">
                        Approved
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Pending Employees */}
        <TabsContent value="pending" className="space-y-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
          >
            <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                {employeesData?.pending.length || 0} employees awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!employeesData?.pending?.length ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold mb-2">No pending approvals</p>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    All employees have been approved. New signups will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employeesData?.pending.map((employee) => (
                    <motion.div
                      key={employee.id}
                      variants={slideUpVariants}
                      whileHover={hoverLiftVariants.hover}
                      transition={fastTransition}
                      className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          {!employee.workplace_id ? (
                            <div className="flex items-center gap-1 text-xs text-yellow-700 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              Incomplete profile
                            </div>
                          ) : employee.created_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined {new Date(employee.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(employee.id)}
                          disabled={approveEmployee.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(employee.id)}
                          disabled={rejectEmployee.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently reject and remove this employee from your workplace.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
