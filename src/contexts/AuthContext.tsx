import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type UserRole = 'manager' | 'server' | 'customer' | 'kitchen';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isManager: boolean;
  isServer: boolean;
  isKitchen: boolean;
  role: UserRole | null;
  isLoading: boolean;
  roleLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  const isManager = role === 'manager';
  const isServer = role === 'server';
  const isKitchen = role === 'kitchen';

  // Function to fetch user role from backend
  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching role:', error);
        return 'customer';
      }
      
      return (data?.role as UserRole) || 'customer';
    } catch (error) {
      console.error('Error fetching role:', error);
      return 'customer';
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleLoading(true);
        // Use setTimeout to avoid potential deadlock
        setTimeout(async () => {
          const userRole = await fetchUserRole(session.user.id);
          console.log('User role fetched:', userRole);
          setRole(userRole);
          setRoleLoading(false);
          setIsLoading(false);
        }, 0);
      } else {
        setRole(null);
        setRoleLoading(false);
        setIsLoading(false);
      }
    });

    // Check for existing session (persistent login)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Existing session check:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleLoading(true);
        const userRole = await fetchUserRole(session.user.id);
        console.log('Existing session role:', userRole);
        setRole(userRole);
        setRoleLoading(false);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isManager,
        isServer,
        isKitchen,
        role,
        isLoading,
        roleLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
