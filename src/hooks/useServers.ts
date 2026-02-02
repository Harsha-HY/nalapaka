import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Server {
  id: string;
  user_id: string;
  name: string;
  phone_number: string | null;
  assigned_tables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useServers() {
  const { user, isManager } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);

  const fetchServers = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setServers((data || []) as Server[]);
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchCurrentServer = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCurrentServer(data as Server | null);
    } catch (error) {
      console.error('Error fetching current server:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isManager) {
      fetchServers();
    }
    fetchCurrentServer();
  }, [fetchServers, fetchCurrentServer, isManager]);

  const createServerAccount = async (
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    assignedTables: string[]
  ) => {
    if (!isManager) throw new Error('Only managers can create servers');

    // Use signUp to create the user (will require email confirmation)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error('Failed to create user');
    
    // Add to servers table
    const { error: serverError } = await supabase
      .from('servers')
      .insert({
        user_id: signUpData.user.id,
        name,
        phone_number: phoneNumber,
        assigned_tables: assignedTables,
      });
    
    if (serverError) throw serverError;
    
    // Note: The user role will be updated to 'server' by the trigger or manually
    // For now, we need to update it via a migration or edge function
    // The handle_new_user trigger creates 'customer' role by default
    
    await fetchServers();
    return signUpData.user;
  };

  const updateServer = async (
    serverId: string,
    updates: Partial<Pick<Server, 'name' | 'phone_number' | 'assigned_tables' | 'is_active'>>
  ) => {
    if (!isManager) throw new Error('Only managers can update servers');

    const { error } = await supabase
      .from('servers')
      .update(updates)
      .eq('id', serverId);
    
    if (error) throw error;
    await fetchServers();
  };

  const deleteServer = async (serverId: string) => {
    if (!isManager) throw new Error('Only managers can delete servers');

    const { error } = await supabase
      .from('servers')
      .delete()
      .eq('id', serverId);
    
    if (error) throw error;
    await fetchServers();
  };

  const getServerForTable = (tableNumber: string): Server | undefined => {
    return servers.find(s => s.is_active && s.assigned_tables.includes(tableNumber));
  };

  const resetServerPassword = async (serverUserId: string, newPassword: string) => {
    // This requires admin access - would typically be done via edge function
    throw new Error('Password reset requires admin access');
  };

  return {
    servers,
    currentServer,
    isLoading,
    fetchServers,
    createServerAccount,
    updateServer,
    deleteServer,
    getServerForTable,
    resetServerPassword,
  };
}
