import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  name: string | null;
  phone_number: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, phone_number')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      setProfile(data as Profile | null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const upsertProfile = async (name: string, phoneNumber: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase
        .from('profiles')
        .update({ name, phone_number: phoneNumber })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('profiles')
        .insert({ user_id: user.id, name, phone_number: phoneNumber });
    }

    setProfile({ name, phone_number: phoneNumber });
  };

  return { profile, isLoading, upsertProfile, fetchProfile };
}
