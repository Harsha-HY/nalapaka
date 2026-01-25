import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  Home, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  XCircle,
  Plus,
  UtensilsCrossed,
  History
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function OrderStatusPage() {
  const { t, language } = useLanguage();
  const { currentOrder, updatePayment, markEatingFinished } = useOrders();
  const navigate = useNavigate();
  const [hasMarkedPaid, setHasMarkedPaid] = useState(false);

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-xl text-muted-foreground mb-4">{language === 'kn' ? 'ಸಕ್ರಿಯ ಆರ್ಡರ್ ಇಲ್ಲ' : 'No active order'}</p>
        <Button onClick={() => navigate('/menu')}>
          <Home className="h-4 w-4 mr-2" />
          {t('menu')}
        </Button>
      </div>
    );
  }

  const isPending = currentOrder.order_status === 'Pending';
  const isConfirmed = currentOrder.order_status === 'Confirmed';
  const isCancelled = currentOrder.order_status === 'Cancelled';
  const eatingFinished = (currentOrder as any).eating_finished;
  const paymentConfirmed = (currentOrder as any).payment_confirmed;
  const isPaid = currentOrder.payment_mode !== 'Not Paid';

  const orderedItems = currentOrder.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const handleMarkFinished = async () => {
    try {
      await markEatingFinished(currentOrder.id);
      toast.success(language === 'kn' ? 'ಪಾವತಿ ಆಯ್ಕೆಗಳು ಸಕ್ರಿಯಗೊಂಡಿವೆ' : 'Payment options enabled');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleCashPayment = async () => {
    try {
      await updatePayment(currentOrder.id, 'Cash');
      toast.success(language === 'kn' ? 'ನಗದು ಪಾವತಿ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ' : 'Cash payment selected');
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const handleOnlinePayment = async () => {
    // UPI deep link with manager's UPI ID
    const upiId = '8951525788@ybl';
    const amount = currentOrder.total_amount;
    const name = 'Nalapaka Nanjangud';
    const note = `Order for Table ${currentOrder.table_number}`;
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}`;
    
    window.location.href = upiUrl;
    
    // Update payment mode after redirect attempt
    try {
      await updatePayment(currentOrder.id, 'Online');
    } catch (error) {
      console.log('Payment update pending');
    }
  };

  const handleIHavePaid = () => {
    setHasMarkedPaid(true);
    toast.info(language === 'kn' ? 'ಮ್ಯಾನೇಜರ್ ಪಾವತಿಯನ್ನು ದೃಢೀಕರಿಸುತ್ತಾರೆ' : 'Manager will confirm the payment');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Status banner */}
      <div
        className={`w-full py-6 px-4 flex flex-col items-center gap-2 ${
          paymentConfirmed
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
            : isCancelled
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            : isConfirmed
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
        }`}
      >
        {paymentConfirmed ? (
          <>
            <CheckCircle className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-center">
              {language === 'kn' ? 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ!' : 'Payment completed successfully!'}
            </h1>
          </>
        ) : isCancelled ? (
          <>
            <XCircle className="h-12 w-12" />
            <h1 className="text-2xl font-bold text-center">
              {language === 'kn' ? 'ನಿಮ್ಮ ಆರ್ಡರ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ / ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' : 'Your order has been cancelled / rejected'}
            </h1>
          </>
        ) : isConfirmed ? (
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

        {/* Add more items button - only when order is confirmed and not finished eating */}
        {isConfirmed && !eatingFinished && !paymentConfirmed && (
          <Card>
            <CardContent className="py-4">
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => navigate('/menu')}
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'kn' ? 'ಹೆಚ್ಚಿನ ಐಟಂಗಳನ್ನು ಸೇರಿಸಿ' : 'Add More Items'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mark as finished eating - only when order is confirmed */}
        {isConfirmed && !eatingFinished && !paymentConfirmed && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                {language === 'kn' ? 'ಊಟ ಮುಗಿದಿದೆಯೇ?' : 'Finished Eating?'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-12"
                onClick={handleMarkFinished}
              >
                {language === 'kn' ? 'ಎಲ್ಲವೂ ಮುಗಿದಿದೆ - ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ' : 'Everything is finished - Proceed to Payment'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment options - show after eating is finished */}
        {isConfirmed && eatingFinished && !paymentConfirmed && !isPaid && (
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

        {/* Payment selected - waiting for manager confirmation */}
        {isConfirmed && eatingFinished && isPaid && !paymentConfirmed && (
          <Card className="border-yellow-500">
            <CardContent className="py-6 space-y-4">
              <div className="text-center">
                <Clock className="h-10 w-10 mx-auto mb-2 text-yellow-600 animate-pulse" />
                <p className="text-lg font-medium">
                  {currentOrder.payment_mode === 'Cash' 
                    ? (language === 'kn' ? 'ನಗದು ಪಾವತಿಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇವೆ' : 'Waiting for cash payment confirmation')
                    : (language === 'kn' ? 'ಆನ್‌ಲೈನ್ ಪಾವತಿ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದ್ದೇವೆ' : 'Waiting for online payment confirmation')
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'kn' ? 'ಮ್ಯಾನೇಜರ್ ಪಾವತಿಯನ್ನು ದೃಢೀಕರಿಸುತ್ತಾರೆ' : 'Manager will confirm the payment'}
                </p>
              </div>
              {currentOrder.payment_mode === 'Online' && !hasMarkedPaid && (
                <Button
                  className="w-full"
                  onClick={handleIHavePaid}
                >
                  {language === 'kn' ? 'ನಾನು ಪಾವತಿಸಿದ್ದೇನೆ' : 'I have paid'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment confirmed */}
        {paymentConfirmed && (
          <Card className="border-green-500">
            <CardContent className="py-6 text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-2 text-green-600" />
              <p className="text-lg font-medium text-green-600">
                {language === 'kn' ? 'ಪಾವತಿಸಲಾಗಿದೆ' : 'Paid'} - {currentOrder.payment_mode}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'kn' ? 'ನಮ್ಮೊಂದಿಗೆ ಊಟ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು!' : 'Thank you for dining with us!'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order History Button */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => navigate('/order-history')}
        >
          <History className="h-4 w-4 mr-2" />
          {language === 'kn' ? 'ಆರ್ಡರ್ ಇತಿಹಾಸ' : 'Order History'}
        </Button>

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
