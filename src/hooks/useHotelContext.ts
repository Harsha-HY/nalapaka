import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const GUEST_HOTEL_KEY = 'dh_guest_hotel_v1';

export interface GuestHotel {
  id: string;
  name: string;
  slug: string;
}

/**
 * Returns the hotel context for whoever is using the app right now.
 * - Staff (manager / server / kitchen) → hotel from AuthContext
 * - Customers (no role or 'customer') → hotel cached by /guest/:slug
 *
 * Customers do NOT need to be logged in.
 */
export function useHotelContext() {
  const { hotel, role } = useAuth();
  const [guestHotel, setGuestHotelState] = useState<GuestHotel | null>(() => readCache());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== GUEST_HOTEL_KEY) return;
      setGuestHotelState(readCache());
    };
    const onCustom = () => setGuestHotelState(readCache());
    window.addEventListener('storage', onStorage);
    window.addEventListener('dh-guest-hotel-changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('dh-guest-hotel-changed', onCustom);
    };
  }, []);

  if (role === 'manager' || role === 'server' || role === 'kitchen' || role === 'super_admin') {
    return {
      hotelId: hotel?.id ?? null,
      hotelName: hotel?.name ?? null,
      hotelSlug: hotel?.slug ?? null,
    };
  }

  return {
    hotelId: guestHotel?.id ?? null,
    hotelName: guestHotel?.name ?? null,
    hotelSlug: guestHotel?.slug ?? null,
  };
}

function readCache(): GuestHotel | null {
  try {
    const raw = localStorage.getItem(GUEST_HOTEL_KEY);
    return raw ? (JSON.parse(raw) as GuestHotel) : null;
  } catch {
    return null;
  }
}

export function setGuestHotel(hotel: GuestHotel | null) {
  try {
    if (hotel) localStorage.setItem(GUEST_HOTEL_KEY, JSON.stringify(hotel));
    else localStorage.removeItem(GUEST_HOTEL_KEY);
    window.dispatchEvent(new Event('dh-guest-hotel-changed'));
  } catch {}
}

/**
 * If a customer somehow lands without a cached hotel, fall back to the first active one.
 * Used by MenuPage as a safety net.
 */
export async function ensureGuestHotelLoaded(): Promise<GuestHotel | null> {
  try {
    const cached = readCache();
    if (cached) return cached;
    const { data } = await supabase
      .from('hotels')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) {
      const h = { id: data.id, name: data.name, slug: data.slug };
      setGuestHotel(h);
      return h;
    }
  } catch {}
  return null;
}
