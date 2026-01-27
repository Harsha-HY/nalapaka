import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  Home, 
  CreditCard, 
  XCircle,
  Plus,
  UtensilsCrossed,
  History,
  LogOut,
  Package
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CountdownTimer } from '@/components/CountdownTimer';
import { PaymentOptionsModal } from '@/components/PaymentOptionsModal';
import { UPIPaymentModal } from '@/components/UPIPaymentModal';
import { toast } from 'sonner';

export default function OrderStatusPage() {
  const { t, language } = useLanguage();
  const { signOut } = useAuth();
  const { currentOrder, markEatingFinished, updatePaymentIntent } = useOrders();
  const navigate = useNavigate();
  const [autoLogoutCountdown, setAutoLogoutCountdown] = useState<number | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);

  // Auto logout after payment confirmed
  const handleAutoLogout = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [signOut, navigate]);

  useEffect(() => {
    if (currentOrder?.payment_confirmed && autoLogoutCountdown === null) {
      setAutoLogoutCountdown(15);
    }
  }, [currentOrder?.payment_confirmed, autoLogoutCountdown]);

  useEffect(() => {
    if (autoLogoutCountdown === null) return;
    if (autoLogoutCountdown <= 0) {
      handleAutoLogout();
      return;
    }

    const timer = setTimeout(() => {
      setAutoLogoutCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoLogoutCountdown, handleAutoLogout]);

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
  const eatingFinished = currentOrder.eating_finished;
  const paymentConfirmed = currentOrder.payment_confirmed;
  const paymentIntent = (currentOrder as any).payment_intent;
  const orderType = (currentOrder as Order).order_type || 'dine-in';
  const waitTimeMinutes = (currentOrder as Order).wait_time_minutes;
  const confirmedAt = (currentOrder as Order).confirmed_at;

  const orderedItems = currentOrder.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const handleMarkFinished = async () => {
    // Show payment options modal
    setShowPaymentOptions(true);
  };

  const handlePaymentMethodSelect = async (method: 'Cash' | 'UPI') => {
    setShowPaymentOptions(false);
    
    try {
      // Update payment intent
      if (updatePaymentIntent) {
        await updatePaymentIntent(currentOrder.id, method);
      }
      
      // Mark eating finished
      await markEatingFinished(currentOrder.id);
      
      if (method === 'Cash') {
        toast.info(
          language === 'kn' 
            ? 'ದಯವಿಟ್ಟು ನಗದು ಕೌಂಟರ್‌ಗೆ ಹೋಗಿ. ಮ್ಯಾನೇಜರ್ ದೃಢೀಕರಿಸುತ್ತಾರೆ.' 
            : 'Please go to cash counter. Manager will confirm.'
        );
      } else {
        // Show UPI modal
        setShowUPIModal(true);
      }
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleUPIPaymentInitiated = () => {
    toast.success(
      language === 'kn' 
        ? 'ಪಾವತಿ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ. ಮ್ಯಾನೇಜರ್ ದೃಢೀಕರಿಸುತ್ತಾರೆ.' 
        : 'Payment initiated. Manager will confirm.'
    );
    setShowUPIModal(false);
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
              {language === 'kn' 
                ? 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ' 
                : 'Payment completed successfully'}
            </h1>
            <p className="text-sm">
              {currentOrder.payment_mode === 'Cash' 
                ? (language === 'kn' ? '(ನಗದು)' : '(Cash)') 
                : (language === 'kn' ? '(UPI)' : '(UPI)')}
            </p>
            {autoLogoutCountdown !== null && (
              <p className="text-sm mt-2">
                {language === 'kn' 
                  ? `${autoLogoutCountdown} ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಲಾಗ್ಔಟ್ ಆಗುತ್ತಿದ್ದೀರಿ...` 
                  : `Logging out in ${autoLogoutCountdown} seconds...`}
              </p>
            )}
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
            {waitTimeMinutes && confirmedAt && (
              <div className="mt-2">
                <CountdownTimer confirmedAt={confirmedAt} waitTimeMinutes={waitTimeMinutes} />
              </div>
            )}
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
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('orderSummary')}</CardTitle>
              <Badge variant={orderType === 'parcel' ? 'secondary' : 'outline'}>
                {orderType === 'parcel' ? (
                  <><Package className="h-3 w-3 mr-1" /> PARCEL</>
                ) : (
                  <><UtensilsCrossed className="h-3 w-3 mr-1" /> DINE-IN</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderType === 'dine-in' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('tableNumber')}</span>
                  <span className="font-medium">{currentOrder.table_number}</span>
                </div>
              )}
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
                {language === 'kn' ? 'ಎಲ್ಲವೂ ಮುಗಿದಿದೆ' : 'Everything is finished'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment status - waiting for manager */}
        {isConfirmed && eatingFinished && !paymentConfirmed && (
          <Card className="border-yellow-500">
            <CardContent className="py-6 space-y-4">
              <div className="text-center">
                <Clock className="h-10 w-10 mx-auto mb-2 text-yellow-600 animate-pulse" />
                <p className="text-lg font-medium">
                  {language === 'kn' ? 'ಪಾವತಿ ಬಾಕಿ' : 'Payment pending'}
                </p>
                {paymentIntent && (
                  <Badge variant="outline" className="mt-2">
                    {paymentIntent === 'Cash' 
                      ? (language === 'kn' ? 'ನಗದು ಮೂಲಕ ಪಾವತಿ' : 'Paying via Cash')
                      : (language === 'kn' ? 'UPI ಮೂಲಕ ಪಾವತಿ' : 'Paying via UPI')
                    }
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {paymentIntent === 'Cash'
                    ? (language === 'kn' ? 'ದಯವಿಟ್ಟು ನಗದು ಕೌಂಟರ್‌ಗೆ ಹೋಗಿ' : 'Please go to cash counter')
                    : (language === 'kn' ? 'ಮ್ಯಾನೇಜರ್ ಪಾವತಿಯನ್ನು ದೃಢೀಕರಿಸುತ್ತಾರೆ' : 'Manager will confirm the payment')
                  }
                </p>
              </div>
              
              {/* Re-trigger UPI if needed */}
              {paymentIntent === 'UPI' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowUPIModal(true)}
                >
                  {language === 'kn' ? 'UPI ಅಪ್ಲಿಕೇಶನ್ ಮತ್ತೆ ತೆರೆಯಿರಿ' : 'Open UPI App Again'}
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
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={handleAutoLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {language === 'kn' ? 'ಈಗ ಲಾಗ್ಔಟ್' : 'Logout Now'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order History Button */}
        {!paymentConfirmed && (
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate('/order-history')}
          >
            <History className="h-4 w-4 mr-2" />
            {language === 'kn' ? 'ಆರ್ಡರ್ ಇತಿಹಾಸ' : 'Order History'}
          </Button>
        )}

        {/* Back to menu - only when not payment confirmed */}
        {!paymentConfirmed && (
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate('/menu')}
          >
            <Home className="h-4 w-4 mr-2" />
            {t('menu')}
          </Button>
        )}
      </main>

      {/* Payment Options Modal */}
      <PaymentOptionsModal
        open={showPaymentOptions}
        onSelect={handlePaymentMethodSelect}
        onClose={() => setShowPaymentOptions(false)}
        totalAmount={currentOrder.total_amount}
      />

      {/* UPI Payment Modal */}
      <UPIPaymentModal
        open={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        totalAmount={currentOrder.total_amount}
        onPaymentInitiated={handleUPIPaymentInitiated}
      />
    </div>
  );
}
