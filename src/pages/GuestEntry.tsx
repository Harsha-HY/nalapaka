import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { setGuestHotel } from '@/hooks/useHotelContext';
import { Loader2 } from 'lucide-react';

/**
 * GuestEntry: scans QR code → /guest/:hotelSlug
 * - Resolves hotel by slug, caches it for the customer's session
 * - Creates a device-bound guest auth user (silent, no UI)
 * - Redirects to /menu
 */
export default function GuestEntry() {
  const navigate = useNavigate();
  const { hotelSlug } = useParams<{ hotelSlug?: string }>();
  const [status, setStatus] = useState('Setting up your menu...');

  useEffect(() => {
    handleGuestEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelSlug]);

  const handleGuestEntry = async () => {
    try {
      // 1) Resolve hotel from slug — required so customer's order has a hotel_id
      let resolvedHotel: { id: string; name: string; slug: string } | null = null;
      if (hotelSlug) {
        const { data: hotel } = await supabase
          .from('hotels')
          .select('id, name, slug, is_active')
          .eq('slug', hotelSlug)
          .maybeSingle();
        if (!hotel || !hotel.is_active) {
          setStatus('This restaurant is not available. Please scan a valid QR code.');
          return;
        }
        resolvedHotel = { id: hotel.id, name: hotel.name, slug: hotel.slug };
        setGuestHotel(resolvedHotel);
      } else {
        // No slug — fallback to first active hotel for legacy QR support
        const { data: fallback } = await supabase
          .from('hotels')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (fallback) {
          resolvedHotel = { id: fallback.id, name: fallback.name, slug: fallback.slug };
          setGuestHotel(resolvedHotel);
        }
      }

      // 2) Already signed in? Just go to menu
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/menu', { replace: true });
        return;
      }

      // 3) Device-bound guest credentials
      let deviceId = localStorage.getItem('dh_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('dh_device_id', deviceId);
      }

      const email = `guest-${deviceId}@dininghub.guest`;
      const password = `guest-pwd-${deviceId}`;

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError) {
        navigate('/menu', { replace: true });
        return;
      }

      setStatus('Creating your account...');
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        console.error('Guest signup error:', signUpError);
        setStatus('Something went wrong. Please try again.');
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        console.error('Guest login error:', loginError);
        setStatus('Something went wrong. Please try again.');
        return;
      }

      navigate('/menu', { replace: true });
    } catch (err) {
      console.error('Guest entry error:', err);
      setStatus('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
