import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { setGuestHotel } from '@/hooks/useHotelContext';
import { getDeviceId } from '@/hooks/useDevice';
import { ensureAnonSession } from '@/hooks/useAnonAuth';
import { Loader2, UtensilsCrossed, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * GuestEntry: customer scans QR code → /guest/:hotelSlug
 *
 * - Silently establish anon session
 * - Resolve hotel from slug
 * - If the customer ALREADY has an unpaid / in-progress order at this hotel,
 *   prompt them: Stay on the same order, or Start a new one.
 *   - Pending order (not yet confirmed) → auto-resume (no prompt)
 *   - Otherwise show choice
 */

type ActiveOrder = {
  id: string;
  order_status: string;
  order_stage: string | null;
  payment_confirmed: boolean;
  table_number: string;
  total_amount: number;
};

export default function GuestEntry() {
  const navigate = useNavigate();
  const { hotelSlug } = useParams<{ hotelSlug?: string }>();
  const [status, setStatus] = useState('Loading menu...');
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [resolvedHotel, setResolvedHotel] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        getDeviceId();
        await ensureAnonSession();

        let hotel: { id: string; name: string; slug: string } | null = null;

        if (hotelSlug) {
          const { data, error } = await supabase
            .from('hotels')
            .select('id, name, slug, is_active')
            .eq('slug', hotelSlug)
            .maybeSingle();

          if (cancelled) return;
          if (error || !data || !data.is_active) {
            setStatus('This restaurant is not available. Please scan a valid QR code.');
            return;
          }
          hotel = { id: data.id, name: data.name, slug: data.slug };
        } else {
          const { data: fallback } = await supabase
            .from('hotels')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          if (fallback) hotel = { id: fallback.id, name: fallback.name, slug: fallback.slug };
        }

        if (!hotel) {
          setStatus('No restaurant found.');
          return;
        }

        setGuestHotel(hotel);
        setResolvedHotel(hotel);

        // Look for an active order belonging to this customer at this hotel
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) navigate('/menu', { replace: true });
          return;
        }

        const { data: orderRows } = await supabase
          .from('orders')
          .select('id, order_status, order_stage, payment_confirmed, table_number, total_amount')
          .eq('user_id', user.id)
          .eq('hotel_id', hotel.id)
          .neq('order_stage', 'completed')
          .eq('payment_confirmed', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (cancelled) return;

        const active = (orderRows && orderRows[0]) as ActiveOrder | undefined;

        if (!active) {
          navigate('/menu', { replace: true });
          return;
        }

        // If still pending (not yet accepted/confirmed) — silently resume to status page
        if (active.order_status === 'Pending') {
          navigate('/order-status', { replace: true });
          return;
        }

        // Otherwise — there's a confirmed/in-progress order. Ask.
        setActiveOrder(active);
      } catch (err) {
        console.error('Guest entry error:', err);
        if (!cancelled) setStatus('Something went wrong. Please refresh and try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hotelSlug, navigate]);

  const handleStay = () => {
    navigate('/order-status', { replace: true });
  };

  const handleStartNew = async () => {
    if (!activeOrder) return;
    setWorking(true);
    try {
      // Mark the previous order as completed so a fresh one can begin.
      // (Customer is choosing to abandon adding to it.)
      const { error } = await supabase
        .from('orders')
        .update({ order_stage: 'completed' } as any)
        .eq('id', activeOrder.id);
      if (error) throw error;
      toast.success('Starting a new order');
      navigate('/menu', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Could not start a new order. Please try again.');
      setWorking(false);
    }
  };

  if (activeOrder && resolvedHotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Welcome back to {resolvedHotel.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-center">
              You already have an active order at <strong>Table {activeOrder.table_number}</strong> ·{' '}
              <strong>₹{activeOrder.total_amount}</strong>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Do you want to stay on the same order or start a new one?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={handleStay} disabled={working} className="h-14">
                <UtensilsCrossed className="h-5 w-5 mr-2" />
                Stay on current order
              </Button>
              <Button
                onClick={handleStartNew}
                disabled={working}
                variant="outline"
                className="h-14"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Start a new order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
