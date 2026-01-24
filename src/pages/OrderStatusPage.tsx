import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Home, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function OrderStatusPage() {
  const { t, language } = useLanguage();
  const { currentOrder, updatePayment } = useOrders();
  const navigate = useNavigate();

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-xl text-muted-foreground mb-4">No active order</p>
        <Button onClick={() => navigate('/menu')}>
          <Home className="h-4 w-4 mr-2" />
          Back to Menu
        </Button>
      </div>
    );
  }

  const isConfirmed = currentOrder.order_status === 'Confirmed';
  const isPaid = currentOrder.payment_mode !== 'Not Paid';
  const orderedItems = currentOrder.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const handleCashPayment = async () => {
    try {
      await updatePayment(currentOrder.id, 'Cash');
      toast.success('Payment marked as Cash');
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const handleOnlinePayment = () => {
    // UPI deep link with test UPI ID
    const upiId = '8951525788@ybl';
    const amount = currentOrder.total_amount;
    const name = 'Nalapaka Nanjangud';
    const note = `Order for Table ${currentOrder.table_number}`;
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}`;
    
    window.location.href = upiUrl;
    
    // After a delay, update payment status
    setTimeout(async () => {
      try {
        await updatePayment(currentOrder.id, 'Online');
        toast.success('Payment updated');
      } catch (error) {
        // User might cancel, so just log
        console.log('Payment update pending');
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Status banner */}
      <div
        className={`w-full py-6 px-4 flex flex-col items-center gap-2 ${
          isConfirmed
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
        }`}
      >
        {isConfirmed ? (
          <>
            <CheckCircle className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-center">{t('orderConfirmed')}</h1>
          </>
        ) : (
          <>
            <Clock className="h-12 w-12 animate-pulse" />
            <h1 className="text-2xl font-bold text-center">{t('waitingConfirmation')}</h1>
          </>
        )}
      </div>

      <main className="flex-1 container py-6 space-y-6">
        {/* Order details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tableNumber')}</span>
                <span className="font-medium">{currentOrder.table_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('customerName')}</span>
                <span className="font-medium">{currentOrder.customer_name}</span>
              </div>
              <Separator className="my-2" />
              {orderedItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {language === 'kn' ? item.nameKn : item.name} × {item.quantity}
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>{t('total')}</span>
                <span className="text-primary">₹{currentOrder.total_amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment options - show after order is confirmed */}
        {isConfirmed && !isPaid && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('paymentOptions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-lg"
                onClick={handleCashPayment}
              >
                <Banknote className="h-6 w-6 mr-3" />
                {t('cash')}
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-lg"
                onClick={handleOnlinePayment}
              >
                <Smartphone className="h-6 w-6 mr-3" />
                {t('onlinePayment')} (UPI)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment status */}
        {isPaid && (
          <Card className="border-green-500">
            <CardContent className="py-6 text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-2 text-green-600" />
              <p className="text-lg font-medium text-green-600">
                {t('paid')} - {currentOrder.payment_mode}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Back to menu */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => navigate('/menu')}
        >
          <Home className="h-4 w-4 mr-2" />
          {t('menu')}
        </Button>
      </main>
    </div>
  );
}
