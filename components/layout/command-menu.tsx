'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  User,
  LogOut,
} from 'lucide-react'

export function CommandMenu() {
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const managerCommands = [
    {
      label: 'Dashboard',
      href: '/manager/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Schedule Board',
      href: '/manager/schedule',
      icon: Calendar,
    },
    {
      label: 'Employees',
      href: '/manager/employees',
      icon: Users,
    },
    {
      label: 'View Requests',
      href: '/manager/requests',
      icon: FileText,
    },
    {
      label: 'Settings',
      href: '/manager/settings',
      icon: Settings,
    },
  ]

  const employeeCommands = [
    {
      label: 'Dashboard',
      href: '/employee/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Shifts',
      href: '/employee/shifts',
      icon: Calendar,
    },
    {
      label: 'Submit Request',
      href: '/employee/requests',
      icon: FileText,
    },
  ]

  const commonCommands = [
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
    },
  ]

  const commands = user?.is_manager ? managerCommands : employeeCommands

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.map((cmd) => {
            const Icon = cmd.icon
            return (
              <CommandItem
                key={cmd.href}
                onSelect={() => runCommand(() => router.push(cmd.href))}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{cmd.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          {commonCommands.map((cmd) => {
            const Icon = cmd.icon
            return (
              <CommandItem
                key={cmd.href}
                onSelect={() => runCommand(() => router.push(cmd.href))}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{cmd.label}</span>
              </CommandItem>
            )
          })}
          <CommandItem
            onSelect={() => runCommand(() => router.push('/auth/signout'))}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
