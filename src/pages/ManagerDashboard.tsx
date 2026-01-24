import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, Clock, Printer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ManagerDashboard() {
  const { t, language } = useLanguage();
  const { isManager } = useAuth();
  const { orders, isLoading, confirmOrder, refreshOrders } = useOrders();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isManager) {
    navigate('/menu');
    return null;
  }

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await confirmOrder(orderId);
      toast.success('Order confirmed!');
    } catch (error) {
      toast.error('Failed to confirm order');
    }
  };

  const handlePrintBill = (order: typeof orders[0]) => {
    const orderedItems = order.ordered_items as Array<{
      name: string;
      nameKn: string;
      quantity: number;
      price: number;
    }>;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Nalapaka</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; font-size: 12px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
          .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          .info { font-size: 11px; margin: 3px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NALAPAKA</h1>
          <p>Nanjangud</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="divider"></div>
        <div class="info">Table: ${order.table_number}</div>
        <div class="info">Customer: ${order.customer_name}</div>
        <div class="info">Phone: ${order.phone_number}</div>
        <div class="divider"></div>
        ${orderedItems.map(item => `
          <div class="item">
            <span>${item.name} x ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="total">
          <span>TOTAL</span>
          <span>₹${order.total_amount}</span>
        </div>
        <div class="divider"></div>
        <div class="info">Payment: ${order.payment_mode}</div>
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Visit again!</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const pendingOrders = orders.filter(o => o.order_status === 'Pending');
  const confirmedOrders = orders.filter(o => o.order_status === 'Confirmed');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('managerDashboard')}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={refreshOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">{t('noOrders')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pending Orders ({pendingOrders.length})
                </h2>
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      language={language}
                      onConfirm={() => handleConfirmOrder(order.id)}
                      onPrint={() => handlePrintBill(order)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Confirmed Orders */}
            {confirmedOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Confirmed Orders ({confirmedOrders.length})
                </h2>
                <div className="space-y-4">
                  {confirmedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      language={language}
                      onPrint={() => handlePrintBill(order)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

interface OrderCardProps {
  order: any;
  language: 'en' | 'kn';
  onConfirm?: () => void;
  onPrint: () => void;
}

function OrderCard({ order, language, onConfirm, onPrint }: OrderCardProps) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const isConfirmed = order.order_status === 'Confirmed';

  return (
    <Card className={isConfirmed ? 'border-green-200' : 'border-yellow-200'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Table {order.table_number}</CardTitle>
          <Badge variant={isConfirmed ? 'default' : 'secondary'}>
            {order.order_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Customer:</span>
            <p className="font-medium">{order.customer_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>
            <p className="font-medium">{order.phone_number}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          {orderedItems.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{language === 'kn' ? item.nameKn : item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary">₹{order.total_amount}</span>
        </div>

        <div className="text-sm text-muted-foreground">
          Payment: {order.payment_mode}
        </div>

        <div className="flex gap-2 pt-2">
          {!isConfirmed && onConfirm && (
            <Button onClick={onConfirm} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Order
            </Button>
          )}
          <Button variant="outline" onClick={onPrint} className={isConfirmed ? 'flex-1' : ''}>
            <Printer className="h-4 w-4 mr-1" />
            Print Bill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
