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

    // Call edge function to create server with admin privileges
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-server`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          phoneNumber,
          assignedTables,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create server');
    }

    await fetchServers();
    return result.user;
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
