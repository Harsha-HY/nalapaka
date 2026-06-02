import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

// Rate limiting store (in-memory for simplicity, persists during function lifetime)
const requestCounts = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5

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
  const key = `reset-pwd-${identifier}`
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, [])
  }
  
  const attempts = requestCounts.get(key)!
  // Remove old attempts outside the window
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the caller using getUser
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerUserId = callerUser.id

    // Rate limit check per user
    const rateLimitCheck = checkRateLimit(callerUserId)
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many password reset attempts. Please try again later.',
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

    // Check if caller is a manager
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUserId)
      .single()

    if (callerRole?.role !== 'manager') {
      return new Response(
        JSON.stringify({ error: 'Only managers can reset server passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { serverUserId, newPassword } = await req.json()

    if (!serverUserId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Server user ID and new password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password strength
    const passwordValidation = isPasswordStrong(newPassword)
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify that the server belongs to the same hotel as the manager
    const { data: managerHotel } = await supabaseAdmin
      .from('hotel_members')
      .select('hotel_id')
      .eq('user_id', callerUserId)
      .maybeSingle()

    const { data: serverHotel } = await supabaseAdmin
      .from('hotel_members')
      .select('hotel_id')
      .eq('user_id', serverUserId)
      .maybeSingle()

    if (!managerHotel || !serverHotel || managerHotel.hotel_id !== serverHotel.hotel_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot reset password for users outside your hotel' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Reset password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      serverUserId,
      { password: newPassword }
    )

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Reset password error:', errorMessage)
    return new Response(
      JSON.stringify({ error: 'An error occurred during password reset' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})