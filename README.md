# HelderWerk - Shift Management Platform

A modern shift management and scheduling SaaS platform built with Next.js 16+ and Supabase.

## Tech Stack

- **Frontend**: Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Authentication**: Google OAuth via Supabase Auth with invite-based manager registration
- **Database**: PostgreSQL with Row Level Security (RLS)
- **API**: Next.js API Routes (RESTful)
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: Radix UI, Framer Motion
- **Form Validation**: React Hook Form, Zod
- **Notifications**: Sonner (toast notifications)

## Features

### For Managers
- **Invite-based registration** - Secure manager signup with single-use invite codes
- **Create and manage workplace** - Set business name and workplace preferences
- **Employee management** - Approve/reject employee registrations
- **Dashboard statistics** - View pending approvals, team size, upcoming shifts, and pending requests
- **Shift scheduling**:
  - Create single or bulk shifts (morning/noon/evening)
  - **Auto-generate schedules** from previous weeks
  - Update/delete individual shifts
  - Assign/remove workers to/from shifts
- **Schedule publishing**:
  - **Publish/Unpublish** weekly schedules to control employee visibility
  - Create schedule snapshots for published weeks
  - Privacy-first: employees only see published future schedules
- **Request management**:
  - View all employee shift availability requests
  - Set request submission windows (date ranges)
- **Workplace settings**:
  - Configure closed days
  - Set shifts per day
  - Manage request windows

### For Employees
- **Registration flow** - Join workplace via business name, pending manager approval
- **Dashboard statistics** - View upcoming shifts, total shifts, and pending requests
- **View assigned shifts** - Respects privacy (only shows published weeks or past shifts)
- **Submit shift availability requests** - Natural language text requests within allowed windows
- **Profile management** - Update full name and avatar
- **View shift calendar** - 30-day default view with date filtering

## Project Structure

```
helderwerk/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts       # OAuth callback with auto-healing
│   │   │   ├── signup/route.ts         # Profile completion & invite validation
│   │   │   └── signout/route.ts        # Sign out
│   │   ├── manager/
│   │   │   ├── employees/
│   │   │   │   ├── route.ts            # List employees
│   │   │   │   └── [id]/
│   │   │   │       ├── approve/route.ts# Approve employee
│   │   │   │       └── reject/route.ts # Reject employee
│   │   │   ├── shifts/
│   │   │   │   ├── route.ts            # Create/Get shifts
│   │   │   │   ├── generate/route.ts   # Auto-generate from previous week
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts        # Update/Delete shift
│   │   │   │       └── workers/
│   │   │   │           ├── route.ts    # Assign/remove workers
│   │   │   │           └── [workerId]/route.ts # Individual assignment
│   │   │   ├── requests/route.ts       # View employee requests
│   │   │   └── schedule/
│   │   │       ├── preferences/route.ts# Workplace preferences
│   │   │       ├── publish/route.ts    # Publish/unpublish schedule
│   │   │       ├── request-window/route.ts # Request window settings
│   │   │       ├── start-date/route.ts # Week start date
│   │   │       └── assignments/route.ts# Batch assignments
│   │   ├── employee/
│   │   │   ├── shifts/route.ts         # View assigned shifts (privacy-aware)
│   │   │   └── requests/route.ts       # Submit/view requests
│   │   └── profile/route.ts            # User profile GET/PUT
│   ├── auth/
│   │   ├── login/page.tsx              # Google OAuth login
│   │   ├── signup/page.tsx             # Role selection
│   │   ├── complete-profile/page.tsx   # Profile completion form
│   │   ├── pending-approval/page.tsx   # Employee waiting for approval
│   │   └── signout/page.tsx            # Sign out confirmation
│   ├── manager/
│   │   ├── layout.tsx                  # Manager layout with navbar
│   │   ├── dashboard/page.tsx          # Manager dashboard with stats
│   │   ├── employees/page.tsx          # Employee management
│   │   ├── schedule/page.tsx           # Weekly schedule editor
│   │   ├── requests/page.tsx           # View shift requests
│   │   └── settings/page.tsx           # Workplace settings
│   ├── employee/
│   │   ├── layout.tsx                  # Employee layout with navbar
│   │   ├── dashboard/page.tsx          # Employee dashboard with stats
│   │   ├── shifts/page.tsx             # View assigned shifts
│   │   └── requests/page.tsx           # Submit shift requests
│   ├── profile/page.tsx                # User profile editor
│   ├── globals.css                     # Global styles
│   ├── layout.tsx                      # Root layout with providers
│   └── page.tsx                        # Home/landing page
├── components/
│   ├── layout/
│   │   ├── navbar.tsx                  # Main navigation (role-aware)
│   │   ├── mobile-nav.tsx              # Mobile navigation
│   │   └── command-menu.tsx            # Command palette
│   └── ui/                             # Radix UI components
│       ├── button.tsx, input.tsx, card.tsx
│       ├── form.tsx, dialog.tsx, toast.tsx
│       └── 30+ pre-built UI components
├── lib/
│   ├── hooks/
│   │   ├── use-employees.ts            # Employee data hook
│   │   ├── use-shifts.ts               # Shifts data hook
│   │   ├── use-requests.ts             # Requests data hook
│   │   ├── use-profile.ts              # Profile data hook
│   │   ├── use-toast.ts                # Toast notifications
│   │   └── use-media-query.ts          # Responsive design hook
│   ├── mutations/
│   │   ├── shifts.ts                   # Shift CRUD mutations
│   │   ├── employees.ts                # Employee approval mutations
│   │   ├── requests.ts                 # Request mutations
│   │   └── profile.ts                  # Profile update mutations
│   ├── providers/
│   │   ├── auth-provider.tsx           # Auth context provider
│   │   └── query-provider.tsx          # React Query provider
│   ├── supabase/
│   │   ├── client.ts                   # Client-side Supabase client
│   │   ├── server.ts                   # Server-side + Admin clients
│   │   └── middleware.ts               # Middleware client
│   ├── utils/
│   │   ├── validation.ts               # Zod schemas
│   │   └── motion.ts                   # Animation variants
│   ├── api-utils.ts                    # Auth wrapper functions
│   └── utils.ts                        # Date/formatting utilities
├── types/
│   └── database.ts                     # TypeScript types from Supabase
├── supabase/
│   └── migrations/
│       └── schema.sql                  # Unified database schema
├── package.json                        # Dependencies & scripts
├── tsconfig.json                       # TypeScript config
├── next.config.js                      # Next.js config
├── tailwind.config.ts                  # Tailwind CSS config
├── components.json                     # Shadcn/ui config
├── proxy.ts                            # Database/API proxy utilities
└── .env.local                          # Environment variables (git ignored)
```

## Database Schema

### Tables

1. **users** - User profiles (managers and employees)
   - Columns: id, email, username, full_name, is_manager, is_active, is_approved, workplace_id, google_id, avatar_url, timestamps
   - Links to auth.users (CASCADE delete)
   - Foreign key to workplaces

2. **workplaces** - Business/workplace information
   - Columns: id, name, business_name (UNIQUE), manager_id, created_at
   - Each workplace has one manager with exclusive control

3. **shifts** - Shift definitions
   - Columns: id, workplace_id, shift_date, shift_part (morning|noon|evening), created_at
   - Unique constraint: (workplace_id, shift_date, shift_part)

4. **shift_workers** - Shift assignments (junction table)
   - Columns: id, shift_id, user_id, comment, assigned_at
   - Unique constraint: (shift_id, user_id)
   - Links shifts to employees

5. **shift_boards** - Weekly shift board configurations
   - Columns: id, workplace_id, week_start_date, is_published, content (JSONB), preferences (JSONB), requests_window_start/end, timestamps
   - Stores schedule snapshots when published
   - Preferences: closed_days array, number_of_shifts_per_day
   - Controls employee visibility of future shifts

6. **user_requests** - Employee shift availability requests
   - Columns: id, user_id, workplace_id, requests (TEXT), timestamps
   - Unique constraint: (user_id, workplace_id)
   - Natural language shift preferences

7. **invites** - Manager invitation codes (Gatekeeper system)
   - Columns: id, code (UNIQUE), is_used, created_at, used_at, used_by, notes
   - Single-use codes for controlled manager registration
   - Prevents unauthorized manager signups

### Key Features

- **Row Level Security (RLS)**: Database-level authorization
- **PostgreSQL Functions**: Utility functions for common operations
- **Triggers**: Auto-update timestamps
- **Indexes**: Optimized query performance

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Google Cloud Console account (for OAuth)

### 2. Supabase Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Save your project URL and API keys

2. **Run the database migration**
   - Go to Supabase Dashboard > SQL Editor
   - Open `supabase/migrations/schema.sql`
   - Copy the entire content and paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Enable Real-time**
   - Run the following SQL to enable Real-time for critical tables:
     ```sql
     ALTER PUBLICATION supabase_realtime ADD TABLE shifts, shift_workers, shift_boards, user_requests;
     ```

4. **Configure Google OAuth**
   - Go to Supabase Dashboard > Authentication > Providers
   - Enable Google provider
   - Get Client ID and Secret from Google Cloud Console:
     1. Go to [Google Cloud Console](https://console.cloud.google.com/)
     2. Create a new project or select existing
     3. Go to APIs & Services > Credentials
     4. Create OAuth 2.0 Client ID
     5. Add authorized redirect URIs:
        - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Enter Client ID and Secret in Supabase

5. **Create manager invite codes** (Required for manager registration)
   - Run the following SQL to create invite codes:
     ```sql
     INSERT INTO invites (code, notes) VALUES
       ('MANAGER2025', 'First manager invite'),
       ('HELDERWERK01', 'Additional manager invite');
     ```
   - Share these codes with authorized managers during signup
   - Each code is single-use only

### 3. Local Development Setup

1. **Clone the repository**
   ```bash
   cd helderwerk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.local` and update with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`

## API Reference

### Authentication

#### `GET /api/auth/callback`
OAuth callback handler with auto-healing mechanism
- Exchanges OAuth code for session
- Auto-creates user profile if database trigger fails
- Routes users based on profile state:
  - No workplace → `/auth/complete-profile`
  - Manager → `/manager/dashboard`
  - Approved employee → `/employee/dashboard`
  - Pending employee → `/auth/pending-approval`

#### `POST /api/auth/signup`
Complete user profile after Google login

**Request Body:**
```json
{
  "role": "manager" | "employee",
  "businessName": "string",
  "fullName": "string" (optional),
  "inviteCode": "string" (required for managers only)
}
```

**Manager Flow:**
- Validates invite code (single-use gatekeeper)
- Creates user with `is_manager=true`, `is_approved=true`
- Creates new workplace
- Marks invite code as used

**Employee Flow:**
- Finds workplace by business_name
- Creates user with `is_manager=false`, `is_approved=false`
- Employee must wait for manager approval

#### `POST /api/auth/signout`
Sign out current user and clear session

### Manager APIs

#### `GET /api/manager/employees`
Get all employees in workplace

**Response:**
```json
{
  "employees": {
    "approved": [...],
    "pending": [...],
    "total": number
  }
}
```

#### `POST /api/manager/employees/:id/approve`
Approve pending employee

#### `POST /api/manager/employees/:id/reject`
Reject and remove pending employee

#### `GET /api/manager/shifts`
Get shifts for workplace

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD

#### `POST /api/manager/shifts`
Create shift(s) manually.

**Request Body (single shift):**
```json
{
  "shift_date": "2025-01-15",
  "shift_part": "morning" | "noon" | "evening"
}
```

**Request Body (multiple shifts):**
```json
{
  "shifts": [
    { "shift_date": "2025-01-15", "shift_part": "morning" },
    { "shift_date": "2025-01-15", "shift_part": "evening" }
  ]
}
```

#### `POST /api/manager/shifts/generate`
Auto-generate shifts by copying from a previous week.

**Request Body:**
```json
{
  "target_week_start": "2025-02-02",
  "source_week_start": "2025-01-26"
}
```

#### `PUT /api/manager/shifts/:id`
Update a specific shift.

**Request Body:**
```json
{
  "shift_date": "2025-01-16",
  "shift_part": "evening"
}
```

#### `DELETE /api/manager/shifts/:id`
Delete a specific shift.

#### `POST /api/manager/shifts/:id/workers`
Assign or remove worker from shift

**Request Body:**
```json
{
  "user_id": "uuid",
  "action": "add" | "remove"
}
```

#### `PUT /api/manager/shifts/:id/workers/:workerId`
Update individual worker assignment

#### `DELETE /api/manager/shifts/:id/workers/:workerId`
Remove specific worker from shift

#### `GET /api/manager/requests`
Get all employee shift requests

#### `GET /api/manager/schedule/preferences`
Get workplace preferences for a week

**Query Parameters:**
- `week_start` (required): YYYY-MM-DD

#### `PUT /api/manager/schedule/preferences`
Update workplace preferences

**Request Body:**
```json
{
  "week_start": "2025-01-12",
  "preferences": {
    "closed_days": ["friday"],
    "number_of_shifts_per_day": 2
  }
}
```

#### `POST /api/manager/schedule/publish`
Publish or unpublish a weekly schedule.

**Request Body:**
```json
{
  "week_start": "2025-01-12",
  "is_published": true
}
```

#### `PUT /api/manager/schedule/request-window`
Set shift request window

**Request Body:**
```json
{
  "week_start": "2025-01-12",
  "requests_window_start": "2025-01-05T00:00:00Z",
  "requests_window_end": "2025-01-10T23:59:59Z"
}
```

#### `GET /api/manager/schedule/start-date`
Get the configured week start date for scheduling

#### `PUT /api/manager/schedule/start-date`
Update the week start date

**Request Body:**
```json
{
  "week_start": "2025-01-12"
}
```

#### `POST /api/manager/schedule/assignments`
Batch assign/remove workers to/from shifts

**Request Body:**
```json
{
  "assignments": [
    { "shift_id": "uuid", "user_id": "uuid", "action": "add" | "remove" }
  ]
}
```

### Employee APIs

#### `GET /api/employee/shifts`
Get assigned shifts. **Note:** Only returns shifts for weeks that have been published by the manager (unless the shift is in the past).

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD (default: today)
- `end_date` (optional): YYYY-MM-DD (default: +30 days)

#### `GET /api/employee/requests`
Get user's shift requests

#### `POST /api/employee/requests`
Submit shift availability request

**Request Body:**
```json
{
  "requests": "Available Mon-Wed mornings, prefer Thu-Fri evenings"
}
```

### Profile API

#### `GET /api/profile`
Get current user profile with workplace info

#### `PUT /api/profile`
Update user profile

**Request Body:**
```json
{
  "full_name": "string",
  "avatar_url": "string"
}
```

## Authentication Flow

### Complete User Journey

```
1. User visits / (Home page)
   ↓
2. Clicks "Sign In" or "Get Started"
   ↓
3. Redirected to /auth/login
   ↓
4. Clicks "Sign in with Google"
   ↓
5. Google OAuth flow (external)
   ↓
6. Redirected to /api/auth/callback
   - Exchanges OAuth code for session
   - Auto-creates user profile if needed (race condition handling)
   - Routes based on profile state:
     • No workplace → /auth/complete-profile
     • Manager → /manager/dashboard
     • Approved employee → /employee/dashboard
     • Pending employee → /auth/pending-approval
   ↓
7. Profile Completion (/auth/complete-profile)
   - User selects role (manager or employee)
   - Enters business name
   - Optional: Full name
   - Manager: Required invite code
   ↓
8. POST /api/auth/signup

   MANAGER PATH:
   - Validates invite code (must be unused)
   - Creates user (is_manager=true, is_approved=true)
   - Creates new workplace
   - Links user to workplace
   - Marks invite code as used
   - → Redirects to /manager/dashboard

   EMPLOYEE PATH:
   - Finds workplace by business_name
   - Creates user (is_manager=false, is_approved=false)
   - Links user to workplace
   - → Redirects to /auth/pending-approval
   ↓
9. Manager approves employee (via /api/manager/employees/:id/approve)
   - Sets is_approved=true
   - Employee can now access /employee/dashboard
```

### Session Management

- **AuthProvider** monitors auth state changes in real-time
- **Automatic profile sync** on page load
- **Context available** via `useAuth()` hook:
  ```typescript
  const { user, authUser, loading, signOut } = useAuth()
  ```
  - `user` - Database profile (users table)
  - `authUser` - Supabase auth user
  - `loading` - Loading state
  - `signOut()` - Sign out function

### Authorization Checks

All protected routes and API endpoints verify:
1. User is authenticated (has valid session)
2. User has a workplace (completed profile)
3. Role-specific access:
   - Manager routes: `is_manager === true`
   - Employee routes: `is_approved === true && is_manager === false`

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:

- Users can only access their own data
- Managers can only access their workplace data
- Employees can only access data for their workplace
- Proper authorization for all operations
- Database-level enforcement (cannot be bypassed through API)

### Authentication

- **Google OAuth 2.0** for secure authentication
- **JWT tokens** managed by Supabase
- **Automatic session refresh** for persistent logins
- **Secure cookie-based sessions** with HttpOnly flags
- **Auto-healing OAuth callback** handles race conditions in user profile creation

### Manager Gatekeeper System

- **Invite-code based registration** prevents unauthorized manager creation
- **Single-use codes** tracked in `invites` table
- **Code validation** enforced at signup API level
- **Audit trail** with timestamps and usage tracking
- Only authorized users can create workplaces and manage employees

### Privacy Controls

- **Schedule publishing** - Employees only see published future schedules
- **Snapshot system** - Published schedules are frozen in `shift_boards.content`
- **Past shift visibility** - Employees can always see past shifts regardless of publish status
- **Request windows** - Configurable date ranges limit when employees can submit requests

### API Authorization

All API routes use wrapper functions for consistent authorization:
- `withBasicAuth()` - Requires authentication only
- `withAuth()` - Requires authentication + workplace membership
- `withManagerAuth()` - Manager-only access with workplace validation
- `withEmployeeAuth()` - Employee-only access (approved employees only)

## Development

### Adding a New API Route

1. Create route file in `app/api/[route]/route.ts`
2. Use `withAuth`, `withManagerAuth`, or `withEmployeeAuth` wrappers
3. Implement handler function
4. Add TypeScript types if needed

**Example:**
```typescript
import { withManagerAuth } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return withManagerAuth(async (user, supabase, workplaceId) => {
    // Your logic here
    return NextResponse.json({ data: 'example' })
  })
}
```

### Using React Query Hooks & Mutations

The app uses React Query for data fetching and state management. All hooks and mutations are pre-built.

#### Data Fetching Hooks (Queries)

Located in `lib/hooks/`:

```typescript
// Employee data
import { useEmployees } from '@/lib/hooks/use-employees'
const { data, isLoading, error } = useEmployees()

// Shifts (manager view)
import { useShifts } from '@/lib/hooks/use-shifts'
const { data, isLoading } = useShifts({ startDate, endDate })

// My shifts (employee view)
import { useMyShifts } from '@/lib/hooks/use-shifts'
const { data, isLoading } = useMyShifts({ startDate, endDate })

// User requests
import { useRequests } from '@/lib/hooks/use-requests'
const { data, isLoading } = useRequests()

// Current user profile
import { useProfile } from '@/lib/hooks/use-profile'
const { data: profile, isLoading } = useProfile()
```

#### Mutation Hooks (Write Operations)

Located in `lib/mutations/`:

```typescript
// Shift management
import { useCreateShift, useUpdateShift, useDeleteShift } from '@/lib/mutations/shifts'
const createShift = useCreateShift()
createShift.mutate({ shift_date: '2025-01-15', shift_part: 'morning' })

// Worker assignments
import { useAssignWorker, useRemoveWorker } from '@/lib/mutations/shifts'
const assignWorker = useAssignWorker()
assignWorker.mutate({ shiftId: 'uuid', userId: 'uuid' })

// Employee approvals
import { useApproveEmployee, useRejectEmployee } from '@/lib/mutations/employees'
const approveEmployee = useApproveEmployee()
approveEmployee.mutate('employee-id')

// Submit requests
import { useSubmitRequest } from '@/lib/mutations/requests'
const submitRequest = useSubmitRequest()
submitRequest.mutate({ requests: 'Available Mon-Fri mornings' })

// Profile updates
import { useUpdateProfile } from '@/lib/mutations/profile'
const updateProfile = useUpdateProfile()
updateProfile.mutate({ full_name: 'John Doe' })
```

**Features:**
- Automatic cache invalidation on mutations
- Optimistic updates for better UX
- Error handling with toast notifications
- Loading states included

### Using UI Components

Pre-built Radix UI components located in `components/ui/`:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/lib/hooks/use-toast'

// Toast notifications
const { toast } = useToast()
toast({
  title: 'Success',
  description: 'Operation completed',
  variant: 'default' // or 'destructive'
})
```

30+ components available including forms, dialogs, dropdowns, tabs, tables, etc.

### Validation Schemas

All validation schemas are in `lib/utils/validation.ts` using Zod:

```typescript
import { profileSchema, shiftSchema, requestSchema } from '@/lib/utils/validation'

// Validate data
const result = profileSchema.safeParse(formData)
if (!result.success) {
  console.error(result.error)
}
```

### Database Migrations

To add new database changes:

1. Create new SQL file in `supabase/migrations/`
2. Name it with incremental number: `002_description.sql`
3. Run in Supabase SQL Editor
4. Update TypeScript types in `types/database.ts`

### Utility Functions

Common utilities in `lib/utils.ts`:

```typescript
import {
  cn,              // Tailwind class merging
  formatDate,      // Format date as "Jan 15, 2025"
  getShortDate,    // Format as "1/15"
  getWeekStart,    // Get week start date (Sunday)
  getWeekRange,    // Get week range string
  getWeekDates,    // Get all dates in a week
  addDays,         // Add days to a date
  getDayName,      // Get full day name
  getShortDayName  // Get short day name (Mon, Tue, etc)
} from '@/lib/utils'

// Example usage
const weekStart = getWeekStart(new Date()) // Returns Sunday of current week
const formattedDate = formatDate('2025-01-15') // "January 15, 2025"
const classes = cn('text-base', 'font-bold', isDark && 'text-white')
```

Animation utilities in `lib/utils/motion.ts`:

```typescript
import {
  staggerContainerVariants,
  slideUpVariants,
  hoverLiftVariants,
  fastTransition
} from '@/lib/utils/motion'

// Use with Framer Motion components
<motion.div variants={staggerContainerVariants}>
  <motion.div variants={slideUpVariants}>Content</motion.div>
</motion.div>
```

### Architecture Patterns

**1. Server Components by Default**
- All pages are Server Components unless marked with `'use client'`
- Use Client Components only when needed for interactivity

**2. API Route Wrappers**
- All API routes use auth wrappers for consistency
- Wrappers handle authentication, authorization, and error responses

**3. React Query Pattern**
- Queries for reads (GET operations)
- Mutations for writes (POST/PUT/DELETE)
- Automatic cache invalidation on mutations

**4. Type Safety**
- Full TypeScript coverage
- Zod schemas for runtime validation
- Database types auto-generated from Supabase schema

**5. Component Structure**
- Layout components wrap pages with navigation
- UI components are reusable Radix primitives
- Pages compose UI components and hooks

## Deployment

### Vercel Deployment (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Update OAuth redirect URLs**
   - Add production URL to Google OAuth authorized redirects
   - Update Supabase redirect URLs in Authentication settings

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |

## License

ISC

## Support

For issues and questions, please create an issue on GitHub.