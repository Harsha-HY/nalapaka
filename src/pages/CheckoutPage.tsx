import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTableNumber } from '@/hooks/useTableNumber';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { tableNumber } = useTableNumber();
  const { createOrder } = useOrders();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    navigate('/menu');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !phoneNumber.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderedItems = items.map((item) => ({
        name: item.name,
        nameKn: item.nameKn,
        quantity: item.quantity,
        price: item.price,
      }));

      await createOrder({
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        table_number: tableNumber,
        ordered_items: orderedItems,
        total_amount: totalAmount,
      });

      clearCart();
      toast.success(language === 'kn' ? 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!' : 'Order placed successfully!');
      navigate('/order-status');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
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
          <h1 className="text-xl font-bold">{t('orderSummary')}</h1>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order items summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t('items')}</CardTitle>
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
                  <span>{t('total')}</span>
                  <span className="text-primary">₹{totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">{t('customerName')}</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
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
                  placeholder="Enter phone number"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('tableNumber')}</Label>
                <div className="h-12 flex items-center px-3 bg-secondary rounded-md font-medium">
                  {tableNumber}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t('confirmOrder')
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
