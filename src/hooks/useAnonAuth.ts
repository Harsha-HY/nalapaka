// Silent anonymous Supabase sign-in for guest customers.
// Customers never see a login UI. We just create an anonymous JWT in the
// background so RLS can scope orders/seats to auth.uid() (instead of a
// guessable device_id). Same device = same anon user across visits, because
// the session is persisted in localStorage by the Supabase client.

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

let inflight: Promise<void> | null = null;

/**
 * Ensures there's some Supabase session for the current device.
 * - If a real (staff) session already exists, do nothing.
 * - If an anonymous session already exists, do nothing.
 * - Otherwise call signInAnonymously() once.
 */
export async function ensureAnonSession(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return; // any session (real or anon) is fine
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error('Anonymous sign-in failed:', error.message);
    } catch (e) {
      console.error('ensureAnonSession error:', e);
    }
  })();
  try {
    await inflight;
  } finally {
    // allow future callers to retry if needed
    inflight = null;
  }
}

/**
 * Hook variant — fires ensureAnonSession() on mount and exposes ready flag.
 */
export function useAnonAuth() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    ensureAnonSession().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return { ready };
}
