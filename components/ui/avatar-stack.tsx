'use client'

import * as React from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Worker {
  id: string
  name: string
  role?: string
  initials: string
  comment?: string
}

interface AvatarStackProps {
  workers: Worker[]
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  onWorkerClick?: (worker: Worker) => void
  className?: string
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
}

const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

export function AvatarStack({
  workers,
  maxVisible = 3,
  size = 'sm',
  onWorkerClick,
  className,
}: AvatarStackProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const visibleWorkers = workers.slice(0, maxVisible)
  const hiddenCount = workers.length - maxVisible
  const hasOverflow = hiddenCount > 0

  if (workers.length === 0) {
    return null
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex items-center', className)}>
        <motion.div
          className="flex items-center"
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
          initial={false}
        >
          <AnimatePresence mode="popLayout">
            {(isExpanded ? workers : visibleWorkers).map((worker, index) => (
              <motion.div
                key={worker.id}
                layout
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  marginLeft: index === 0 ? 0 : -8,
                }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={springTransition}
                className="relative"
                style={{ zIndex: Math.min(20, workers.length - index) }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.15, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={springTransition}
                      onClick={() => onWorkerClick?.(worker)}
                      className={cn(
                        'cursor-pointer',
                        onWorkerClick && 'active:ring-2 active:ring-primary/50'
                      )}
                    >
                      <Avatar
                        className={cn(
                          sizeClasses[size],
                          'ring-2 ring-background shadow-md hover:ring-primary/30 transition-all'
                        )}
                      >
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold">
                          {worker.initials}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[220px] p-3"
                    sideOffset={8}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold leading-tight">{worker.name}</p>
                      {worker.role && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {worker.role}
                        </p>
                      )}
                      {worker.comment && (
                        <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t leading-snug">
                          {worker.comment}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}

            {/* Overflow Counter */}
            {!isExpanded && hasOverflow && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  marginLeft: -8,
                }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={springTransition}
                className="relative"
                style={{ zIndex: 0 }}
              >
                <motion.div
                  whileHover={{ scale: 1.15, y: -2 }}
                  transition={springTransition}
                >
                  <div
                    className={cn(
                      sizeClasses[size],
                      'flex items-center justify-center rounded-full bg-muted/80 ring-2 ring-background shadow-md font-bold text-muted-foreground'
                    )}
                  >
                    <span className="text-[10px]">+{hiddenCount}</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
