import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Seed menu — every new hotel gets a baseline menu they can customize
const SEED_MENU = [
  { id: 'idli', name: 'Idli (2 pcs)', name_kn: 'ಇಡ್ಲಿ (2 ಪೀಸ್)', price: 40, category: 'south-indian', time_slot: 'morning' },
  { id: 'vada', name: 'Vada (2 pcs)', name_kn: 'ವಡೆ (2 ಪೀಸ್)', price: 50, category: 'south-indian', time_slot: 'morning' },
  { id: 'idli-vada', name: 'Idli Vada Combo', name_kn: 'ಇಡ್ಲಿ ವಡೆ ಕಾಂಬೊ', price: 70, category: 'south-indian', time_slot: 'morning' },
  { id: 'pongal', name: 'Ven Pongal', name_kn: 'ವೆಣ್ ಪೊಂಗಲ್', price: 60, category: 'south-indian', time_slot: 'morning' },
  { id: 'upma', name: 'Upma', name_kn: 'ಉಪ್ಪಿಟ್ಟು', price: 45, category: 'south-indian', time_slot: 'morning' },
  { id: 'plain-dosa', name: 'Plain Dosa', name_kn: 'ಸಾದಾ ದೋಸೆ', price: 60, category: 'south-indian', time_slot: 'all' },
  { id: 'masala-dosa', name: 'Masala Dosa', name_kn: 'ಮಸಾಲೆ ದೋಸೆ', price: 80, category: 'south-indian', time_slot: 'all' },
  { id: 'rava-dosa', name: 'Rava Dosa', name_kn: 'ರವೆ ದೋಸೆ', price: 75, category: 'south-indian', time_slot: 'all' },
  { id: 'mysore-masala-dosa', name: 'Mysore Masala Dosa', name_kn: 'ಮೈಸೂರು ಮಸಾಲೆ ದೋಸೆ', price: 90, category: 'south-indian', time_slot: 'all' },
  { id: 'full-meals', name: 'Full Meals', name_kn: 'ಊಟ (ಪೂರ್ಣ)', price: 120, category: 'south-indian', time_slot: 'afternoon' },
  { id: 'curd-rice', name: 'Curd Rice', name_kn: 'ಮೊಸರು ಅನ್ನ', price: 60, category: 'south-indian', time_slot: 'afternoon' },
  { id: 'paneer-butter-masala', name: 'Paneer Butter Masala', name_kn: 'ಪನೀರ್ ಬಟರ್ ಮಸಾಲ', price: 180, category: 'north-indian', time_slot: 'all' },
  { id: 'palak-paneer', name: 'Palak Paneer', name_kn: 'ಪಾಲಕ್ ಪನೀರ್', price: 170, category: 'north-indian', time_slot: 'all' },
  { id: 'dal-fry', name: 'Dal Fry', name_kn: 'ದಾಲ್ ಫ್ರೈ', price: 120, category: 'north-indian', time_slot: 'all' },
  { id: 'butter-roti', name: 'Butter Roti', name_kn: 'ಬಟರ್ ರೋಟಿ', price: 30, category: 'north-indian', time_slot: 'all' },
  { id: 'butter-naan', name: 'Butter Naan', name_kn: 'ಬಟರ್ ನಾನ್', price: 50, category: 'north-indian', time_slot: 'all' },
  { id: 'jeera-rice', name: 'Jeera Rice', name_kn: 'ಜೀರಾ ರೈಸ್', price: 100, category: 'north-indian', time_slot: 'all' },
  { id: 'veg-fried-rice', name: 'Veg Fried Rice', name_kn: 'ವೆಜ್ ಫ್ರೈಡ್ ರೈಸ್', price: 120, category: 'chinese', time_slot: 'all' },
  { id: 'hakka-noodles', name: 'Hakka Noodles', name_kn: 'ಹಕ್ಕಾ ನೂಡಲ್ಸ್', price: 120, category: 'chinese', time_slot: 'all' },
  { id: 'manchurian-gravy', name: 'Gobi Manchurian Gravy', name_kn: 'ಗೋಬಿ ಮಂಚೂರಿಯನ್ ಗ್ರೇವಿ', price: 150, category: 'chinese', time_slot: 'all' },
  { id: 'paneer-tikka', name: 'Paneer Tikka', name_kn: 'ಪನೀರ್ ಟಿಕ್ಕಾ', price: 200, category: 'tandoor', time_slot: 'evening' },
  { id: 'tandoori-roti', name: 'Tandoori Roti', name_kn: 'ತಂದೂರಿ ರೋಟಿ', price: 35, category: 'tandoor', time_slot: 'evening' },
  { id: 'masala-chai', name: 'Masala Chai', name_kn: 'ಮಸಾಲ ಚಹಾ', price: 25, category: 'south-indian', time_slot: 'evening' },
  { id: 'filter-coffee', name: 'Filter Coffee', name_kn: 'ಫಿಲ್ಟರ್ ಕಾಫಿ', price: 30, category: 'south-indian', time_slot: 'evening' },
];

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
    if (callerRole?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only Super Admin can create hotels' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { hotelName, hotelSlug, managerEmail, managerPassword, managerName } = await req.json()
    if (!hotelName || !hotelSlug || !managerEmail || !managerPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!/^[a-z0-9-]+$/.test(hotelSlug)) {
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

    // 2) Create manager auth user
    const { data: authData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: managerEmail, password: managerPassword, email_confirm: true,
    })
    if (createErr || !authData.user) {
      await supabaseAdmin.from('hotels').delete().eq('id', hotel.id)
      return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create manager' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const newUserId = authData.user.id

    // 3) Set role = manager (upsert)
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles').select('id').eq('user_id', newUserId).maybeSingle()
    if (existingRole) {
      await supabaseAdmin.from('user_roles').update({ role: 'manager' }).eq('user_id', newUserId)
    } else {
      await supabaseAdmin.from('user_roles').insert({ user_id: newUserId, role: 'manager' })
    }

    // 4) Add to hotel_members
    await supabaseAdmin.from('hotel_members').insert({ hotel_id: hotel.id, user_id: newUserId, role: 'manager' })

    // 5) Create profile
    await supabaseAdmin.from('profiles').insert({ user_id: newUserId, name: managerName || hotelName })

    // 6) Seed menu items for this hotel — id needs to be unique per row
    const menuRows = SEED_MENU.map(m => ({ ...m, id: `${hotel.id.slice(0, 8)}-${m.id}`, hotel_id: hotel.id, is_available: true }))
    await supabaseAdmin.from('menu_items').insert(menuRows)

    return new Response(JSON.stringify({
      success: true, hotel,
      manager: { id: newUserId, email: managerEmail }
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('create-hotel error:', msg)
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
