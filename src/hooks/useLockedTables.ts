import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LockedTable {
  id: string;
  table_number: string;
  order_id: string;
  locked_at: string;
}

export function useLockedTables() {
  const [lockedTables, setLockedTables] = useState<LockedTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLockedTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('locked_tables')
        .select('*');
      
      if (error) throw error;
      setLockedTables(data || []);
    } catch (error) {
      console.error('Error fetching locked tables:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLockedTables();
  }, [fetchLockedTables]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('locked-tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locked_tables',
        },
        () => {
          fetchLockedTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLockedTables]);

  const isTableLocked = (tableNumber: string): boolean => {
    return lockedTables.some(lt => lt.table_number === tableNumber);
  };

  const lockTable = async (tableNumber: string, orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locked_tables')
        .insert({
          table_number: tableNumber,
          order_id: orderId,
        });
      
      if (error) {
        console.error('Error locking table:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error locking table:', error);
      return false;
    }
  };

  const unlockTable = async (tableNumber: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locked_tables')
        .delete()
        .eq('table_number', tableNumber);
      
      if (error) {
        console.error('Error unlocking table:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error unlocking table:', error);
      return false;
    }
  };

  const unlockTableByOrderId = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locked_tables')
        .delete()
        .eq('order_id', orderId);
      
      if (error) {
        console.error('Error unlocking table:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error unlocking table:', error);
      return false;
    }
  };

  return {
    lockedTables,
    isLoading,
    isTableLocked,
    lockTable,
    unlockTable,
    unlockTableByOrderId,
    refreshLockedTables: fetchLockedTables,
  };
}
