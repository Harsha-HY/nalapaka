import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export function useOrders() {
  const { user, isManager } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
      
      // Set current order (most recent pending/confirmed order for customer)
      if (!isManager && data && data.length > 0) {
        const activeOrder = data.find(o => o.order_status === 'Pending' || o.order_status === 'Confirmed');
        setCurrentOrder(activeOrder || null);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isManager]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === (payload.new as Order).id ? (payload.new as Order) : order
              )
            );
            // Update current order if it's the one being updated
            if (currentOrder?.id === (payload.new as Order).id) {
              setCurrentOrder(payload.new as Order);
              // Trigger haptic feedback for confirmation
              if ((payload.new as Order).order_status === 'Confirmed') {
                if ('vibrate' in navigator) {
                  navigator.vibrate([100, 50, 100]);
                }
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== (payload.old as Order).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentOrder?.id]);

  const createOrder = async (orderData: Omit<OrderInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    setCurrentOrder(data);
    return data;
  };

  const confirmOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'Confirmed' })
      .eq('id', orderId);

    if (error) throw error;
  };

  const updatePayment = async (orderId: string, paymentMode: 'Cash' | 'Online') => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_mode: paymentMode })
      .eq('id', orderId);

    if (error) throw error;
  };

  return {
    orders,
    currentOrder,
    isLoading,
    createOrder,
    confirmOrder,
    updatePayment,
    refreshOrders: fetchOrders,
  };
}
