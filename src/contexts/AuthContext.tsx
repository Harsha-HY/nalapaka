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
    // Safety timeout - never stay loading more than 3 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout - forcing complete');
        setIsLoading(false);
      }
    }, 3000);

    // Get existing session first for fast load
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        setRoleLoading(true);
        fetchUserRole(existingSession.user.id).then((userRole) => {
          setRole(userRole);
          setRoleLoading(false);
          setIsLoading(false);
          initialized.current = true;
        });
      } else {
        setIsLoading(false);
        initialized.current = true;
      }
    });

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' && !initialized.current) return; // skip duplicate of getSession

      if (event === 'SIGNED_IN') {
        // If same user is already loaded, just update session refs — don't re-fetch role
        if (newSession?.user && user?.id === newSession.user.id && role) {
          setSession(newSession);
          return;
        }
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setRoleLoading(true);
          const userRole = await fetchUserRole(newSession.user.id);
          setRole(userRole);
          setRoleLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
      } else if (event === 'TOKEN_REFRESHED') {
        // Only update session/user refs — do NOT re-fetch role (it hasn't changed)
        setSession(newSession);
        if (newSession?.user) {
          setUser(prev => prev?.id === newSession.user.id ? prev : newSession.user);
        }
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
