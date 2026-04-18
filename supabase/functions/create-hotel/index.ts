import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Caller must be super_admin
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', caller.id).maybeSingle()
    if (callerRole?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only Super Admin can create hotels' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { hotelName, hotelSlug, managerEmail, managerPassword, managerName } = await req.json()
    if (!hotelName || !hotelSlug || !managerEmail || !managerPassword || !managerName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(hotelSlug)) {
      return new Response(JSON.stringify({ error: 'Slug can contain only lowercase letters, numbers, and hyphens' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1) Create hotel
    const { data: hotel, error: hotelErr } = await supabaseAdmin
      .from('hotels')
      .insert({ name: hotelName, slug: hotelSlug, created_by: caller.id, is_active: true })
      .select().single()
    if (hotelErr || !hotel) {
      return new Response(JSON.stringify({ error: hotelErr?.message || 'Failed to create hotel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2) Create manager auth user (auto-confirmed)
    const { data: authData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: managerEmail,
      password: managerPassword,
      email_confirm: true,
    })
    if (createErr || !authData.user) {
      // rollback hotel
      await supabaseAdmin.from('hotels').delete().eq('id', hotel.id)
      return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create manager' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const newUserId = authData.user.id

    // 3) Set role = manager (upsert because trigger inserted 'customer')
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles').select('id').eq('user_id', newUserId).maybeSingle()
    if (existingRole) {
      await supabaseAdmin.from('user_roles').update({ role: 'manager' }).eq('user_id', newUserId)
    } else {
      await supabaseAdmin.from('user_roles').insert({ user_id: newUserId, role: 'manager' })
    }

    // 4) Add to hotel_members
    const { error: memErr } = await supabaseAdmin
      .from('hotel_members').insert({ hotel_id: hotel.id, user_id: newUserId, role: 'manager' })
    if (memErr) {
      console.error('Hotel member insert error:', memErr)
    }

    // 5) Create profile
    await supabaseAdmin.from('profiles').insert({ user_id: newUserId, name: managerName }).select().maybeSingle()

    return new Response(JSON.stringify({
      success: true,
      hotel,
      manager: { id: newUserId, email: managerEmail }
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('create-hotel error:', msg)
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
