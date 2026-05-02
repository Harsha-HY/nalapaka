import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HotelUpi {
  upi_id: string | null;
  upi_name: string | null;
}

const cache = new Map<string, HotelUpi>();

/**
 * Fetches per-hotel UPI payee details. Cached per hotel for the session
 * so QR codes / payment modals don't flicker.
 */
export function useHotelUpi(hotelId?: string | null) {
  const [data, setData] = useState<HotelUpi | null>(
    hotelId ? cache.get(hotelId) ?? null : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hotelId) return;
    let cancelled = false;
    const load = async (force = false) => {
      if (!force && cache.has(hotelId)) {
        setData(cache.get(hotelId)!);
        return;
      }
      setLoading(true);
      const { data: row } = await supabase
        .from('hotels')
        .select('upi_id, upi_name')
        .eq('id', hotelId)
        .maybeSingle();
      const value: HotelUpi = {
        upi_id: (row as any)?.upi_id ?? null,
        upi_name: (row as any)?.upi_name ?? null,
      };
      cache.set(hotelId, value);
      if (!cancelled) {
        setData(value);
        setLoading(false);
      }
    };
    load();
    const onUpdate = () => load(true);
    window.addEventListener('hotel-upi-updated', onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('hotel-upi-updated', onUpdate);
    };
  }, [hotelId]);

  return { upi: data, loading, invalidate: () => hotelId && cache.delete(hotelId) };
}

export function buildUpiUri(upiId: string, payeeName: string, amount: number, orderId: string) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Merchant')}&am=${amount}&cu=INR&tn=${encodeURIComponent('Order-' + orderId.slice(0, 8))}`;
}
