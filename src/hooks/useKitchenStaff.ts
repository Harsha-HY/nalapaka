import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface KitchenStaff {
  id: string;
  user_id: string;
  name: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useKitchenStaff() {
  const { user, isManager } = useAuth();
  const [kitchenStaff, setKitchenStaff] = useState<KitchenStaff[]>([]);
  const [currentKitchen, setCurrentKitchen] = useState<KitchenStaff | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKitchenStaff = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kitchen_staff')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setKitchenStaff((data || []) as KitchenStaff[]);
    } catch (error) {
      console.error('Error fetching kitchen staff:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchCurrentKitchen = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('kitchen_staff')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCurrentKitchen(data as KitchenStaff | null);
    } catch (error) {
      console.error('Error fetching current kitchen:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isManager) {
      fetchKitchenStaff();
    }
    fetchCurrentKitchen();
  }, [fetchKitchenStaff, fetchCurrentKitchen, isManager]);

  const createKitchenAccount = async (
    email: string,
    password: string,
    name: string,
    phoneNumber: string
  ) => {
    if (!isManager) throw new Error('Only managers can create kitchen accounts');

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-kitchen`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phoneNumber }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create kitchen account');
    }

    await fetchKitchenStaff();
    return result.user;
  };

  const updateKitchenStaff = async (
    staffId: string,
    updates: Partial<Pick<KitchenStaff, 'name' | 'phone_number' | 'is_active'>>
  ) => {
    if (!isManager) throw new Error('Only managers can update kitchen staff');

    const { error } = await supabase
      .from('kitchen_staff')
      .update(updates)
      .eq('id', staffId);
    
    if (error) throw error;
    await fetchKitchenStaff();
  };

  const deleteKitchenStaff = async (staffId: string) => {
    if (!isManager) throw new Error('Only managers can delete kitchen staff');

    const { error } = await supabase
      .from('kitchen_staff')
      .delete()
      .eq('id', staffId);
    
    if (error) throw error;
    await fetchKitchenStaff();
  };

  return {
    kitchenStaff,
    currentKitchen,
    isLoading,
    fetchKitchenStaff,
    createKitchenAccount,
    updateKitchenStaff,
    deleteKitchenStaff,
  };
}
