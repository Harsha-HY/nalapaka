import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type UserRole = 'super_admin' | 'manager' | 'server' | 'customer' | 'kitchen';

interface HotelContext {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isSuperAdmin: boolean;
  isManager: boolean;
  isServer: boolean;
  isKitchen: boolean;
  role: UserRole | null;
  hotel: HotelContext | null;
  authReady: boolean;          // true once initial session check is done — never flips back
  isLoading: boolean;          // alias of !authReady, kept for back-compat
  roleLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_CACHE_KEY = 'dh_role_cache_v1';
const HOTEL_CACHE_KEY = 'dh_hotel_cache_v1';

function readRoleCache(userId: string): UserRole | null {
  try {
    const raw = localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.userId === userId ? (parsed.role as UserRole) : null;
  } catch {
    return null;
  }
}

function writeRoleCache(userId: string, role: UserRole) {
  try {
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, role }));
  } catch {}
}

function readHotelCache(userId: string): HotelContext | null {
  try {
    const raw = localStorage.getItem(HOTEL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.userId === userId ? (parsed.hotel as HotelContext) : null;
  } catch {
    return null;
  }
}

function writeHotelCache(userId: string, hotel: HotelContext | null) {
  try {
    if (hotel) {
      localStorage.setItem(HOTEL_CACHE_KEY, JSON.stringify({ userId, hotel }));
    } else {
      localStorage.removeItem(HOTEL_CACHE_KEY);
    }
  } catch {}
}

function clearAllAuthCache() {
  try {
    localStorage.removeItem(ROLE_CACHE_KEY);
    localStorage.removeItem(HOTEL_CACHE_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [hotel, setHotel] = useState<HotelContext | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const initialized = useRef(false);

  const isSuperAdmin = role === 'super_admin';
  const isManager = role === 'manager';
  const isServer = role === 'server';
  const isKitchen = role === 'kitchen';

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data?.role) return 'customer';
      return data.role as UserRole;
    } catch {
      return 'customer';
    }
  };

  const fetchUserHotel = async (userId: string): Promise<HotelContext | null> => {
    try {
      const { data: member } = await supabase
        .from('hotel_members')
        .select('hotel_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!member?.hotel_id) return null;
      const { data: h } = await supabase
        .from('hotels')
        .select('id, name, slug')
        .eq('id', member.hotel_id)
        .maybeSingle();
      return h ? { id: h.id, name: h.name, slug: h.slug } : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // 3-second safety: never block UI forever
    const timeout = setTimeout(() => {
      if (!authReady) {
        console.warn('Auth ready timeout — forcing complete');
        setAuthReady(true);
      }
    }, 3000);

    // Initial session restore (fast path with cached role)
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        const u = existingSession.user;
        setSession(existingSession);
        setUser(u);

        // Hydrate role + hotel from cache instantly so dashboards can render with no spinner
        const cachedRole = readRoleCache(u.id);
        const cachedHotel = readHotelCache(u.id);
        if (cachedRole) setRole(cachedRole);
        if (cachedHotel) setHotel(cachedHotel);

        // Mark auth ready immediately if we have a cache hit (no spinner)
        if (cachedRole) {
          setAuthReady(true);
          initialized.current = true;
        } else {
          setRoleLoading(true);
        }

        // Refresh role + hotel in background; if it changed, update state + cache
        (async () => {
          const fresh = await fetchUserRole(u.id);
          if (fresh !== cachedRole) {
            setRole(fresh);
            writeRoleCache(u.id, fresh);
          }

          if (fresh === 'manager' || fresh === 'server' || fresh === 'kitchen') {
            const freshHotel = await fetchUserHotel(u.id);
            if (JSON.stringify(freshHotel) !== JSON.stringify(cachedHotel)) {
              setHotel(freshHotel);
              writeHotelCache(u.id, freshHotel);
            }
          } else {
            setHotel(null);
            writeHotelCache(u.id, null);
          }

          setRoleLoading(false);
          if (!authReady) {
            setAuthReady(true);
            initialized.current = true;
          }
        })();
      } else {
        setAuthReady(true);
        initialized.current = true;
      }
    });

    // Subsequent auth events — DO NOT re-fetch role unless user truly changed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Skip the very first SIGNED_IN that mirrors getSession
      if (event === 'SIGNED_IN' && !initialized.current) return;

      if (event === 'SIGNED_IN') {
        // If same user already loaded, just refresh refs — NEVER touch loading or role
        if (newSession?.user && user?.id === newSession.user.id && role) {
          setSession(newSession);
          return;
        }
        // New user — fetch role + hotel
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const u = newSession.user;
          const cachedRole = readRoleCache(u.id);
          const cachedHotel = readHotelCache(u.id);
          if (cachedRole) setRole(cachedRole);
          if (cachedHotel) setHotel(cachedHotel);
          if (!cachedRole) setRoleLoading(true);

          (async () => {
            const fresh = await fetchUserRole(u.id);
            setRole(fresh);
            writeRoleCache(u.id, fresh);
            if (fresh === 'manager' || fresh === 'server' || fresh === 'kitchen') {
              const freshHotel = await fetchUserHotel(u.id);
              setHotel(freshHotel);
              writeHotelCache(u.id, freshHotel);
            } else {
              setHotel(null);
              writeHotelCache(u.id, null);
            }
            setRoleLoading(false);
          })();
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
        setHotel(null);
        clearAllAuthCache();
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // ONLY update session ref. Do NOT touch role, hotel, loading, or authReady.
        setSession(newSession);
        if (newSession?.user) {
          setUser(prev => (prev?.id === newSession.user.id ? prev : newSession.user));
        }
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    clearAllAuthCache();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setHotel(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isSuperAdmin,
        isManager,
        isServer,
        isKitchen,
        role,
        hotel,
        authReady,
        isLoading: !authReady,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
