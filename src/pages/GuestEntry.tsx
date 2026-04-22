import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { setGuestHotel } from '@/hooks/useHotelContext';
import { getDeviceId } from '@/hooks/useDevice';
import { ensureAnonSession } from '@/hooks/useAnonAuth';
import { Loader2 } from 'lucide-react';

/**
 * GuestEntry: customer scans QR code → /guest/:hotelSlug
 *
 * NO sign-up, NO sign-in UI, NO permission prompt — but we DO silently
 * create an anonymous Supabase session so RLS can protect this customer's
 * orders by auth.uid() instead of a guessable device_id.
 */
export default function GuestEntry() {
  const navigate = useNavigate();
  const { hotelSlug } = useParams<{ hotelSlug?: string }>();
  const [status, setStatus] = useState('Loading menu...');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Local profile id (still used for autofill of name/phone in checkout)
        getDeviceId();

        // Silently create / restore an anonymous Supabase session BEFORE we
        // navigate to /menu, so RLS-protected reads/writes succeed.
        await ensureAnonSession();

        if (hotelSlug) {
          const { data: hotel, error } = await supabase
            .from('hotels')
            .select('id, name, slug, is_active, address, phone, tagline')
            .eq('slug', hotelSlug)
            .maybeSingle();

          if (cancelled) return;
          if (error || !hotel || !hotel.is_active) {
            setStatus('This restaurant is not available. Please scan a valid QR code.');
            return;
          }

          setGuestHotel({ id: hotel.id, name: hotel.name, slug: hotel.slug });
        } else {
          // Legacy /guest with no slug — fall back to first active hotel
          const { data: fallback } = await supabase
            .from('hotels')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          if (fallback) {
            setGuestHotel({ id: fallback.id, name: fallback.name, slug: fallback.slug });
          }
        }

        if (!cancelled) navigate('/menu', { replace: true });
      } catch (err) {
        console.error('Guest entry error:', err);
        if (!cancelled) setStatus('Something went wrong. Please refresh and try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hotelSlug, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
