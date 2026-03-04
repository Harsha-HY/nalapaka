import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, Package, UtensilsCrossed, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function OrderHistoryPage() {
  const { t, language } = useLanguage();
  const { orders, isLoading } = useOrders();
  const navigate = useNavigate();

  const visibleOrders = orders.filter(o => {
    if (o.payment_confirmed) return true;
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return new Date(o.created_at) >= fortyEightHoursAgo;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'kn' ? 'kn-IN' : 'en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/order-status')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {language === 'kn' ? 'ಆರ್ಡರ್ ಇತಿಹಾಸ' : 'Order History'}
          </h1>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {language === 'kn' ? 'ಯಾವುದೇ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ' : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => (
              <HistoryOrderCard key={order.id} order={order} language={language} formatDate={formatDate} t={t} />
            ))}
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground mt-6">
          {language === 'kn' 
            ? 'ಪಾವತಿಸದ ಆರ್ಡರ್‌ಗಳು 48 ಗಂಟೆಗಳ ನಂತರ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅಳಿಸಲ್ಪಡುತ್ತವೆ' 
            : 'Unpaid orders are automatically deleted after 48 hours'}
        </p>
      </main>
    </div>
  );
}

function HistoryOrderCard({ order, language, formatDate, t }: { order: Order; language: 'en' | 'kn'; formatDate: (d: string) => string; t: (k: string) => string }) {
  const [isOpen, setIsOpen] = useState(false);

  const orderType = (order as Order).order_type || 'dine-in';
  const seats = (order as any).seats || [];
  const isPaid = order.payment_confirmed;
  const isCancelled = order.order_status === 'Cancelled';
  const extraItems = (order as any).extra_items || [];
  
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  return (
    <Card className={
      isPaid 
        ? 'border-green-200 bg-green-50/30 dark:bg-green-900/10' 
        : isCancelled
        ? 'border-red-200 bg-red-50/30 dark:bg-red-900/10'
        : 'border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/10'
    }>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="w-full text-left">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                {orderType === 'parcel' ? (
                  <Badge variant="secondary">
                    <Package className="h-3 w-3 mr-1" />
                    PARCEL
                  </Badge>
                ) : (
                  <>
                    <CardTitle className="text-base flex items-center gap-1">
                      <UtensilsCrossed className="h-4 w-4" />
                      {language === 'kn' ? 'ಟೇಬಲ್' : 'Table'} {order.table_number}
                    </CardTitle>
                    {seats.length > 0 && (
                      <Badge variant="outline" className="text-xs w-fit">Seats: {seats.join(', ')}</Badge>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <Badge className="bg-green-600">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {order.payment_mode}
                  </Badge>
                ) : isCancelled ? (
                  <Badge variant="destructive">Cancelled</Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {order.order_status}
                  </Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
          </CollapsibleTrigger>
        </CardHeader>

        {/* Summary always visible */}
        <CardContent className="pt-0">
          <div className="flex justify-between font-bold">
            <span>{t('total')}</span>
            <span className="text-primary">₹{order.total_amount}</span>
          </div>
          {isPaid && (
            <div className="mt-1 flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              {language === 'kn' ? 'ಪಾವತಿಸಲಾಗಿದೆ' : 'Paid'}
            </div>
          )}
        </CardContent>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-3" />
            {/* FULL item list - no truncation */}
            <div className="space-y-1">
              {orderedItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === 'kn' ? item.nameKn : item.name} × {item.quantity}
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Extra items */}
            {extraItems.length > 0 && (
              <>
                <Separator className="my-2" />
                <p className="text-xs font-semibold text-muted-foreground mb-1">Extra Items</p>
                <div className="space-y-1">
                  {extraItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                      <span>{item.name} × {item.quantity}</span>
                      {item.price && <span>₹{item.price * item.quantity}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
