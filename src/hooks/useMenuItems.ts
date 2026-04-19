import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHotelContext } from '@/hooks/useHotelContext';

export interface MenuItem {
  id: string;
  name: string;
  nameKn: string;
  price: number;
  category: 'south-indian' | 'north-indian' | 'chinese' | 'tandoor';
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night' | 'all';
  isAvailable: boolean;
}

export function useMenuItems() {
  const { isManager } = useAuth();
  const { hotelId } = useHotelContext();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMenuItems = useCallback(async () => {
    try {
      let query = supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      // Scope to current hotel when known
      if (hotelId) {
        query = query.eq('hotel_id', hotelId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const items: MenuItem[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        nameKn: item.name_kn,
        price: Number(item.price),
        category: item.category as MenuItem['category'],
        timeSlot: item.time_slot as MenuItem['timeSlot'],
        isAvailable: item.is_available,
      }));

      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const toggleAvailability = useCallback(async (itemId: string, isAvailable: boolean) => {
    if (!isManager) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', itemId);

      if (error) throw error;

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable } : item
        )
      );

      return true;
    } catch (error) {
      console.error('Error toggling availability:', error);
      return false;
    }
  }, [isManager]);

  const deleteMenuItem = useCallback(async (itemId: string) => {
    if (!isManager) return false;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
      if (error) throw error;
      setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  }, [isManager]);

  return {
    menuItems,
    isLoading,
    toggleAvailability,
    deleteMenuItem,
    refreshMenuItems: fetchMenuItems,
  };
}
