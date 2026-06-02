import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

// Rate limiting store (in-memory for simplicity)
const requestCounts = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 3 // More restrictive for delete operations

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://nalapaka.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// Helper function for rate limiting
function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const key = `delete-hotel-${identifier}`
  
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

    // Rate limit check per user (more restrictive for delete operations)
    const rateLimitCheck = checkRateLimit(caller.id)
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many delete requests. Please try again later.',
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
    if (callerRole?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only Super Admin can delete hotels' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { hotelId } = await req.json()
    if (!hotelId) return new Response(JSON.stringify({ error: 'hotelId required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Find all auth users belonging to this hotel
    const { data: members } = await supabaseAdmin
      .from('hotel_members').select('user_id').eq('hotel_id', hotelId)

    // Delete the hotel (cascades to all hotel_id-scoped data)
    const { error: delErr } = await supabaseAdmin.from('hotels').delete().eq('id', hotelId)
    if (delErr) return new Response(JSON.stringify({ error: delErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Delete the auth users (managers/servers/kitchen of this hotel)
    if (members) {
      for (const m of members) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(m.user_id)
        } catch (e) {
          console.error('Failed deleting auth user', m.user_id, e)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('delete-hotel error:', msg)
    return new Response(JSON.stringify({ error: 'An error occurred during deletion' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})