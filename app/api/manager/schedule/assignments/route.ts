import { NextResponse } from 'next/server'
import { withManagerAuth } from '@/lib/api-utils'


export async function GET(request: Request) {
    return withManagerAuth(async (user, supabase, workplaceId) => {
        const { searchParams } = new URL(request.url)
        const weekstart = searchParams.get('week_start')

        if (!weekstart) {
            return NextResponse.json(
                { error: 'week_start parameter is required (YYYY-MM-DD format)' },
                { status: 400 }
            )
        }

        // Calculate week end date (7 days later)
        const startDate = new Date(weekstart)
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6) 


        // Fetch shifts and their assigned workers for the week
        const { data: shifts, error } = await supabase
            .from('shifts')
            .select(`
                id,
                shift_date,
                shift_part,
                shift_workers (
                    user_id,
                    comment,
                    users (
                        full_name, 
                        username
                        )
                    )
                `)
                .eq('workplace_id', workplaceId)
                .gte('shift_date', weekstart)
                .lte('shift_date', endDate.toISOString().split('T')[0])

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }


        // Flatten structure for easier consumption
        const assignments = shifts.flatMap(shift =>
            shift.shift_workers?.map((worker: any) => ({
                id: `${shift.id}-${worker.user_id}`,
                shift_id: shift.id,
                user_id: worker.user_id,
                user_name: worker.users?.full_name || worker.users?.username || 'Unknown',
                comment: worker.comment,
                shift_date: shift.shift_date,
                shift_part: shift.shift_part,
            }))
        )

        return NextResponse.json({ assignments })
    })
}   

