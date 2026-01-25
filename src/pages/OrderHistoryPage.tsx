import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function OrderHistoryPage() {
  const { t, language } = useLanguage();
  const { orders, isLoading } = useOrders();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'kn' ? 'kn-IN' : 'en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
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
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {language === 'kn' ? 'ಯಾವುದೇ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ' : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isPending = order.order_status === 'Pending';
              const isConfirmed = order.order_status === 'Confirmed';
              const isCancelled = order.order_status === 'Cancelled';
              const paymentConfirmed = (order as any).payment_confirmed;

              const orderedItems = order.ordered_items as Array<{
                name: string;
                nameKn: string;
                quantity: number;
                price: number;
              }>;

              return (
                <Card
                  key={order.id}
                  className={`${
                    paymentConfirmed
                      ? 'border-green-200'
                      : isCancelled
                      ? 'border-red-200'
                      : isPending
                      ? 'border-yellow-200'
                      : 'border-blue-200'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {language === 'kn' ? 'ಟೇಬಲ್' : 'Table'} {order.table_number}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {paymentConfirmed ? (
                          <Badge className="bg-green-600">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {language === 'kn' ? 'ಪಾವತಿಸಲಾಗಿದೆ' : 'Paid'}
                          </Badge>
                        ) : isCancelled ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {language === 'kn' ? 'ರದ್ದಾಗಿದೆ' : 'Cancelled'}
                          </Badge>
                        ) : isConfirmed ? (
                          <Badge>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('confirmed')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('pending')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-2">
                      {orderedItems.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {language === 'kn' ? item.nameKn : item.name} × {item.quantity}
                          </span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      {orderedItems.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{orderedItems.length - 3} {language === 'kn' ? 'ಹೆಚ್ಚಿನ ಐಟಂಗಳು' : 'more items'}
                        </p>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>{t('total')}</span>
                      <span className="text-primary">₹{order.total_amount}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
