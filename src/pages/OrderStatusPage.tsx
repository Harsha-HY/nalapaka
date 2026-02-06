import { useState, useEffect } from 'react';
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
  Package
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { useLockedSeats } from '@/hooks/useLockedSeats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CountdownTimer } from '@/components/CountdownTimer';
import { PaymentOptionsModal } from '@/components/PaymentOptionsModal';
import { UPIPaymentModal } from '@/components/UPIPaymentModal';
import { CustomerReviewModal } from '@/components/CustomerReviewModal';
import { toast } from 'sonner';

export default function OrderStatusPage() {
  const { t, language } = useLanguage();
  const { currentOrder, markEatingFinished, updatePaymentIntent } = useOrders();
  const { unlockSeatsByOrderId } = useLockedSeats();
  const navigate = useNavigate();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasShownReview, setHasShownReview] = useState(false);

  // Show review modal after payment is confirmed
  useEffect(() => {
    if (currentOrder?.payment_confirmed && !hasShownReview) {
      const timer = setTimeout(() => {
        setShowReviewModal(true);
        setHasShownReview(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentOrder?.payment_confirmed, hasShownReview]);

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xl text-muted-foreground">
            {language === 'kn' ? 'ಸಕ್ರಿಯ ಆರ್ಡರ್ ಇಲ್ಲ' : 'No active order'}
          </p>
          <Button onClick={() => navigate('/menu')} className="shadow-sm">
            <Home className="h-4 w-4 mr-2" />
            {t('menu')}
          </Button>
        </div>
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
  const seats = (currentOrder as any).seats || [];
  const waitTimeMinutes = (currentOrder as Order).wait_time_minutes;
  const confirmedAt = (currentOrder as Order).confirmed_at;
  const serverName = (currentOrder as any).server_name;

  const orderedItems = currentOrder.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const handleMarkFinished = async () => {
    setShowPaymentOptions(true);
  };

  const handlePaymentMethodSelect = async (method: 'Cash' | 'UPI') => {
    setShowPaymentOptions(false);
    
    try {
      if (updatePaymentIntent) {
        await updatePaymentIntent(currentOrder.id, method);
      }
      await markEatingFinished(currentOrder.id);
      
      // AUTO RESET: Unlock seats when customer clicks "Everything is finished"
      const seats = (currentOrder as any).seats || [];
      if (seats.length > 0) {
        await unlockSeatsByOrderId(currentOrder.id);
        console.log(`Table ${currentOrder.table_number} – Seats ${seats.join(', ')} have been reset automatically`);
      }
      
      if (method === 'Cash') {
        toast.info(
          language === 'kn' 
            ? 'ದಯವಿಟ್ಟು ನಗದು ಕೌಂಟರ್‌ಗೆ ಹೋಗಿ. ಮ್ಯಾನೇಜರ್ ದೃಢೀಕರಿಸುತ್ತಾರೆ.' 
            : 'Please go to cash counter. Manager will confirm.'
        );
      } else {
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
        className={`w-full py-8 px-4 flex flex-col items-center gap-3 ${
          paymentConfirmed
            ? 'banner-success'
            : isCancelled
            ? 'banner-error'
            : isConfirmed
            ? 'banner-success'
            : 'banner-warning'
        }`}
      >
        {paymentConfirmed ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-3">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-success">
              {language === 'kn' 
                ? 'ಪಾವತಿ ಯಶಸ್ವಿ!' 
                : 'Payment Successful!'}
            </h1>
            <p className="text-sm text-success/80 mt-1">
              {currentOrder.payment_mode === 'Cash' 
                ? (language === 'kn' ? '(ನಗದು)' : '(Cash)') 
                : (language === 'kn' ? '(UPI)' : '(UPI)')}
            </p>
          </div>
        ) : isCancelled ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-3">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive">
              {language === 'kn' ? 'ಆರ್ಡರ್ ರದ್ದಾಗಿದೆ' : 'Order Cancelled'}
            </h1>
          </div>
        ) : isConfirmed ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-3">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-success">{t('orderConfirmed')}</h1>
            {waitTimeMinutes && confirmedAt && (
              <div className="mt-3">
                <CountdownTimer confirmedAt={confirmedAt} waitTimeMinutes={waitTimeMinutes} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center mb-3">
              <Clock className="h-8 w-8 text-warning animate-gentle-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-warning">{t('waitingConfirmation')}</h1>
            <p className="text-sm text-warning/80 mt-1">
              {language === 'kn' ? 'ದಯವಿಟ್ಟು ಕಾಯಿರಿ...' : 'Please wait...'}
            </p>
          </div>
        )}
      </div>

      <main className="flex-1 container py-6 space-y-4">
      {/* Server info with call button */}
        {serverName && (
          <Card className="shadow-soft border-0 border-l-4 border-l-primary animate-slide-up">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {language === 'kn' ? 'ನಿಮ್ಮ ಸರ್ವರ್:' : 'Your server:'}{' '}
                <span className="font-semibold text-foreground">{serverName}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Server accepted notification */}
        {(currentOrder as any).accepted_by_server_name && (
          <Card className="shadow-soft border-0 border-l-4 border-l-success animate-slide-up">
            <CardContent className="py-3 px-4">
              <p className="text-sm text-success font-medium">
                {language === 'kn' 
                  ? `ನಿಮ್ಮ ಆರ್ಡರ್ ಅನ್ನು ${(currentOrder as any).accepted_by_server_name} ಸ್ವೀಕರಿಸಿದ್ದಾರೆ` 
                  : `Your order is accepted by ${(currentOrder as any).accepted_by_server_name}`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order details */}
        <Card className="shadow-soft border-0 animate-slide-up">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{t('orderSummary')}</CardTitle>
              <Badge variant={orderType === 'parcel' ? 'secondary' : 'outline'} className="bg-card">
                {orderType === 'parcel' ? (
                  <><Package className="h-3 w-3 mr-1" /> PARCEL</>
                ) : (
                  <><UtensilsCrossed className="h-3 w-3 mr-1" /> DINE-IN</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderType === 'dine-in' && (
                <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">{t('tableNumber')}</span>
                  <span className="font-bold text-foreground">Table {currentOrder.table_number}</span>
                </div>
              )}
              {orderType === 'dine-in' && seats.length > 0 && (
                <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">{language === 'kn' ? 'ಆಸನಗಳು' : 'Seats'}</span>
                  <span className="font-bold text-foreground">{seats.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
                <span className="text-sm text-muted-foreground">{t('customerName')}</span>
                <span className="font-medium text-foreground">{currentOrder.customer_name}</span>
              </div>
              
              <Separator className="my-3" />
              
              <div className="space-y-2">
                {orderedItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span className="text-foreground">
                      {language === 'kn' ? item.nameKn : item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-semibold">{t('total')}</span>
                <span className="text-2xl font-bold text-primary">₹{currentOrder.total_amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add more items button */}
        {isConfirmed && !eatingFinished && !paymentConfirmed && (
          <Button
            variant="outline"
            className="w-full h-12 shadow-sm animate-slide-up"
            onClick={() => navigate('/menu')}
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === 'kn' ? 'ಹೆಚ್ಚಿನ ಐಟಂಗಳನ್ನು ಸೇರಿಸಿ' : 'Add More Items'}
          </Button>
        )}

        {/* Mark as finished eating */}
        {isConfirmed && !eatingFinished && !paymentConfirmed && (
          <Card className="shadow-soft border-0 animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                {language === 'kn' ? 'ಊಟ ಮುಗಿದಿದೆಯೇ?' : 'Finished Eating?'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-12 shadow-sm"
                onClick={handleMarkFinished}
              >
                {language === 'kn' ? 'ಎಲ್ಲವೂ ಮುಗಿದಿದೆ' : 'Everything is finished'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment status - waiting for manager */}
        {isConfirmed && eatingFinished && !paymentConfirmed && (
          <Card className="shadow-soft border-0 border-l-4 border-l-warning animate-slide-up">
            <CardContent className="py-6 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-warning/20 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-warning animate-gentle-pulse" />
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {language === 'kn' ? 'ಪಾವತಿ ಬಾಕಿ' : 'Payment Pending'}
                </p>
                {paymentIntent && (
                  <Badge variant="outline" className="mt-2 bg-card">
                    {paymentIntent === 'Cash' 
                      ? (language === 'kn' ? 'ನಗದು ಮೂಲಕ' : 'Via Cash')
                      : (language === 'kn' ? 'UPI ಮೂಲಕ' : 'Via UPI')
                    }
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {paymentIntent === 'Cash'
                    ? (language === 'kn' ? 'ದಯವಿಟ್ಟು ನಗದು ಕೌಂಟರ್‌ಗೆ ಹೋಗಿ' : 'Please go to cash counter')
                    : (language === 'kn' ? 'ಮ್ಯಾನೇಜರ್ ದೃಢೀಕರಿಸುತ್ತಾರೆ' : 'Manager will confirm')
                  }
                </p>
              </div>
              
              {paymentIntent === 'UPI' && (
                <Button 
                  variant="outline" 
                  className="w-full shadow-sm"
                  onClick={() => setShowUPIModal(true)}
                >
                  {language === 'kn' ? 'QR ಕೋಡ್ ತೋರಿಸಿ' : 'Show QR Code'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment confirmed */}
        {paymentConfirmed && (
          <Card className="shadow-soft border-0 border-l-4 border-l-success animate-slide-up">
            <CardContent className="py-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
              <p className="text-lg font-semibold text-success">
                {language === 'kn' ? 'ಪಾವತಿಸಲಾಗಿದೆ' : 'Paid'} - {currentOrder.payment_mode}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'kn' ? 'ನಮ್ಮೊಂದಿಗೆ ಊಟ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು!' : 'Thank you for dining with us!'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full h-12 shadow-sm"
            onClick={() => navigate('/order-history')}
          >
            <History className="h-4 w-4 mr-2" />
            {language === 'kn' ? 'ಆರ್ಡರ್ ಇತಿಹಾಸ' : 'Order History'}
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 shadow-sm"
            onClick={() => navigate('/menu')}
          >
            <Home className="h-4 w-4 mr-2" />
            {t('menu')}
          </Button>
        </div>
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
        orderId={currentOrder.id}
        onPaymentInitiated={handleUPIPaymentInitiated}
      />

      {/* Customer Review Modal */}
      <CustomerReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        customerName={currentOrder.customer_name}
        phoneNumber={currentOrder.phone_number}
        tableNumber={currentOrder.table_number}
        seats={seats}
        serverName={serverName}
        orderId={currentOrder.id}
      />
    </div>
  );
}
