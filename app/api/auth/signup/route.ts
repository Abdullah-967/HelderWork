import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateUsername } from '@/lib/utils'
import { createClient as createRegularClient } from '@/lib/supabase/server' 

const signupSchema = z.object({
  role: z.enum(['manager', 'employee']),
  businessName: z.string().min(1),
  fullName: z.string().optional(),
  inviteCode: z.string().optional(), // <--- NEW FIELD
})

export async function POST(request: Request) {
  try {
    // 1. Initialize ADMIN Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Ensure this matches .env.local
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 2. Validate User
    const supabaseRegular = await createRegularClient()
    const { data: { user: authUser }, error: authError } = await supabaseRegular.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Check Existing Profile
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, workplace_id')
      .eq('id', authUser.id)
      .maybeSingle()

    if (existingUser?.workplace_id) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 })
    }

    const body = await request.json()
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 })
    }

    const { role, businessName, fullName, inviteCode } = validation.data
    const username = generateUsername(authUser.email || `user_${authUser.id}`)

    // 4. MANAGER LOGIC (With Gatekeeper)
 
    if (role === 'manager') {
      
      // 🔒 GATEKEEPER START --------------------------------------
      if (!inviteCode) {
        return NextResponse.json({ error: 'Invite code required for managers' }, { status: 403 })
      }

      // Check if code is valid and unused
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from('invites')
        .select('code')
        .eq('code', inviteCode)
        .eq('is_used', false)
        .maybeSingle()

      if (inviteError || !invite) {
        return NextResponse.json({ error: 'Invalid or used invite code' }, { status: 403 })
      }
      // 🔒 GATEKEEPER END ----------------------------------------

      // 0. PRE-CHECK: Check if business name is already taken
      const { data: existingWp } = await supabaseAdmin
        .from('workplaces')
        .select('id')
        .eq('business_name', businessName)
        .maybeSingle()

      if (existingWp) {
        return NextResponse.json({ error: 'Business name already exists' }, { status: 400 })
      }

      // 1. Create/Ensure User Exists (First, without workplace)
      // This satisfies the foreign key constraint on workplaces.manager_id
      const { error: preUserError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          username: username,
          full_name: fullName || 'User',
          is_manager: true,
          is_active: true,
          is_approved: true,
          // workplace_id is explicitly omitted/null here
          google_id: authUser.user_metadata.sub,
          avatar_url: authUser.user_metadata.avatar_url
        })

      if (preUserError) throw preUserError

      // 2. Create Workplace
      const { data: workplace, error: wpError } = await supabaseAdmin
        .from('workplaces')
        .insert({
          name: fullName,
          business_name: businessName,
          manager_id: authUser.id
        })
        .select()
        .single()
      
      if (wpError) {
        // This is a safety catch, though pre-check should handle it
        if (wpError.code === '23505') return NextResponse.json({ error: 'Business name already exists' }, { status: 400 })
        throw wpError
      }

      // 3. Link User to Workplace
      const { error: linkError } = await supabaseAdmin
        .from('users')
        .update({ workplace_id: workplace.id })
        .eq('id', authUser.id)

      if (linkError) {
        // Rollback: Delete the workplace if we can't link the user
        await supabaseAdmin.from('workplaces').delete().eq('id', workplace.id)
        throw linkError
      }

      // ✅ BURN THE CODE (Mark as used)
      await supabaseAdmin
        .from('invites')
        .update({ is_used: true })
        .eq('code', inviteCode)

      return NextResponse.json({ success: true, role: 'manager', workplace_id: workplace.id })
    }

    // 5. EMPLOYEE LOGIC (No Invite Code Needed)
    const { data: workplace, error: findError } = await supabaseAdmin
        .from('workplaces')
        .select('id')
        .eq('business_name', businessName)
        .maybeSingle()
    
    if (findError || !workplace) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { error: empError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          username: username,
          full_name: fullName || 'User',
          is_manager: false,
          is_active: true,
          is_approved: false,
          workplace_id: workplace.id,
          google_id: authUser.user_metadata.sub,
          avatar_url: authUser.user_metadata.avatar_url
        })
    
    if (empError) throw empError

    return NextResponse.json({ success: true, pending: true })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
