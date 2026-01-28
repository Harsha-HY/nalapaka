import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { Loader2 } from 'lucide-react';

/**
 * SessionResume component handles automatic navigation based on order stage
 * This should wrap the menu page or be called on app load
 */
export function useSessionResume() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrder, isLoading: ordersLoading } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || ordersLoading) return;
    if (!user || !currentOrder) return;

    const orderStage = (currentOrder as any).order_stage;

    // If order is completed, no resume needed
    if (orderStage === 'completed' || currentOrder.payment_confirmed) {
      return;
    }

    // Resume based on order stage
    switch (orderStage) {
      case 'cart':
        // Stay on menu, cart is preserved
        break;
      case 'order_confirmed':
      case 'finished_eating':
      case 'payment_selected':
        // Navigate to order status page
        navigate('/order-status');
        break;
      default:
        break;
    }
  }, [user, currentOrder, authLoading, ordersLoading, navigate]);
}

export function SessionResumeLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Resuming your session...</p>
      </div>
    </div>
  );
}
