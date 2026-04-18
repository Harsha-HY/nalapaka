import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !caller) return new Response(JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', caller.id).maybeSingle()
    if (callerRole?.role !== 'manager') {
      return new Response(JSON.stringify({ error: 'Only managers can create server accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Caller's hotel
    const { data: callerMembership } = await supabaseAdmin
      .from('hotel_members').select('hotel_id').eq('user_id', caller.id).maybeSingle()
    const hotelId = callerMembership?.hotel_id
    if (!hotelId) return new Response(JSON.stringify({ error: 'Manager is not linked to any hotel' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { email, password, name, phoneNumber, assignedTables } = await req.json()
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Email, password, and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (createError || !authData.user) {
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const newUserId = authData.user.id

    // Set role -> server (upsert)
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles').select('id').eq('user_id', newUserId).maybeSingle()
    if (existingRole) {
      await supabaseAdmin.from('user_roles').update({ role: 'server' }).eq('user_id', newUserId)
    } else {
      await supabaseAdmin.from('user_roles').insert({ user_id: newUserId, role: 'server' })
    }

    // Add to hotel_members
    await supabaseAdmin.from('hotel_members').insert({ hotel_id: hotelId, user_id: newUserId, role: 'server' })

    // Add to servers table with hotel_id
    const { error: srvErr } = await supabaseAdmin.from('servers').insert({
      user_id: newUserId,
      hotel_id: hotelId,
      name,
      phone_number: phoneNumber || null,
      assigned_tables: assignedTables || [],
      is_active: true,
    })
    if (srvErr) return new Response(JSON.stringify({ error: srvErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    return new Response(JSON.stringify({
      success: true,
      user: { id: newUserId, email: authData.user.email },
      message: 'Server account created successfully.'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('create-server error:', msg)
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
