import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Trash2, Plus, Minus, UtensilsCrossed, Package, AlertTriangle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTableNumber } from '@/hooks/useTableNumber';
import { useOrders } from '@/hooks/useOrders';
import { useLockedSeats } from '@/hooks/useLockedSeats';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ALL_SEATS = ['A', 'B', 'C', 'D'];

export default function CheckoutPage() {
  const { items, totalAmount, clearCart, updateQuantity, removeItem } = useCart();
  const { t, language } = useLanguage();
  const { tableNumber: prefilledTable, isTableSet, saveTableNumber } = useTableNumber();
  const { currentOrder, createOrder, addItemsToOrder } = useOrders();
  const { lockSeats, getLockedSeatsForTable, getAvailableSeats } = useLockedSeats();
  const { profile, upsertProfile } = useProfile();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // If the table was set via QR scan, lock the order type to dine-in.
  const [selectedOrderType, setSelectedOrderType] = useState<'dine-in' | 'parcel' | null>(
    isTableSet ? 'dine-in' : null
  );
  const [tableNumber, setTableNumber] = useState(isTableSet ? prefilledTable : '');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatError, setSeatError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const hasActiveOrder = currentOrder && 
    currentOrder.order_stage !== 'completed' &&
    !currentOrder.payment_confirmed;

  const lockedSeats = tableNumber.trim() ? getLockedSeatsForTable(tableNumber.trim()) : [];

  // Auto-fill from profile
  useEffect(() => {
    if (profile && !autoFilled) {
      if (profile.name) setCustomerName(profile.name);
      if (profile.phone_number) setPhoneNumber(profile.phone_number);
      setAutoFilled(true);
    }
  }, [profile, autoFilled]);

  // Pre-fill from active order
  useEffect(() => {
    if (hasActiveOrder && currentOrder) {
      setCustomerName(currentOrder.customer_name);
      setPhoneNumber(currentOrder.phone_number);
    }
  }, [hasActiveOrder, currentOrder]);

  // Synchronize prefilledTable and isTableSet when they are loaded from sessionStorage
  useEffect(() => {
    if (isTableSet) {
      setTableNumber(prefilledTable);
      setSelectedOrderType('dine-in');
    }
  }, [isTableSet, prefilledTable]);


  if (items.length === 0) {
    navigate('/menu');
    return null;
  }

  const handleSeatToggle = (seat: string) => {
    if (lockedSeats.includes(seat)) {
      setSeatError(
        language === 'kn' 
          ? 'ಈ ಆಸನ ಈಗಾಗಲೇ ಆಕ್ರಮಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಂದು ಆಸನವನ್ನು ಆಯ್ಕೆಮಾಡಿ.' 
          : 'This seat is already occupied. Please select another seat.'
      );
      return;
    }
    setSeatError(null);
    setSelectedSeats(prev => 
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasActiveOrder) {
      if (!customerName.trim()) {
        toast.error(language === 'kn' ? 'ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter your name');
        return;
      }
      if (!selectedOrderType) {
        toast.error(language === 'kn' ? 'ಆರ್ಡರ್ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Please select order type');
        return;
      }
      if (selectedOrderType === 'dine-in') {
        if (!tableNumber.trim()) {
          toast.error(language === 'kn' ? 'ಟೇಬಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Please enter table number');
          return;
        }
        if (selectedSeats.length === 0) {
          toast.error(language === 'kn' ? 'ಆಸನಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Please select at least one seat');
          return;
        }
      }
    }

    // Save profile
    if (customerName.trim()) {
      upsertProfile(customerName.trim(), phoneNumber.trim() || '');
    }

    if (hasActiveOrder && currentOrder) {
      setIsSubmitting(true);
      try {
        const orderedItems = items.map((item) => ({
          name: item.name, nameKn: item.nameKn, quantity: item.quantity, price: item.price,
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
      setIsSubmitting(true);
      try {
        const orderedItems = items.map((item) => ({
          name: item.name, nameKn: item.nameKn, quantity: item.quantity, price: item.price,
        }));

        const table = selectedOrderType === 'parcel' ? 'PARCEL' : tableNumber.trim();
        const seats = selectedOrderType === 'parcel' ? [] : selectedSeats;

        const orderData = {
          customer_name: customerName.trim(),
          phone_number: phoneNumber.trim(),
          ordered_items: orderedItems,
          total_amount: totalAmount,
          order_type: selectedOrderType,
          table_number: table,
          seats,
        };

        const newOrder = await createOrder(orderData);

        if (selectedOrderType === 'dine-in' && newOrder && seats.length > 0) {
          saveTableNumber(table);
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
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
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
                  <Label htmlFor="phone-number">{t('phoneNumber')} <span className="text-muted-foreground text-xs">({language === 'kn' ? 'ಐಚ್ಛಿಕ' : 'Optional'})</span></Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={language === 'kn' ? 'ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Enter phone number (optional)'}
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Type - inline, only for new orders */}
          {!hasActiveOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'kn' ? 'ಆರ್ಡರ್ ಪ್ರಕಾರ' : 'Order Type'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={selectedOrderType === 'dine-in' ? 'default' : 'outline'}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                    onClick={() => {
                      setSelectedOrderType('dine-in');
                      setSelectedSeats([]);
                      setSeatError(null);
                    }}
                  >
                    <UtensilsCrossed className="h-5 w-5" />
                    <span className="text-sm">{language === 'kn' ? 'ಡೈನ್-ಇನ್' : 'Dine-in'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedOrderType === 'parcel' ? 'default' : 'outline'}
                    className="h-16 flex flex-col items-center justify-center gap-1"
                    onClick={() => {
                      setSelectedOrderType('parcel');
                      setTableNumber('');
                      setSelectedSeats([]);
                      setSeatError(null);
                    }}
                  >
                    <Package className="h-5 w-5" />
                    <span className="text-sm">{language === 'kn' ? 'ಪಾರ್ಸೆಲ್' : 'Parcel'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table & Seat selection - only for dine-in */}
          {!hasActiveOrder && selectedOrderType === 'dine-in' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'kn' ? 'ಟೇಬಲ್ ಮತ್ತು ಆಸನ' : 'Table & Seat'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table-number">{language === 'kn' ? 'ಟೇಬಲ್ ಸಂಖ್ಯೆ' : 'Table Number'}</Label>
                  {isTableSet ? (
                    <div className="h-14 flex items-center justify-center rounded-md border-2 border-primary/40 bg-primary/5">
                      <span className="text-3xl font-bold text-primary">
                        {language === 'kn' ? 'ಟೇಬಲ್' : 'Table'} {tableNumber}
                      </span>
                    </div>
                  ) : (
                    <Input
                      id="table-number"
                      value={tableNumber}
                      onChange={(e) => {
                        setTableNumber(e.target.value);
                        setSelectedSeats([]);
                        setSeatError(null);
                      }}
                      placeholder={language === 'kn' ? 'ಟೇಬಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Enter table number'}
                      className="h-12 text-center text-xl"
                    />
                  )}
                  {isTableSet && (
                    <p className="text-xs text-muted-foreground text-center">
                      {language === 'kn'
                        ? 'ಈ ಟೇಬಲ್ ನಿಮ್ಮ QR ಕೋಡ್‌ನಿಂದ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ'
                        : 'Auto-detected from your table QR code'}
                    </p>
                  )}
                </div>

                {tableNumber.trim() && (
                  <div className="space-y-3">
                    <Label className="text-base">
                      {language === 'kn' ? 'ನಿಮ್ಮ ಆಸನವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select your seat(s)'}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ALL_SEATS.map((seat) => {
                        const isLocked = lockedSeats.includes(seat);
                        const isSelected = selectedSeats.includes(seat);
                        return (
                          <button
                            key={seat}
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSeatToggle(seat)}
                            className={cn(
                              'aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all',
                              'text-5xl font-bold',
                              isLocked && 'opacity-60 bg-muted border-muted text-muted-foreground cursor-not-allowed',
                              !isLocked && !isSelected && 'border-border bg-card hover:border-primary/60 hover:bg-primary/5',
                              isSelected && 'border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                            )}
                          >
                            <span className={isLocked ? 'line-through' : ''}>{seat}</span>
                            <span className={cn(
                              'text-xs font-medium mt-1',
                              isLocked ? 'text-destructive' : isSelected ? 'text-primary-foreground/90' : 'text-emerald-600'
                            )}>
                              {isLocked
                                ? (language === 'kn' ? 'ಭರ್ತಿ' : 'Filled')
                                : (language === 'kn' ? 'ಲಭ್ಯ' : 'Available')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {lockedSeats.length === ALL_SEATS.length && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                        <p className="text-sm font-medium text-destructive">
                          {language === 'kn'
                            ? 'ಎಲ್ಲಾ ಆಸನಗಳು ಭರ್ತಿಯಾಗಿವೆ. ದಯವಿಟ್ಟು ಸಿಬ್ಬಂದಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                            : 'All seats are filled. Please contact staff.'}
                        </p>
                      </div>
                    )}
                    {seatError && (
                      <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">{seatError}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cart items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {hasActiveOrder 
                  ? (language === 'kn' ? 'ಹೊಸ ಐಟಂಗಳು' : 'New Items')
                  : t('items')
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {language === 'kn' ? item.nameKn : item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-primary">₹{item.price * item.quantity}</span>
                      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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

          {/* Submit */}
          <Button type="submit" className="w-full h-14 text-lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : hasActiveOrder ? (
              language === 'kn' ? 'ಆರ್ಡರ್‌ಗೆ ಐಟಂಗಳನ್ನು ಸೇರಿಸಿ' : 'Add Items to Order'
            ) : (
              language === 'kn' ? 'ಆರ್ಡರ್ ಮಾಡಿ' : 'Place Order'
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
