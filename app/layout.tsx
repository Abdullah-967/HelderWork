import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/lib/providers/query-provider'
import { AuthProvider } from '@/lib/providers/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import { CommandMenu } from '@/components/layout/command-menu'

export const metadata: Metadata = {
  title: 'HelderWerk - Shift Management',
  description: 'Modern shift management and scheduling platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <CommandMenu />
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
