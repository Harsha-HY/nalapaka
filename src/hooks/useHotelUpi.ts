import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HotelUpi {
  upi_id: string | null;
  upi_name: string | null;
  upi_bank_name: string | null;
  upi_scanner_url: string | null;
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
      const { data: row } = await (supabase.from('hotels') as any)
        .select('upi_id, upi_name, upi_bank_name, upi_scanner_url')
        .eq('id', hotelId)
        .maybeSingle();
      const value: HotelUpi = {
        upi_id: (row as any)?.upi_id ?? null,
        upi_name: (row as any)?.upi_name ?? null,
        upi_bank_name: (row as any)?.upi_bank_name ?? null,
        upi_scanner_url: (row as any)?.upi_scanner_url ?? null,
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
  const formattedAmount = Number(amount || 0).toFixed(2);
  const shortOrderId = orderId.slice(0, 8);
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Merchant')}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent('Order-' + shortOrderId)}&tr=${encodeURIComponent(shortOrderId)}`;
}
