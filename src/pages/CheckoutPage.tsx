import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTableNumber } from '@/hooks/useTableNumber';
import { useOrders } from '@/hooks/useOrders';
import { useLockedSeats } from '@/hooks/useLockedSeats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { OrderTypeModal } from '@/components/OrderTypeModal';
import { TableSeatModal } from '@/components/TableSeatModal';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { tableNumber, saveTableNumber } = useTableNumber();
  const { currentOrder, createOrder, addItemsToOrder } = useOrders();
  const { lockSeats } = useLockedSeats();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showTableSeatModal, setShowTableSeatModal] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<'dine-in' | 'parcel' | null>(null);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Check if there's an active order to add items to
  const hasActiveOrder = currentOrder && 
    currentOrder.order_stage !== 'completed' &&
    !currentOrder.payment_confirmed;

  // Pre-fill customer details from active order
  useEffect(() => {
    if (hasActiveOrder && currentOrder) {
      setCustomerName(currentOrder.customer_name);
      setPhoneNumber(currentOrder.phone_number);
    }
  }, [hasActiveOrder, currentOrder]);

  if (items.length === 0) {
    navigate('/menu');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasActiveOrder && (!customerName.trim() || !phoneNumber.trim())) {
      toast.error(language === 'kn' ? 'ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ' : 'Please fill in all fields');
      return;
    }

    if (hasActiveOrder && currentOrder) {
      // Add items to existing order
      setIsSubmitting(true);
      try {
        const orderedItems = items.map((item) => ({
          name: item.name,
          nameKn: item.nameKn,
          quantity: item.quantity,
          price: item.price,
        }));
        await addItemsToOrder(currentOrder.id, orderedItems, totalAmount);
        toast.success(language === 'kn' ? 'ಐಟಂಗಳನ್ನು ಆರ್ಡರ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!' : 'Items added to your order!');
        clearCart();
        navigate('/order-status');
      } catch (error) {
        console.error('Error adding items:', error);
        toast.error(language === 'kn' ? 'ಐಟಂಗಳನ್ನು ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to add items');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // New order - show order type selection
      const orderedItems = items.map((item) => ({
        name: item.name,
        nameKn: item.nameKn,
        quantity: item.quantity,
        price: item.price,
      }));

      setPendingOrderData({
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        ordered_items: orderedItems,
        total_amount: totalAmount,
      });
      setShowOrderTypeModal(true);
    }
  };

  const handleOrderTypeSelect = async (orderType: 'dine-in' | 'parcel') => {
    setShowOrderTypeModal(false);
    setSelectedOrderType(orderType);

    if (orderType === 'parcel') {
      // For parcel, proceed directly without table number
      await createOrderWithType('parcel', 'PARCEL', []);
    } else {
      // For dine-in, ask for table number and seats
      setShowTableSeatModal(true);
    }
  };

  const handleTableSeatSave = async (table: string, seats: string[]) => {
    setShowTableSeatModal(false);
    saveTableNumber(table);
    await createOrderWithType('dine-in', table, seats);
  };

  const createOrderWithType = async (orderType: 'dine-in' | 'parcel', table: string, seats: string[]) => {
    setIsSubmitting(true);

    try {
      const orderData = {
        ...pendingOrderData,
        order_type: orderType,
        table_number: table,
        seats: seats,
      };

      const newOrder = await createOrder(orderData);

      // Lock seats for dine-in orders
      if (orderType === 'dine-in' && table !== 'PARCEL' && newOrder && seats.length > 0) {
        await lockSeats(table, seats, newOrder.id);
      }

      toast.success(language === 'kn' ? 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!' : 'Order placed successfully!');
      clearCart();
      navigate('/order-status');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(language === 'kn' ? 'ಆರ್ಡರ್ ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {hasActiveOrder 
              ? (language === 'kn' ? 'ಹೆಚ್ಚಿನ ಐಟಂಗಳನ್ನು ಸೇರಿಸಿ' : 'Add More Items')
              : t('orderSummary')
            }
          </h1>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Existing order info */}
          {hasActiveOrder && currentOrder && (
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary">
                  {language === 'kn' ? 'ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಆರ್ಡರ್‌ಗೆ ಸೇರಿಸಲಾಗುತ್ತಿದೆ' : 'Adding to existing order'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {(currentOrder as any).order_type === 'parcel' 
                    ? 'PARCEL' 
                    : `${language === 'kn' ? 'ಟೇಬಲ್' : 'Table'} ${currentOrder.table_number}${(currentOrder as any).seats?.length ? ` | Seats: ${(currentOrder as any).seats.join(', ')}` : ''}`
                  } • {currentOrder.customer_name}
                </p>
                <p>{language === 'kn' ? 'ಪ್ರಸ್ತುತ ಒಟ್ಟು' : 'Current total'}: ₹{currentOrder.total_amount}</p>
              </CardContent>
            </Card>
          )}

          {/* New items summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                {hasActiveOrder 
                  ? (language === 'kn' ? 'ಹೊಸ ಐಟಂಗಳು' : 'New Items')
                  : t('items')
                }
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cart')}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                {t('edit')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {language === 'kn' ? item.nameKn : item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>{hasActiveOrder ? (language === 'kn' ? 'ಹೊಸ ಐಟಂ ಒಟ್ಟು' : 'New items total') : t('total')}</span>
                  <span className="text-primary">₹{totalAmount}</span>
                </div>
                {hasActiveOrder && currentOrder && (
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>{language === 'kn' ? 'ಹೊಸ ಒಟ್ಟು' : 'New Grand Total'}</span>
                    <span>₹{currentOrder.total_amount + totalAmount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer details - only for new orders */}
          {!hasActiveOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'kn' ? 'ಗ್ರಾಹಕ ವಿವರಗಳು' : 'Customer Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">{t('customerName')}</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={language === 'kn' ? 'ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Enter your name'}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-number">{t('phoneNumber')}</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={language === 'kn' ? 'ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Enter phone number'}
                    required
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : hasActiveOrder ? (
              language === 'kn' ? 'ಆರ್ಡರ್‌ಗೆ ಐಟಂಗಳನ್ನು ಸೇರಿಸಿ' : 'Add Items to Order'
            ) : (
              t('proceedOrder')
            )}
          </Button>
        </form>
      </main>

      {/* Order Type Modal */}
      <OrderTypeModal
        open={showOrderTypeModal}
        onSelect={handleOrderTypeSelect}
      />

      {/* Table and Seat Selection Modal for Dine-in */}
      <TableSeatModal
        open={showTableSeatModal}
        onSave={handleTableSeatSave}
        onClose={() => setShowTableSeatModal(false)}
        showCloseButton={true}
      />
    </div>
  );
}
