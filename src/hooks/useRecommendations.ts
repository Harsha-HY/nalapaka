import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHotelContext } from '@/hooks/useHotelContext';
import { useMenuItems, MenuItem } from '@/hooks/useMenuItems';

interface Reco {
  item: MenuItem;
  reason: string;
}

const DEVICE_KEY = 'guest_device_id';

function getDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_KEY);
  } catch {
    return null;
  }
}

export function useRecommendations() {
  const { hotelId } = useHotelContext();
  const { menuItems } = useMenuItems();
  const [recos, setRecos] = useState<Reco[]>([]);
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    if (!hotelId || menuItems.length === 0) return;
    setLoading(true);

    try {
      const deviceId = getDeviceId();
      const { data: pastOrders } = await supabase
        .from('orders')
        .select('ordered_items, extra_items')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Personal history (matched on device_id done in backend RLS — fallback: all recent)
      const itemFreq: Record<string, number> = {};
      (pastOrders || []).forEach((o: any) => {
        const items = [...(o.ordered_items || []), ...(o.extra_items || [])];
        items.forEach((it: any) => {
          if (it?.id) itemFreq[it.id] = (itemFreq[it.id] || 0) + (it.quantity || 1);
        });
      });

      const ranked = Object.entries(itemFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      const list: Reco[] = [];

      // Specials first
      const specials = menuItems.filter((m) => (m as any).is_special && m.isAvailable);
      specials.slice(0, 2).forEach((item) => list.push({ item, reason: "Today's Special" }));

      // Top trending today
      ranked.forEach(([id]) => {
        const item = menuItems.find((m) => m.id === id && m.isAvailable);
        if (item && !list.find((r) => r.item.id === item.id)) {
          list.push({ item, reason: 'Popular today' });
        }
      });

      // Fallback: random available items
      if (list.length < 4) {
        const fallback = menuItems.filter((m) => m.isAvailable && !list.find((r) => r.item.id === m.id));
        fallback.slice(0, 4 - list.length).forEach((item) =>
          list.push({ item, reason: 'You might like' })
        );
      }

      setRecos(list.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, [hotelId, menuItems]);

  useEffect(() => { compute(); }, [compute]);

  const askAI = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('food-recommendations', {
        body: { hotelId, menuItems: menuItems.filter((m) => m.isAvailable).map((m) => ({ id: m.id, name: m.name, category: m.category, price: m.price })) },
      });
      if (error) throw error;
      const ids: string[] = data?.itemIds || [];
      const reasons: Record<string, string> = data?.reasons || {};
      const list: Reco[] = ids
        .map((id) => menuItems.find((m) => m.id === id))
        .filter(Boolean)
        .map((item) => ({ item: item as MenuItem, reason: reasons[(item as MenuItem).id] || 'AI suggestion' }));
      if (list.length) setRecos(list);
    } catch (e) {
      console.error('AI reco failed', e);
    } finally {
      setLoading(false);
    }
  }, [hotelId, menuItems]);

  return { recos, loading, refresh: compute, askAI };
}
