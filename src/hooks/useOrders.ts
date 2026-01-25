import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  eating_finished?: boolean;
  payment_confirmed?: boolean;
};
type OrderInsert = Database['public']['Tables']['orders']['Insert'];

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
      setOrders((data || []) as Order[]);
      
      // Set current order (most recent active order for customer)
      if (!isManager && data && data.length > 0) {
        const activeOrder = data.find(o => 
          (o.order_status === 'Pending' || o.order_status === 'Confirmed') && 
          !o.payment_confirmed
        );
        setCurrentOrder((activeOrder as Order) || null);
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
    setCurrentOrder(data as Order);
    return data;
  };

  const addItemsToOrder = async (orderId: string, newItems: any[], additionalAmount: number) => {
    if (!user) throw new Error('User not authenticated');

    // Get current order
    const { data: currentOrderData, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;

    const existingItems = (currentOrderData.ordered_items as any[]) || [];
    
    // Merge items - add quantities if same item exists
    const mergedItems = [...existingItems];
    newItems.forEach(newItem => {
      const existingIndex = mergedItems.findIndex(item => item.name === newItem.name);
      if (existingIndex >= 0) {
        mergedItems[existingIndex].quantity += newItem.quantity;
      } else {
        mergedItems.push(newItem);
      }
    });

    const newTotal = currentOrderData.total_amount + additionalAmount;

    const { error } = await supabase
      .from('orders')
      .update({ 
        ordered_items: mergedItems,
        total_amount: newTotal 
      })
      .eq('id', orderId);

    if (error) throw error;
  };

  const confirmOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'Confirmed' })
      .eq('id', orderId);

    if (error) throw error;
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'Cancelled' })
      .eq('id', orderId);

    if (error) throw error;
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const updatePayment = async (orderId: string, paymentMode: 'Cash' | 'Online') => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_mode: paymentMode })
      .eq('id', orderId);

    if (error) throw error;
  };

  const markEatingFinished = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ eating_finished: true })
      .eq('id', orderId);

    if (error) throw error;
  };

  const confirmPayment = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_confirmed: true })
      .eq('id', orderId);

    if (error) throw error;
  };

  return {
    orders,
    currentOrder,
    isLoading,
    createOrder,
    addItemsToOrder,
    confirmOrder,
    cancelOrder,
    deleteOrder,
    updatePayment,
    markEatingFinished,
    confirmPayment,
    refreshOrders: fetchOrders,
  };
}
