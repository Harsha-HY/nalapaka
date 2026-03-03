import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  const initialized = useRef(false);

  const isManager = role === 'manager';
  const isServer = role === 'server';
  const isKitchen = role === 'kitchen';

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error || !data?.role) return 'customer';
      return data.role as UserRole;
    } catch {
      return 'customer';
    }
  };

  useEffect(() => {
    // Safety timeout - never stay loading more than 5 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout - forcing complete');
        setIsLoading(false);
      }
    }, 5000);

    // Single initialization via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth event:', event);

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setRoleLoading(true);
          const userRole = await fetchUserRole(newSession.user.id);
          setRole(userRole);
          setRoleLoading(false);
        } else {
          setRole(null);
        }
        setIsLoading(false);
        initialized.current = true;
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      value={{ user, session, isManager, isServer, isKitchen, role, isLoading, roleLoading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
