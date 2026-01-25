import { ShoppingCart, ClipboardList } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FloatingCartProps {
  hasActiveOrder?: boolean;
}

export function FloatingCart({ hasActiveOrder }: FloatingCartProps) {
  const { totalItems, totalAmount } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Show order status button if there's an active order
  if (hasActiveOrder) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {totalItems > 0 && (
          <Button
            onClick={() => navigate('/cart')}
            className="h-16 rounded-full px-6 shadow-lg bg-primary hover:bg-primary/90"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                  {totalItems}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs opacity-80">{totalItems} {t('items')}</span>
                <span className="text-sm font-bold">₹{totalAmount}</span>
              </div>
            </div>
          </Button>
        )}
        <Button
          onClick={() => navigate('/order-status')}
          variant="secondary"
          className="h-14 rounded-full px-6 shadow-lg"
        >
          <ClipboardList className="h-5 w-5 mr-2" />
          {language === 'kn' ? 'ನನ್ನ ಆರ್ಡರ್' : 'My Order'}
        </Button>
      </div>
    );
  }

  if (totalItems === 0) return null;

  return (
    <Button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 right-6 z-50 h-16 rounded-full px-6 shadow-lg bg-primary hover:bg-primary/90"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {totalItems}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-80">{totalItems} {t('items')}</span>
          <span className="text-sm font-bold">₹{totalAmount}</span>
        </div>
      </div>
    </Button>
  );
}
