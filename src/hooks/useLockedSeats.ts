import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHotelContext } from '@/hooks/useHotelContext';

interface LockedSeat {
  id: string;
  table_number: string;
  seat: string;
  order_id: string;
  locked_at: string;
}

export function useLockedSeats() {
  const { hotelId } = useHotelContext();
  const [lockedSeats, setLockedSeats] = useState<LockedSeat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLockedSeats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('locked_seats')
        .select('*');
      
      if (error) throw error;
      setLockedSeats(data || []);
    } catch (error) {
      console.error('Error fetching locked seats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLockedSeats();
  }, [fetchLockedSeats]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('locked-seats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locked_seats',
        },
        () => {
          fetchLockedSeats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLockedSeats]);

  const isSeatLocked = (tableNumber: string, seat: string): boolean => {
    return lockedSeats.some(ls => ls.table_number === tableNumber && ls.seat === seat);
  };

  const getLockedSeatsForTable = (tableNumber: string): string[] => {
    return lockedSeats
      .filter(ls => ls.table_number === tableNumber)
      .map(ls => ls.seat);
  };

  const getAvailableSeats = (tableNumber: string): string[] => {
    const allSeats = ['A', 'B', 'C', 'D'];
    const locked = getLockedSeatsForTable(tableNumber);
    return allSeats.filter(seat => !locked.includes(seat));
  };

  const lockSeats = async (tableNumber: string, seats: string[], orderId: string): Promise<boolean> => {
    if (!hotelId) {
      console.error('No hotel context for locking seats');
      return false;
    }
    try {
      const insertData = seats.map(seat => ({
        table_number: tableNumber,
        seat,
        order_id: orderId,
        hotel_id: hotelId,
      }));

      const { error } = await supabase
        .from('locked_seats')
        .insert(insertData);
      
      if (error) {
        console.error('Error locking seats:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error locking seats:', error);
      return false;
    }
  };

  const unlockSeats = async (tableNumber: string, seats: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locked_seats')
        .delete()
        .eq('table_number', tableNumber)
        .in('seat', seats);
      
      if (error) {
        console.error('Error unlocking seats:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error unlocking seats:', error);
      return false;
    }
  };

  const unlockSeatsByOrderId = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locked_seats')
        .delete()
        .eq('order_id', orderId);
      
      if (error) {
        console.error('Error unlocking seats:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error unlocking seats:', error);
      return false;
    }
  };

  const getSeatsForOrder = (orderId: string): string[] => {
    return lockedSeats
      .filter(ls => ls.order_id === orderId)
      .map(ls => ls.seat);
  };

  const resetAllSeats = async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locked_seats')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) {
        console.error('Error resetting all seats:', error);
        return false;
      }
      await fetchLockedSeats();
      return true;
    } catch (error) {
      console.error('Error resetting all seats:', error);
      return false;
    }
  };

  return {
    lockedSeats,
    isLoading,
    isSeatLocked,
    getLockedSeatsForTable,
    getAvailableSeats,
    lockSeats,
    unlockSeats,
    unlockSeatsByOrderId,
    getSeatsForOrder,
    resetAllSeats,
    refreshLockedSeats: fetchLockedSeats,
  };
}
