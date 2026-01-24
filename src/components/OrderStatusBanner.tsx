import { Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';

export function OrderStatusBanner() {
  const { currentOrder } = useOrders();
  const { t } = useLanguage();

  if (!currentOrder) return null;

  const isConfirmed = currentOrder.order_status === 'Confirmed';

  return (
    <div
      className={`w-full py-3 px-4 flex items-center justify-center gap-2 ${
        isConfirmed
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      }`}
    >
      {isConfirmed ? (
        <>
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{t('orderConfirmed')}</span>
        </>
      ) : (
        <>
          <Clock className="h-5 w-5 animate-pulse" />
          <span className="font-medium">{t('waitingConfirmation')}</span>
        </>
      )}
    </div>
  );
}
