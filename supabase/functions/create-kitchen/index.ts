import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

// Rate limiting store (in-memory for simplicity)
const requestCounts = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://nalapaka.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// Helper function to validate password strength
function isPasswordStrong(password: string): { valid: boolean; message?: string } {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

// Helper function for rate limiting
function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const key = `create-kitchen-${identifier}`
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, [])
  }
  
  const attempts = requestCounts.get(key)!
  const recentAttempts = attempts.filter(t => now - t < RATE_LIMIT_WINDOW)
  
  if (recentAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    const oldestAttempt = Math.min(...recentAttempts)
    const retryAfter = Math.ceil((oldestAttempt + RATE_LIMIT_WINDOW - now) / 1000)
    return { allowed: false, retryAfter }
  }
  
  recentAttempts.push(now)
  requestCounts.set(key, recentAttempts)
  return { allowed: true }
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

    // Rate limit check per user
    const rateLimitCheck = checkRateLimit(caller.id)
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitCheck.retryAfter)
          } 
        }
      )
    }

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', caller.id).maybeSingle()
    if (callerRole?.role !== 'manager') {
      return new Response(JSON.stringify({ error: 'Only managers can create kitchen accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: callerMembership } = await supabaseAdmin
      .from('hotel_members').select('hotel_id').eq('user_id', caller.id).maybeSingle()
    const hotelId = callerMembership?.hotel_id
    if (!hotelId) return new Response(JSON.stringify({ error: 'Manager is not linked to any hotel' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { email, password, name, phoneNumber } = await req.json()
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Email, password, and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Validate password strength
    const passwordValidation = isPasswordStrong(password)
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (createError || !authData.user) {
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const newUserId = authData.user.id

    const { data: existingRole } = await supabaseAdmin
      .from('user_roles').select('id').eq('user_id', newUserId).maybeSingle()
    if (existingRole) {
      await supabaseAdmin.from('user_roles').update({ role: 'kitchen' }).eq('user_id', newUserId)
    } else {
      await supabaseAdmin.from('user_roles').insert({ user_id: newUserId, role: 'kitchen' })
    }

    await supabaseAdmin.from('hotel_members').insert({ hotel_id: hotelId, user_id: newUserId, role: 'kitchen' })

    const { error: kitchenErr } = await supabaseAdmin.from('kitchen_staff').insert({
      user_id: newUserId,
      hotel_id: hotelId,
      name,
      phone_number: phoneNumber || null,
      is_active: true,
    })
    if (kitchenErr) return new Response(JSON.stringify({ error: kitchenErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    return new Response(JSON.stringify({
      success: true,
      user: { id: newUserId, email: authData.user.email },
      message: 'Kitchen account created successfully.'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('create-kitchen error:', msg)
    return new Response(JSON.stringify({ error: 'An error occurred during account creation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})