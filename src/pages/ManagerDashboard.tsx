import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Printer, 
  XCircle, 
  Trash2,
  Phone,
  MessageCircle,
  Plus,
  Minus,
  History,
  UtensilsCrossed,
  DollarSign
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ManagerDashboard() {
  const { t, language } = useLanguage();
  const { isManager } = useAuth();
  const { orders, isLoading, confirmOrder, cancelOrder, confirmPayment, deleteOrder, refreshOrders } = useOrders();
  const { menuItems, toggleAvailability } = useMenuItems();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

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

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled');
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      toast.success('Order deleted');
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await confirmPayment(orderId);
      toast.success('Payment confirmed!');
    } catch (error) {
      toast.error('Failed to confirm payment');
    }
  };

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    const success = await toggleAvailability(itemId, isAvailable);
    if (success) {
      toast.success(isAvailable ? 'Item is now available' : 'Item is now unavailable');
    } else {
      toast.error('Failed to update availability');
    }
  };

  const handlePrintBill = (order: typeof orders[0]) => {
    if (!order.payment_confirmed) {
      toast.error('Payment must be confirmed before printing bill');
      return;
    }

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
        <div class="info">Payment: ${order.payment_mode} ✓</div>
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
  const confirmedOrders = orders.filter(o => o.order_status === 'Confirmed' && !o.payment_confirmed);
  const paidOrders = orders.filter(o => o.payment_confirmed);
  const cancelledOrders = orders.filter(o => o.order_status === 'Cancelled');

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="orders" className="flex-1">
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1">
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Menu Control
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-8">
            {orders.filter(o => o.order_status !== 'Cancelled' && !o.payment_confirmed).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">{t('noOrders')}</p>
              </div>
            ) : (
              <>
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
                          onCancel={() => handleCancelOrder(order.id)}
                          onDelete={() => handleDeleteOrder(order.id)}
                          onPrint={() => handlePrintBill(order)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Confirmed Orders - Awaiting Payment */}
                {confirmedOrders.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Confirmed - Awaiting Payment ({confirmedOrders.length})
                    </h2>
                    <div className="space-y-4">
                      {confirmedOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          language={language}
                          onConfirmPayment={() => handleConfirmPayment(order.id)}
                          onDelete={() => handleDeleteOrder(order.id)}
                          onPrint={() => handlePrintBill(order)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          {/* Menu Control Tab */}
          <TabsContent value="menu">
            <div className="space-y-4">
              {['south-indian', 'north-indian', 'chinese', 'tandoor'].map((category) => {
                const categoryItems = menuItems.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="capitalize">{category.replace('-', ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className={`font-medium ${!item.isAvailable ? 'text-muted-foreground line-through' : ''}`}>
                              {language === 'kn' ? item.nameKn : item.name}
                            </p>
                            <p className="text-sm text-muted-foreground">₹{item.price}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={item.isAvailable ? 'destructive' : 'default'}
                              size="sm"
                              onClick={() => handleToggleAvailability(item.id, !item.isAvailable)}
                            >
                              {item.isAvailable ? (
                                <>
                                  <Minus className="h-4 w-4 mr-1" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Enable
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-8">
            {/* Paid Orders */}
            {paidOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Completed Orders ({paidOrders.length})
                </h2>
                <div className="space-y-4">
                  {paidOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      language={language}
                      onPrint={() => handlePrintBill(order)}
                      onDelete={() => handleDeleteOrder(order.id)}
                      isCompleted
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Cancelled Orders */}
            {cancelledOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Cancelled Orders ({cancelledOrders.length})
                </h2>
                <div className="space-y-4">
                  {cancelledOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      language={language}
                      onDelete={() => handleDeleteOrder(order.id)}
                      onPrint={() => {}}
                      isCancelled
                    />
                  ))}
                </div>
              </section>
            )}

            {paidOrders.length === 0 && cancelledOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No order history</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface OrderCardProps {
  order: any;
  language: 'en' | 'kn';
  onConfirm?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onConfirmPayment?: () => void;
  onPrint: () => void;
  isCompleted?: boolean;
  isCancelled?: boolean;
}

function OrderCard({ 
  order, 
  language, 
  onConfirm, 
  onCancel, 
  onDelete, 
  onConfirmPayment, 
  onPrint,
  isCompleted,
  isCancelled 
}: OrderCardProps) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const isPending = order.order_status === 'Pending';
  const isConfirmed = order.order_status === 'Confirmed';
  const showPaymentInfo = order.eating_finished && order.payment_mode !== 'Not Paid';

  const handleCall = () => {
    window.location.href = `tel:${order.phone_number}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello ${order.customer_name}, this is Nalapaka Nanjangud regarding your order for Table ${order.table_number}.`);
    window.open(`https://wa.me/91${order.phone_number.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Card className={`${isCompleted ? 'border-green-200 bg-green-50/50' : isCancelled ? 'border-red-200 bg-red-50/50' : isPending ? 'border-yellow-200' : 'border-green-200'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Table {order.table_number}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isCompleted ? 'default' : isCancelled ? 'destructive' : isPending ? 'secondary' : 'default'}>
              {isCompleted ? 'Paid' : order.order_status}
            </Badge>
            {showPaymentInfo && !isCompleted && (
              <Badge variant="outline">
                {order.payment_mode === 'Cash' ? 'Cash Payment' : 'Online Payment'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="grid grid-cols-2 gap-2 text-sm flex-1">
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{order.phone_number}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCall}>
                  <Phone className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleWhatsApp}>
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </Button>
              </div>
            </div>
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

        {!isCancelled && (
          <div className="flex flex-wrap gap-2 pt-2">
            {isPending && onConfirm && (
              <Button onClick={onConfirm} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm
              </Button>
            )}
            {isPending && onCancel && (
              <Button variant="destructive" onClick={onCancel} className="flex-1">
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            {isConfirmed && !isCompleted && onConfirmPayment && showPaymentInfo && (
              <Button onClick={onConfirmPayment} className="flex-1 bg-green-600 hover:bg-green-700">
                <DollarSign className="h-4 w-4 mr-1" />
                Confirm Payment
              </Button>
            )}
            {isCompleted && (
              <Button variant="outline" onClick={onPrint} className="flex-1">
                <Printer className="h-4 w-4 mr-1" />
                Print Bill
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}

        {isCancelled && onDelete && (
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
