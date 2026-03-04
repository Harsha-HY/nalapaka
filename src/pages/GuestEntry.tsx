import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * GuestEntry page: handles QR code scans.
 * Auto-creates a device-specific account and redirects to menu.
 * No login/signup UI shown to the customer.
 */
export default function GuestEntry() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Setting up your menu...');

  useEffect(() => {
    handleGuestEntry();
  }, []);

  const handleGuestEntry = async () => {
    try {
      // Check if already signed in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/menu', { replace: true });
        return;
      }

      // Get or create device ID
      let deviceId = localStorage.getItem('nalapaka_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('nalapaka_device_id', deviceId);
      }

      const email = `guest-${deviceId}@nalapaka.guest`;
      const password = `guest-pwd-${deviceId}`;

      // Try to sign in first (returning guest)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        navigate('/menu', { replace: true });
        return;
      }

      // New guest - sign up
      setStatus('Creating your account...');
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('Guest signup error:', signUpError);
        setStatus('Something went wrong. Please try again.');
        return;
      }

      // Auto-confirm is enabled, so sign in immediately
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
