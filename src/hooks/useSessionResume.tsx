import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { Loader2 } from 'lucide-react';

/**
 * SessionResume component handles automatic navigation based on order stage
 * This should wrap the menu page or be called on app load
 * 
 * IMPORTANT: This hook only triggers on INITIAL page load.
 * If the user is navigating between pages (e.g., from order-status to menu to add items),
 * the redirect should NOT happen.
 */
export function useSessionResume() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrder, isLoading: ordersLoading } = useOrders();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || ordersLoading) return;
    // Guests are anonymous now — resume based on currentOrder regardless of `user`
    if (!currentOrder) return;

    const orderStage = (currentOrder as any).order_stage;

    // If order is completed, no resume needed
    if (orderStage === 'completed' || currentOrder.payment_confirmed) {
      return;
    }

    // Check if user explicitly navigated to menu/cart/checkout to add items
    // This prevents redirecting users who are intentionally adding extra items
    const allowedPagesForAddingItems = ['/menu', '/cart', '/checkout'];
    const isAddingItems = allowedPagesForAddingItems.includes(location.pathname);
    
    // If the order is confirmed and user is on menu/cart/checkout, allow them to add items
    if (isAddingItems && orderStage === 'order_confirmed') {
      return; // Don't redirect - user is adding extra items
    }

    // Resume based on order stage - only on initial load (e.g., landing on /)
    // Don't redirect if already on the right pages
    switch (orderStage) {
      case 'cart':
        // Stay on menu, cart is preserved
        break;
      case 'order_confirmed':
        // Only redirect if not already on order-status or actively adding items
        if (location.pathname !== '/order-status' && !isAddingItems) {
          navigate('/order-status');
        }
        break;
      case 'finished_eating':
      case 'payment_selected':
        // Navigate to order status page
        if (location.pathname !== '/order-status') {
          navigate('/order-status');
        }
        break;
      default:
        break;
    }
  }, [user, currentOrder, authLoading, ordersLoading, navigate, location.pathname]);
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
