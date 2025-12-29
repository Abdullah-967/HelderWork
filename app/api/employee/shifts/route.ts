import { NextResponse } from 'next/server'
import { withEmployeeAuth } from '@/lib/api-utils'

export async function GET(request: Request) {
  return withEmployeeAuth(async (user, supabase, workplaceId) => {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Default to next 30 days if no date range specified
    const now = new Date()
    const defaultStart = now.toISOString().split('T')[0]
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const defaultEnd = thirtyDaysLater.toISOString().split('T')[0]

    let query = supabase
      .from('shift_workers')
      .select(`
        id,
        assigned_at,
        comment,
        shift_id,
        shifts (
          id,
          shift_date,
          shift_part,
          workplace_id
        )
      `)
      .eq('user_id', user.id)

    const { data: shiftWorkers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by date range
    let shifts = shiftWorkers.map((sw) => ({
      assignment_id: sw.id,
      assigned_at: sw.assigned_at,
      comment: sw.comment,
      ...sw.shifts,
    }))

    const start = startDate || defaultStart
    const end = endDate || defaultEnd

    shifts = shifts.filter((shift) => {
      if (!shift.shift_date) return false
      return shift.shift_date >= start && shift.shift_date <= end
    })

    // --- Privacy Filter: Check Published Status ---
    
    // Helper to get Sunday (Week Start) for a date string
    // Uses UTC to avoid timezone issues since dates are stored as YYYY-MM-DD
    const getWeekStartDate = (dateString: string) => {
      const date = new Date(dateString)
      const day = date.getUTCDay()
      const diff = date.getUTCDate() - day
      const sunday = new Date(date)
      sunday.setUTCDate(diff)
      return sunday.toISOString().split('T')[0]
    }

    // 1. Identify all relevant weeks
    const weekStarts = new Set<string>()
    shifts.forEach((s) => {
      if (s.shift_date) {
        weekStarts.add(getWeekStartDate(s.shift_date))
      }
    })

    // 2. Fetch publication status for those weeks
    let publishedWeeks = new Set<string>()
    if (weekStarts.size > 0) {
      const { data: boards } = await supabase
        .from('shift_boards')
        .select('week_start_date, is_published')
        .eq('workplace_id', workplaceId)
        .in('week_start_date', Array.from(weekStarts))

      if (boards) {
        boards.forEach((b) => {
          if (b.is_published) {
            publishedWeeks.add(b.week_start_date)
          }
        })
      }
    }

    // 3. Filter shifts (Allow past shifts OR published future shifts)
    const today = new Date().toISOString().split('T')[0]
    
    shifts = shifts.filter((s) => {
      if (!s.shift_date) return false
      
      // Always show past shifts
      if (s.shift_date < today) return true

      // For future/current shifts, check if week is published
      const weekStart = getWeekStartDate(s.shift_date)
      return publishedWeeks.has(weekStart)
    })

    // ----------------------------------------------

    // Sort by date
    shifts.sort((a, b) => {
  const dateA = a.shift_date ?? '';
  const dateB = b.shift_date ?? '';
  return dateA.localeCompare(dateB);
});

    return NextResponse.json({ shifts, total: shifts.length })
  })
}
