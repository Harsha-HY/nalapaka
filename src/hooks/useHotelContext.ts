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
 * Returns the hotel_id the current user is acting under.
 * - Staff (manager/server/kitchen) → from AuthContext.hotel
 * - Customers (guests) → from localStorage cache set by /guest/:slug entry
 */
export function useHotelContext() {
  const { hotel, role } = useAuth();
  const [guestHotel, setGuestHotel] = useState<GuestHotel | null>(() => {
    try {
      const raw = localStorage.getItem(GUEST_HOTEL_KEY);
      return raw ? (JSON.parse(raw) as GuestHotel) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = () => {
      try {
        const raw = localStorage.getItem(GUEST_HOTEL_KEY);
        setGuestHotel(raw ? (JSON.parse(raw) as GuestHotel) : null);
      } catch {
        setGuestHotel(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (role === 'manager' || role === 'server' || role === 'kitchen') {
    return { hotelId: hotel?.id ?? null, hotelName: hotel?.name ?? null, hotelSlug: hotel?.slug ?? null };
  }
  return {
    hotelId: guestHotel?.id ?? null,
    hotelName: guestHotel?.name ?? null,
    hotelSlug: guestHotel?.slug ?? null,
  };
}

export function setGuestHotel(hotel: GuestHotel | null) {
  try {
    if (hotel) localStorage.setItem(GUEST_HOTEL_KEY, JSON.stringify(hotel));
    else localStorage.removeItem(GUEST_HOTEL_KEY);
  } catch {}
}

/**
 * Picks a default hotel for a logged-in customer who arrived via /auth (no QR).
 * Caches the first active hotel so menu/orders work.
 */
export async function ensureGuestHotelLoaded(): Promise<GuestHotel | null> {
  try {
    const cached = localStorage.getItem(GUEST_HOTEL_KEY);
    if (cached) return JSON.parse(cached) as GuestHotel;
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
