import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHotelContext } from '@/hooks/useHotelContext';
import { getDeviceId } from '@/hooks/useDevice';
import { ensureAnonSession } from '@/hooks/useAnonAuth';
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

  const deviceId = getDeviceId();

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // Customers (no role) need an anon session before they can read anything
      if (!isManager) {
        await ensureAnonSession();
      }

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (user && isManager) {
        // Manager sees all orders for their hotel (RLS handles scoping)
      } else {
        // Customer (anon or real) — RLS already restricts to auth.uid(),
        // but we still cap the row count for perf.
        query = query.limit(20);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders((data || []) as Order[]);

      if (!isManager && data && data.length > 0) {
        const activeOrder = data.find(
          (o) => o.order_stage !== 'completed' && !o.payment_confirmed
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

  // Realtime: instantly refresh whenever any order row changes.
  // RLS still gates which rows each subscriber actually receives.
  useEffect(() => {
    const channel = supabase
      .channel('orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    // Lightweight safety-net poll (every 20s) in case a realtime event is missed
    const interval = setInterval(() => fetchOrders(), 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const createOrder = async (
    orderData: Omit<OrderInsert, 'user_id'> & {
      order_type?: 'dine-in' | 'parcel';
      seats?: string[];
    }
  ) => {
    if (!hotelId) throw new Error('No hotel selected. Please scan a QR code at your table.');

    // Make sure we have a Supabase session (anon for guests). Without it the
    // RLS INSERT policy on orders will reject the row.
    await ensureAnonSession();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Could not establish a session. Please try again.');

    const baseItems = orderData.ordered_items || [];

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        user_id: authUser.id,
        device_id: deviceId, // kept for analytics / cross-device tracking only
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
    const { data: currentOrderData, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;

    const existingItems = (currentOrderData.ordered_items as any[]) || [];
    const existingExtra = ((currentOrderData as any).extra_items as any[]) || [];

    const mergedItems = [...existingItems];
    newItems.forEach((newItem) => {
      const idx = mergedItems.findIndex((item) => item.name === newItem.name);
      if (idx >= 0) mergedItems[idx].quantity += newItem.quantity;
      else mergedItems.push(newItem);
    });

    const extraItemsWithTime = newItems.map((item) => ({ ...item, addedAt: new Date().toISOString() }));
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

  const kitchenMarkPrepared = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ kitchen_prepared_at: new Date().toISOString() } as any)
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
    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
    if (error) throw error;
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ order_status: 'Cancelled' }).eq('id', orderId);
    if (error) throw error;
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const updatePayment = async (orderId: string, paymentMode: 'Cash' | 'Online') => {
    const { error } = await supabase.from('orders').update({ payment_mode: paymentMode }).eq('id', orderId);
    if (error) throw error;
  };

  const markEatingFinished = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ eating_finished: true, order_stage: 'finished_eating' } as any)
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
      .update({ payment_intent: intent, order_stage: 'payment_selected' } as any)
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

  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = orders.filter((o) => {
      const d = new Date(o.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime() && o.payment_confirmed;
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
