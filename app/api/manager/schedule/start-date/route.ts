import { NextResponse } from "next/server"
import { withEmployeeAuth, withManagerAuth } from "@/lib/api-utils"
import { start } from "node:repl"

export async function GET(request: Request) {
    return withManagerAuth(async (user, supabase, workplaceId) => {
        const today = new Date()
        const dayOfWeek = today.getDay() // 0 (Sun) to 6 (Sat)


        // Calculate start of the week (Sunday)
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - dayOfWeek)


        // Format as YYYY-MM-DD
        const startOfWeekFormatted = startOfWeek.toISOString().split('T')[0]

        return NextResponse.json({ start_date: startOfWeek })
    })
}   