import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHotelContext } from '@/hooks/useHotelContext';

export interface DailySpecial {
  id: string;
  hotel_id: string | null;
  name: string;
  name_kn: string | null;
  price: number;
  note: string | null;
  image_url: string | null;
  special_date: string;
  is_active: boolean;
}

export function useDailySpecials() {
  const { hotelId } = useHotelContext();
  const [specials, setSpecials] = useState<DailySpecial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!hotelId) {
      setSpecials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_specials')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('special_date', today)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (!error) setSpecials((data as DailySpecial[]) || []);
    setLoading(false);
  }, [hotelId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!hotelId) return;
    const channel = supabase
      .channel(`daily-specials-${hotelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_specials', filter: `hotel_id=eq.${hotelId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelId, fetch]);

  const addSpecial = useCallback(async (s: { name: string; name_kn?: string; price: number; note?: string; image_url?: string }) => {
    if (!hotelId) return null;
    const { data, error } = await supabase
      .from('daily_specials')
      .insert({ ...s, hotel_id: hotelId })
      .select()
      .single();
    if (error) throw error;
    await fetch();
    return data;
  }, [hotelId, fetch]);

  const removeSpecial = useCallback(async (id: string) => {
    const { error } = await supabase.from('daily_specials').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  return { specials, loading, addSpecial, removeSpecial, refresh: fetch };
}
