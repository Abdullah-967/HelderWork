'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useShifts, useShiftBoard } from '@/lib/hooks/use-shifts'
import { useEmployees } from '@/lib/hooks/use-employees'
import { useCreateShift, useAssignWorker, useRemoveWorker, usePublishSchedule, useDeleteShift, useUpdateWorkerComment } from '@/lib/mutations/shifts'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Users,
  Upload,
  Globe,
  Trash2,
  Pencil,
  MoreVertical,
  Calendar as CalendarIcon,
  MessageSquare,
  UserPlus,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, getWeekStart, addDays, getShortDayName, getShortDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'motion/react'
import { hoverLiftVariants, fastTransition, staggerContainerVariants, slideUpVariants } from '@/lib/utils/motion'
import { AvatarStack } from '@/components/ui/avatar-stack'

const SHIFT_PARTS = [
  {
    value: 'morning',
    label: 'Morning',
    time: '8:00 AM',
    color: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  {
    value: 'noon',
    label: 'Noon',
    time: '2:00 PM',
    color: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    value: 'evening',
    label: 'Evening',
    time: '8:00 PM',
    color: 'bg-purple-100 text-purple-900 border-purple-300'
  },
] as const

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const weekStartStr = formatDate(weekStart)
  const weekEndStr = formatDate(addDays(weekStart, 6))

  const { data: shifts, isLoading: shiftsLoading } = useShifts({
    start_date: weekStartStr,
    end_date: weekEndStr,
  })

  const { data: shiftBoard, isLoading: boardLoading } = useShiftBoard(weekStartStr)

  const { data: employeesData } = useEmployees()
  const createShift = useCreateShift()
  const assignWorker = useAssignWorker()
  const removeWorker = useRemoveWorker()
  const publishSchedule = usePublishSchedule()
  const deleteShift = useDeleteShift()
  const updateWorkerComment = useUpdateWorkerComment()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedPart, setSelectedPart] = useState<'morning' | 'noon' | 'evening'>('morning')
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('none')
  const [newShiftComment, setNewShiftComment] = useState<string>('')
  const [workerComments, setWorkerComments] = useState<Record<string, string>>({})
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [pendingAssignment, setPendingAssignment] = useState<{
    shiftId: string
    userId: string
    workerName: string
  } | null>(null)
  const [assignmentComment, setAssignmentComment] = useState('')
  
  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7))
  }

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  const goToCurrentWeek = () => {
    setWeekStart(getWeekStart())
  }

  const handlePublishToggle = () => {
    const isPublished = !!shiftBoard?.is_published
    publishSchedule.mutate({
      weekStart: weekStartStr,
      isPublished: !isPublished
    })
  }

  const getShiftForDateAndPart = (date: Date, part: string) => {
    const dateStr = formatDate(date)
    return shifts?.find((s) => s.shift_date === dateStr && s.shift_part === (part as any))
  }
  
  const handleCreateShift = () => {
    if (!selectedDate || !selectedPart) return

    createShift.mutate(
      {
        shift_date: selectedDate,
        shift_part: selectedPart,
        user_id: selectedWorkerId === 'none' ? undefined : selectedWorkerId,
        comment: newShiftComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false)
          setSelectedDate('')
          setSelectedWorkerId('none')
          setNewShiftComment('')
        },
      }
    )
  }

  const handleAssignWorker = (shiftId: string, userId: string, comment?: string) => {
    assignWorker.mutate({ shiftId, userId, comment })
  }

  const handleRemoveWorker = (shiftId: string, userId: string) => {
    removeWorker.mutate({ shiftId, userId })
  }

  const handleDeleteShift = (shiftId: string) => {
    setShiftToDelete(shiftId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteShift = () => {
    if (shiftToDelete) {
      deleteShift.mutate(shiftToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setShiftToDelete(null)
        },
      })
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

  return (
    <div className="space-y-6 relative z-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Board</h1>
          <p className="text-muted-foreground">
            Plan shifts and manage team assignments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={shiftBoard?.is_published ? "outline" : "default"}
            size="sm"
            onClick={handlePublishToggle}
            disabled={boardLoading || publishSchedule.isPending}
            className={`h-9 ${shiftBoard?.is_published ? 'bg-green-100 text-green-900 border-green-300 hover:bg-green-200' : ''}`}
          >
            {shiftBoard?.is_published ? (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Published
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publish Schedule
              </>
            )}
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-2" />
                Create Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Shift</DialogTitle>
                <DialogDescription>
                  Define a new shift and optionally assign a worker.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="date" className="text-sm font-medium">Date</label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger id="date">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDates.map((date) => (
                        <SelectItem key={formatDate(date)} value={formatDate(date)}>
                          {getShortDayName(date)}, {getShortDate(date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="time" className="text-sm font-medium">Shift Time</label>
                  <Select
                    value={selectedPart}
                    onValueChange={(v) => setSelectedPart(v as 'morning' | 'noon' | 'evening')}
                  >
                    <SelectTrigger id="time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_PARTS.map((part) => (
                        <SelectItem key={part.value} value={part.value}>
                          {part.label} ({part.time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="worker" className="text-sm font-medium">Assign Worker (Optional)</label>
                  <Select
                    value={selectedWorkerId}
                    onValueChange={setSelectedWorkerId}
                  >
                    <SelectTrigger id="worker">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {employeesData?.approved.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="comment" className="text-sm font-medium">Comment (Optional)</label>
                  <Textarea
                    id="comment"
                    value={newShiftComment}
                    onChange={(e) => setNewShiftComment(e.target.value)}
                    placeholder="Add instructions or notes..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateShift}
                disabled={!selectedDate || createShift.isPending}
                className="w-full"
              >
                {createShift.isPending ? 'Creating...' : 'Create Shift'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">
                  {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
              >
                Current Week
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {shiftsLoading ? (
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-8 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
              <table className="w-full border-collapse">
                <thead className="border-0">
                  <tr className="border-0">
                    {/* Top-Left Corner: Consistent with shift column */}
                    <th className="w-[120px] sticky left-0 top-0 z-50 bg-background/95 backdrop-blur-md border-b-4 border-muted/20 shadow-sm border-r border-white/5">
                      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-r from-transparent via-background/50 to-background pointer-events-none"></div>
                    </th>

                    {/* Day Headers: Bottom-Aligned & Floating - Consistently Sticky */}
                    {weekDates.map((date) => (
                      <th
                        key={formatDate(date)}
                        className="
                          h-[80px]
                          min-w-[220px]
                          sticky top-0 z-50
                          bg-background/95 backdrop-blur-md
                          border-b-4 border-muted/20
                          text-center
                          align-bottom
                          shadow-sm
                          border-l border-white/5 first:border-l-0
                        "
                      >
                        <div className="flex flex-col items-center justify-end h-full w-full pb-4 gap-1">
                          <span className="text-xs font-bold uppercase text-muted-foreground">
                            {getShortDayName(date)}
                          </span>
                          <span className="text-lg font-bold">
                            {getShortDate(date)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="border-t-0">
                  {SHIFT_PARTS.map((part, partIndex) => (
                    <tr key={part.value} className={`group border-b last:border-0 hover:bg-primary/[0.02] transition-colors ${partIndex === 0 ? 'border-t-0' : ''}`}>
                      <td className="p-4 sticky left-0 z-40 bg-background/95 backdrop-blur-sm border-r border-white/5 relative">
                        <div className="flex flex-col gap-1.5 relative z-10">
                          <span className="text-sm font-bold uppercase text-foreground">{part.label}</span>
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {part.time}
                          </span>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-r from-transparent via-background/50 to-background pointer-events-none"></div>
                      </td>
                      {weekDates.map((date) => {
                        const shift = getShiftForDateAndPart(date, part.value)

                        return (
                          <td key={`${formatDate(date)}-${part.value}`} className="p-3 align-top relative border-l border-white/5 first:border-l-0 odd:bg-muted/[0.02] [container-type:inline-size]">
                            {shift ? (
                              <motion.div
                                variants={slideUpVariants}
                                whileHover={hoverLiftVariants.hover}
                                transition={fastTransition}
                                className="flex flex-col gap-3 p-4 bg-background border rounded-lg shadow-sm hover:border-primary transition-all group/shift relative overflow-hidden"
                              >
                                {/* Shift Header Actions */}
                                <div className="flex items-center justify-between flex-shrink-0">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Live</span>
                                  </div>
                                  <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/shift:opacity-100 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-lg">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-white/10 backdrop-blur-xl bg-background/95 z-50">
                                      <DropdownMenuLabel className="text-xs font-bold uppercase px-2 py-1.5">Shift Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator className="bg-white/5" />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                                        onClick={() => handleDeleteShift(shift.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        <span className="text-xs font-bold">Delete Shift</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Scrollable Content Area - Refined with Container Queries */}
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar @[180px]:space-y-4">
                                  {/* Assigned Workers - Avatar Stack with dynamic layout */}
                                  {shift.shift_workers.length > 0 && (
                                    <div className="flex flex-col @[200px]:flex-row @[200px]:items-center justify-between gap-3 flex-shrink-0 p-2 bg-muted/30 rounded-xl border border-white/5">
                                      <AvatarStack
                                        workers={shift.shift_workers.map((sw) => ({
                                          id: sw.id,
                                          name: sw.users.full_name,
                                          initials: getInitials(sw.users.full_name),
                                          comment: sw.comment || undefined,
                                        }))}
                                        maxVisible={3}
                                        size="md"
                                      />

                                      {/* Worker Management Dropdown */}
                                      <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 bg-background/50 hover:bg-background rounded-lg shadow-sm"
                                          >
                                            <Users className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 max-h-[300px] overflow-y-auto z-50 rounded-2xl border-white/10 backdrop-blur-xl bg-background/95 p-2 shadow-2xl">
                                          <DropdownMenuLabel className="text-xs font-bold uppercase px-2 py-1.5">Manage Workers</DropdownMenuLabel>
                                          <DropdownMenuSeparator className="bg-white/5" />
                                          {shift.shift_workers.map((sw) => (
                                            <DropdownMenuItem
                                              key={sw.id}
                                              className="flex items-center justify-between gap-3 py-2 px-2 rounded-xl focus:bg-primary/5 transition-colors mb-1 last:mb-0"
                                              onSelect={(e) => e.preventDefault()}
                                            >
                                              <div className="flex items-center gap-2 overflow-hidden">
                                                <Avatar className="h-7 w-7 shrink-0 ring-2 ring-background">
                                                  <AvatarFallback className="text-xs bg-primary/5 text-primary font-bold">
                                                    {getInitials(sw.users.full_name)}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-bold truncate">{sw.users.full_name}</span>
                                              </div>
                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                <Popover modal={true}>
                                                  <PopoverTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary">
                                                      <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-72 p-4 z-50 rounded-2xl border-white/10 backdrop-blur-xl bg-background/95 shadow-2xl">
                                                    <div className="space-y-4">
                                                      <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-bold text-primary">Edit Instructions</h4>
                                                        <span className="text-xs font-medium text-muted-foreground">{sw.users.full_name}</span>
                                                      </div>
                                                      <Textarea
                                                        placeholder="Add shift-specific tasks..."
                                                        defaultValue={sw.comment || ''}
                                                        onChange={(e) => setWorkerComments({ ...workerComments, [sw.id]: e.target.value })}
                                                        className="min-h-[100px] text-xs font-medium rounded-xl border-white/10 bg-muted/20 focus:bg-background transition-all resize-none"
                                                      />
                                                      <Button
                                                        size="sm"
                                                        className="w-full h-9 text-sm font-bold rounded-xl"
                                                        onClick={() => {
                                                          updateWorkerComment.mutate({
                                                            shiftId: shift.id,
                                                            workerId: sw.id,
                                                            comment: workerComments[sw.id] || sw.comment || '',
                                                          })
                                                        }}
                                                        disabled={updateWorkerComment.isPending}
                                                      >
                                                        {updateWorkerComment.isPending ? 'Saving...' : 'Update Note'}
                                                      </Button>
                                                    </div>
                                                  </PopoverContent>
                                                </Popover>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                  onClick={() => handleRemoveWorker(shift.id, sw.user_id)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}

                                  {/* Add Worker Button - Refined */}
                                  {employeesData && employeesData.approved.length > 0 && (
                                    <Select
                                      onValueChange={(userId) => {
                                        const worker = employeesData.approved.find(emp => emp.id === userId)
                                        if (worker) {
                                          setPendingAssignment({
                                            shiftId: shift.id,
                                            userId,
                                            workerName: worker.full_name,
                                          })
                                          setAssignDialogOpen(true)
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-9 border-none bg-muted/30 text-xs font-bold uppercase hover:bg-primary/10 hover:text-primary transition-all rounded-xl flex-shrink-0 focus:ring-2 focus:ring-primary focus:ring-offset-1">
                                        <div className="flex items-center gap-2">
                                          <UserPlus className="h-3.5 w-3.5" />
                                          <SelectValue placeholder="Add Teammate" />
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent className="z-50 rounded-xl border-white/10 backdrop-blur-xl">
                                        {employeesData.approved
                                          .filter(
                                            (emp) =>
                                              !shift.shift_workers.some((sw) => sw.user_id === emp.id)
                                          )
                                          .map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id} className="text-xs font-bold rounded-lg py-2">
                                              {emp.full_name}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </motion.div>
                            ) : (
                              <div
                                className="h-full min-h-[140px] flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => {
                                  setSelectedDate(formatDate(date))
                                  setSelectedPart(part.value)
                                  setCreateDialogOpen(true)
                                }}
                              >
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Add Shift</span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
      >
        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts?.length || 0}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts?.reduce((acc, s) => acc + s.shift_workers.length, 0) || 0}</div>
              <p className="text-xs text-muted-foreground">Total worker assignments</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Team</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeesData?.approved.length || 0}</div>
              <p className="text-xs text-muted-foreground">Approved employees</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUpVariants} whileHover={hoverLiftVariants.hover} transition={fastTransition}>
          <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts?.length ? Math.round((shifts.reduce((acc, s) => acc + s.shift_workers.length, 0) / shifts.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Average shift coverage</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Assignment Comment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
            <DialogDescription>
              Assigning <span className="font-bold text-primary">{pendingAssignment?.workerName}</span> to this shift.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="assign-comment" className="text-sm font-medium">Instructions (Optional)</label>
              <Textarea
                id="assign-comment"
                placeholder="Specific tasks or notes for this worker..."
                value={assignmentComment}
                onChange={(e) => setAssignmentComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false)
                setPendingAssignment(null)
                setAssignmentComment('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingAssignment) {
                  handleAssignWorker(
                    pendingAssignment.shiftId,
                    pendingAssignment.userId,
                    assignmentComment
                  )
                  setAssignDialogOpen(false)
                  setPendingAssignment(null)
                  setAssignmentComment('')
                }
              }}
              disabled={assignWorker.isPending}
            >
              {assignWorker.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Shift
            </DialogTitle>
            <DialogDescription>
              This will remove the shift and all its assignments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setShiftToDelete(null)
              }}
              disabled={deleteShift.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteShift}
              disabled={deleteShift.isPending}
            >
              {deleteShift.isPending ? 'Deleting...' : 'Delete Shift'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
