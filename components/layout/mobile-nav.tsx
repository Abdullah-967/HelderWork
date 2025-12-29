'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'
import { Calendar, Users, FileText, Settings, LayoutDashboard, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const isManager = user.is_manager

  const managerLinks = [
    { href: '/manager/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/manager/employees', label: 'Team', icon: Users },
    { href: '/manager/schedule', label: 'Schedule', icon: Calendar },
    { href: '/manager/requests', label: 'Requests', icon: FileText },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const employeeLinks = [
    { href: '/employee/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/employee/shifts', label: 'Shifts', icon: Calendar },
    { href: '/employee/requests', label: 'Requests', icon: FileText },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const links = isManager ? managerLinks : employeeLinks

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className={cn(
        "grid gap-1 p-2",
        isManager ? "grid-cols-5" : "grid-cols-4"
      )}>
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
