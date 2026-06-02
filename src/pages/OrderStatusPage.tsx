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
  Package,
  Phone,
  MessageCircle,
  Bell
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
import { PairingSuggestions } from '@/components/PairingSuggestions';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function OrderStatusPage() {
  const { t, language } = useLanguage();
  const { currentOrder, markEatingFinished, updatePaymentIntent } = useOrders();
  const { unlockSeatsByOrderId } = useLockedSeats();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasShownReview, setHasShownReview] = useState(false);
  const [activeRequests, setActiveRequests] = useState<string[]>([]);
  const [requestLoading, setRequestLoading] = useState<Record<string, boolean>>({});

  const fetchActiveRequests = async () => {
    if (!currentOrder) return;
    const { data } = await supabase
      .from('table_requests' as any)
      .select('request_type')
      .eq('hotel_id', currentOrder.hotel_id)
      .eq('table_number', currentOrder.table_number)
      .eq('status', 'Pending');
    if (data) {
      setActiveRequests(data.map((r: any) => r.request_type));
    }
  };

  useEffect(() => {
    if (!currentOrder) return;
    fetchActiveRequests();

    const channel = supabase
      .channel('table-requests-customer')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_requests',
        },
        () => {
          fetchActiveRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrder?.table_number, currentOrder?.hotel_id]);

  const handleRequestService = async (type: string) => {
    if (!currentOrder) return;
    if (activeRequests.includes(type)) return;

    setRequestLoading(prev => ({ ...prev, [type]: true }));
    try {
      const { error } = await supabase
        .from('table_requests' as any)
        .insert({
          hotel_id: currentOrder.hotel_id,
          table_number: currentOrder.table_number,
          request_type: type,
          status: 'Pending'
        });
      if (error) throw error;
      toast.success(
        language === 'kn'
          ? `${type} ಗಾಗಿ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ`
          : `Requested ${type} successfully!`
      );
      fetchActiveRequests();
    } catch (e) {
      toast.error('Failed to request service');
    } finally {
      setRequestLoading(prev => ({ ...prev, [type]: false }));
    }
  };

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
            {(currentOrder as any).accepted_by_kitchen_name && (
              <p className="text-sm text-success/80 mt-1">
                {language === 'kn' 
                  ? `ಅಡುಗೆಮನೆಯಲ್ಲಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ` 
                  : `Confirmed by Kitchen`}
              </p>
            )}
            {(currentOrder as any).accepted_by_server_name && (
              <p className="text-sm text-success/80 mt-1">
                {language === 'kn' 
                  ? `${(currentOrder as any).accepted_by_server_name} ಅವರು ಸ್ವೀಕರಿಸಿದ್ದಾರೆ` 
                  : `Server: ${(currentOrder as any).accepted_by_server_name}`}
              </p>
            )}
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
              {language === 'kn' ? 'ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಆರ್ಡರ್ ಕಾಯುತ್ತಿದೆ...' : 'Waiting for kitchen confirmation...'}
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

        {/* Server accepted notification with call/message options */}
        {(currentOrder as any).accepted_by_server_name && (
          <Card className="shadow-soft border-0 border-l-4 border-l-success animate-slide-up">
            <CardContent className="py-3 px-4 space-y-3">
              <p className="text-sm text-success font-medium">
                {language === 'kn' 
                  ? `ನಿಮ್ಮ ಆರ್ಡರ್ ಅನ್ನು ${(currentOrder as any).accepted_by_server_name} ಸ್ವೀಕರಿಸಿದ್ದಾರೆ` 
                  : `Your order is accepted by ${(currentOrder as any).accepted_by_server_name}`}
              </p>
              <p className="text-foreground font-semibold">
                {language === 'kn' ? 'ಸರ್ವರ್:' : 'Server:'} {(currentOrder as any).accepted_by_server_name}
              </p>
              {currentOrder.phone_number && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.location.href = `tel:${currentOrder.phone_number}`}
                  >
                    <Phone className="h-4 w-4 mr-1 text-success" />
                    {language === 'kn' ? 'ಕರೆ ಮಾಡಿ' : 'Call Server'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      const phone = currentOrder.phone_number.replace(/\D/g, '');
                      const msg = encodeURIComponent(
                        language === 'kn' 
                          ? `ನಮಸ್ಕಾರ, ನಾನು ಟೇಬಲ್ ${currentOrder.table_number} ನಲ್ಲಿದ್ದೇನೆ` 
                          : `Hi, I'm at Table ${currentOrder.table_number}`
                      );
                      window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1 text-success" />
                    {language === 'kn' ? 'WhatsApp' : 'WhatsApp'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Table Assistance / Service Request - Slide Out Left Side Panel */}
        {!paymentConfirmed && !isCancelled && orderType === 'dine-in' && (
          <div className="fixed bottom-6 left-6 z-50 animate-bounce">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full shadow-lg h-14 w-14 bg-destructive hover:bg-destructive/95 text-white flex items-center justify-center relative p-0 border border-white/20"
                >
                  <Bell className="h-6 w-6" />
                  {activeRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-destructive font-bold text-xs h-5 w-5 rounded-full flex items-center justify-center border-2 border-destructive animate-pulse">
                      {activeRequests.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[385px] p-6 bg-card text-card-foreground flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                      {language === 'kn' ? 'ಟೇಬಲ್ ಸೇವೆ' : 'Table Service'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'kn'
                        ? 'ಸೇವೆಗಾಗಿ ವಿನಂತಿಸಿ, ಸರ್ವರ್ ತಕ್ಷಣವೇ ನಿಮ್ಮ ಬಳಿಗೆ ಬರುತ್ತಾರೆ.'
                        : 'Select a service below and your server will assist you shortly.'}
                    </p>
                  </div>
                  
                  <div className="space-y-3 pt-4 overflow-y-auto max-h-[70vh]">
                    {[
                      { id: 'Hot Water', labelEn: 'Hot Water', labelKn: 'ಬಿಸಿ ನೀರು', icon: '💧' },
                      { id: 'Spoon', labelEn: 'Spoon', labelKn: 'ಚಮಚ', icon: '🍴' },
                      { id: 'Sauces', labelEn: 'Sauces', labelKn: 'ಸಾಸ್', icon: '🥫' },
                      { id: 'Clean Table', labelEn: 'Clean Table', labelKn: 'ಟೇಬಲ್ ಕ್ಲೀನ್', icon: '🧼' },
                      { id: 'Call Server', labelEn: 'Call Server', labelKn: 'ಸರ್ವರ್ ಕರೆ', icon: '🛎️' },
                      { id: 'Extra Plates', labelEn: 'Extra Plates', labelKn: 'ಹೆಚ್ಚುವರಿ ಪ್ಲೇಟ್', icon: '🍽️' }
                    ].map((req) => {
                      const isActive = activeRequests.includes(req.id);
                      const isLoading = requestLoading[req.id];
                      return (
                        <div
                          key={req.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            isActive 
                              ? 'bg-destructive/10 border-destructive/20' 
                              : 'hover:bg-accent border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{req.icon}</span>
                            <div>
                              <p className="text-sm font-semibold">
                                {language === 'kn' ? req.labelKn : req.labelEn}
                              </p>
                              {isActive && (
                                <p className="text-[10px] text-destructive animate-pulse font-medium">
                                  {language === 'kn' ? 'ಸರ್ವರ್‌ಗೆ ತಿಳಿಸಲಾಗಿದೆ...' : 'Notified server...'}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            className={isActive ? 'bg-destructive hover:bg-destructive/90 text-white' : ''}
                            disabled={isLoading || isActive}
                            onClick={() => handleRequestService(req.id)}
                          >
                            {isLoading ? (
                              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                            ) : isActive ? (
                              language === 'kn' ? 'ಕಳುಹಿಸಲಾಗಿದೆ' : 'Sent'
                            ) : (
                              language === 'kn' ? 'ವಿನಂತಿಸಿ' : 'Request'
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
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

        {/* Add more items button + smart pairings based on what they already ordered */}
        {isConfirmed && !eatingFinished && !paymentConfirmed && (
          <>
            <PairingSuggestions
              contextItems={orderedItems.map((i) => ({ id: (i as any).id || i.name, name: i.name }))}
              title={language === 'kn' ? 'ಮುಂದೆ ಇದನ್ನು ಸೇರಿಸಿ' : 'Add this next'}
              onAdd={(it) => {
                addItem(it as any);
                navigate('/cart');
              }}
            />
            <Button
              variant="outline"
              className="w-full h-12 shadow-sm animate-slide-up"
              onClick={() => navigate('/menu')}
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === 'kn' ? 'ಹೆಚ್ಚಿನ ಐಟಂಗಳನ್ನು ಸೇರಿಸಿ' : 'Add More Items'}
            </Button>
          </>
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
