import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHotelContext } from '@/hooks/useHotelContext';
import type { Database } from '@/integrations/supabase/types';

type OrderRow = Database['public']['Tables']['orders']['Row'];

export type Order = OrderRow & {
  order_type?: 'dine-in' | 'parcel';
  wait_time_minutes?: number | null;
  confirmed_at?: string | null;
  payment_intent?: string | null;
  archived_at?: string | null;
  seats?: string[];
  order_stage?: 'cart' | 'order_confirmed' | 'finished_eating' | 'payment_selected' | 'completed';
  base_items?: any[];
  extra_items?: any[];
  accepted_by_server_id?: string | null;
  accepted_by_server_name?: string | null;
  server_accepted_at?: string | null;
};

type OrderInsert = Database['public']['Tables']['orders']['Insert'];

export function useOrders() {
  const { user, isManager } = useAuth();
  const { hotelId } = useHotelContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Customers only need their own orders — much faster query
      if (!isManager) {
        query = query.eq('user_id', user.id).limit(20);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setOrders((data || []) as Order[]);
      
      // Set current order (most recent active order for customer)
      if (!isManager && data && data.length > 0) {
        const activeOrder = data.find(o => 
          o.order_stage !== 'completed' && 
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

  // Subscribe to realtime updates — stable subscription, no dependency on currentOrder
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
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updated.id ? updated : order
              )
            );
            // Update current order using functional setter to avoid stale ref
            setCurrentOrder((prev) => {
              if (prev?.id === updated.id) {
                // Trigger haptic feedback for confirmation
                if (updated.order_status === 'Confirmed' && prev.order_status !== 'Confirmed') {
                  if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                  }
                }
                return updated;
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== (payload.old as Order).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createOrder = async (orderData: Omit<OrderInsert, 'user_id'> & { 
    order_type?: 'dine-in' | 'parcel';
    seats?: string[];
  }) => {
    if (!user) throw new Error('User not authenticated');
    if (!hotelId) throw new Error('No hotel selected. Please scan a QR code at your table.');

    const baseItems = orderData.ordered_items || [];

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        user_id: user.id,
        hotel_id: hotelId,
        order_type: orderData.order_type || 'dine-in',
        seats: orderData.seats || [],
        order_stage: 'cart',
        base_items: baseItems,
        extra_items: [],
      } as any)
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
    const existingExtra = ((currentOrderData as any).extra_items as any[]) || [];
    
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

    // Track extra items with timestamp for manager visibility
    const extraItemsWithTime = newItems.map(item => ({
      ...item,
      addedAt: new Date().toISOString(),
    }));

    const newTotal = currentOrderData.total_amount + additionalAmount;

    const { error } = await supabase
      .from('orders')
      .update({ 
        ordered_items: mergedItems,
        total_amount: newTotal,
        extra_items: [...existingExtra, ...extraItemsWithTime],
      } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  // Server accepts an order — marks server assignment and notifies downstream dashboards
  const serverAcceptOrder = async (orderId: string, serverUserId: string, serverName: string) => {
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from('orders')
      .update({
        accepted_by_server_id: serverUserId,
        accepted_by_server_name: serverName,
        server_accepted_at: nowIso,
        order_status: 'Confirmed',
        confirmed_at: nowIso,
        order_stage: 'order_confirmed',
      } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  // Kitchen accepts an order — final kitchen acknowledgement for preparation
  const kitchenAcceptOrder = async (orderId: string, kitchenName: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        accepted_by_kitchen_name: kitchenName,
        kitchen_accepted_at: new Date().toISOString(),
        order_status: 'Confirmed',
        confirmed_at: new Date().toISOString(),
        order_stage: 'order_confirmed',
      } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  // Kitchen marks order as prepared
  const kitchenMarkPrepared = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        kitchen_prepared_at: new Date().toISOString(),
      } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  const confirmOrder = async (orderId: string, waitTimeMinutes?: number) => {
    const updateData: any = { 
      order_status: 'Confirmed',
      confirmed_at: new Date().toISOString(),
      order_stage: 'order_confirmed',
    };
    
    if (waitTimeMinutes !== undefined && waitTimeMinutes > 0) {
      updateData.wait_time_minutes = waitTimeMinutes;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
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
      .update({ 
        eating_finished: true,
        order_stage: 'finished_eating',
      } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  const confirmPayment = async (orderId: string, paymentMode: 'Cash' | 'Online') => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_confirmed: true,
        payment_mode: paymentMode,
        order_stage: 'completed',
      } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  const updatePaymentIntent = async (orderId: string, intent: 'Cash' | 'UPI') => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_intent: intent,
        order_stage: 'payment_selected',
      } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  const updateOrderStage = async (orderId: string, stage: Order['order_stage']) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_stage: stage } as any)
      .eq('id', orderId);

    if (error) throw error;
  };

  const deleteDayHistory = async (date: string) => {
    // Delete all orders from a specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { error } = await supabase
      .from('orders')
      .delete()
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error) throw error;
    
    // Refresh orders
    await fetchOrders();
  };

  const archiveTodayOrders = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { error } = await supabase
      .from('orders')
      .update({ archived_at: new Date().toISOString() } as any)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .eq('payment_confirmed', true);

    if (error) throw error;
    await fetchOrders();
  };

  const cleanupPreparedOlderThan24Hours = async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('orders')
      .update({ archived_at: new Date().toISOString() } as any)
      .not('kitchen_prepared_at', 'is', null)
      .lt('kitchen_prepared_at', cutoff)
      .is('archived_at', null)
      .eq('payment_confirmed', false);

    if (error) throw error;
  };

  // Get today's completed orders for summary
  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && o.payment_confirmed;
    });

    return {
      totalOrders: completedToday.length,
      totalRevenue: completedToday.reduce((sum, o) => sum + o.total_amount, 0),
    };
  };

  return {
    orders,
    currentOrder,
    isLoading,
    createOrder,
    addItemsToOrder,
    serverAcceptOrder,
    kitchenAcceptOrder,
    kitchenMarkPrepared,
    confirmOrder,
    cancelOrder,
    deleteOrder,
    updatePayment,
    markEatingFinished,
    confirmPayment,
    updatePaymentIntent,
    updateOrderStage,
    deleteDayHistory,
    archiveTodayOrders,
    cleanupPreparedOlderThan24Hours,
    getTodayStats,
    refreshOrders: fetchOrders,
  };
}
