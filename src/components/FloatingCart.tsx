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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 animate-slide-up">
        {totalItems > 0 && (
          <Button
            onClick={() => navigate('/cart')}
            className="h-14 rounded-full px-5 shadow-elevated bg-primary hover:bg-primary/90"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {totalItems}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs opacity-90">{totalItems} {t('items')}</span>
                <span className="text-sm font-bold">₹{totalAmount}</span>
              </div>
            </div>
          </Button>
        )}
        <Button
          onClick={() => navigate('/order-status')}
          variant="secondary"
          className="h-12 rounded-full px-5 shadow-soft border border-border"
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          {language === 'kn' ? 'ನನ್ನ ಆರ್ಡರ್' : 'My Order'}
        </Button>
      </div>
    );
  }

  if (totalItems === 0) return null;

  return (
    <Button
      onClick={() => navigate('/cart')}
      className="fab h-14 rounded-full px-6 shadow-elevated bg-primary hover:bg-primary/90 animate-slide-up"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {totalItems}
          </span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-90">{totalItems} {t('items')}</span>
          <span className="text-sm font-bold">₹{totalAmount}</span>
        </div>
      </div>
    </Button>
  );
}
