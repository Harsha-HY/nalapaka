import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
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
  DollarSign,
  Banknote,
  Smartphone,
  RotateCcw,
  Package,
  LogOut
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useLockedTables } from '@/hooks/useLockedTables';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WaitTimeSelector } from '@/components/WaitTimeSelector';
import { CountdownTimer } from '@/components/CountdownTimer';
import { toast } from 'sonner';

export default function ManagerDashboard() {
  const { language } = useLanguage();
  const { isManager, signOut } = useAuth();
  const { 
    orders, 
    isLoading, 
    confirmOrder, 
    cancelOrder, 
    confirmPayment, 
    deleteOrder, 
    refreshOrders,
    getTodayStats 
  } = useOrders();
  const { menuItems, toggleAvailability } = useMenuItems();
  const { unlockTable } = useLockedTables();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<'orders' | 'menu' | 'history'>('orders');
  const [waitTimeOrderId, setWaitTimeOrderId] = useState<string | null>(null);

  // Redirect non-managers
  useEffect(() => {
    if (!isManager) {
      navigate('/menu');
    }
  }, [isManager, navigate]);

  if (!isManager) {
    return null;
  }

  const handleConfirmOrder = (orderId: string) => {
    setWaitTimeOrderId(orderId);
  };

  const handleWaitTimeSelect = async (minutes: number) => {
    if (!waitTimeOrderId) return;
    
    try {
      await confirmOrder(waitTimeOrderId, minutes);
      toast.success('Order confirmed!');
    } catch (error) {
      toast.error('Failed to confirm order');
    } finally {
      setWaitTimeOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      toast.success('Order rejected');
    } catch (error) {
      toast.error('Failed to reject order');
    }
  };

  const handleDeleteOrder = async (orderId: string, tableNumber: string) => {
    try {
      await deleteOrder(orderId);
      // Unlock table if it was a dine-in order
      if (tableNumber && tableNumber !== 'PARCEL') {
        await unlockTable(tableNumber);
      }
      toast.success('Order deleted');
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handlePaymentConfirm = async (orderId: string, paymentMode: 'Cash' | 'Online', tableNumber: string) => {
    try {
      await confirmPayment(orderId, paymentMode);
      // Unlock table for dine-in orders
      if (tableNumber && tableNumber !== 'PARCEL') {
        await unlockTable(tableNumber);
      }
      toast.success(`Payment confirmed (${paymentMode})!`);
    } catch (error) {
      toast.error('Failed to confirm payment');
    }
  };

  const handleResetTable = async (tableNumber: string) => {
    try {
      await unlockTable(tableNumber);
      toast.success(`Table ${tableNumber} has been reset`);
    } catch (error) {
      toast.error('Failed to reset table');
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

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handlePrintBill = (order: Order) => {
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

    const orderType = order.order_type || 'dine-in';

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
          .badge { display: inline-block; padding: 2px 8px; background: #eee; border-radius: 4px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NALAPAKA</h1>
          <p>Nanjangud</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="divider"></div>
        <div class="info"><span class="badge">${orderType === 'parcel' ? 'PARCEL' : 'DINE-IN'}</span></div>
        ${orderType === 'dine-in' ? `<div class="info">Table: ${order.table_number}</div>` : ''}
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

  // Filter orders
  const pendingOrders = orders.filter(o => 
    o.order_status === 'Pending' || 
    (o.order_status === 'Confirmed' && !o.payment_confirmed)
  );
  const completedOrders = orders.filter(o => o.payment_confirmed);
  const { totalOrders, totalRevenue } = getTodayStats();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Sidebar - History */}
      <aside className="w-80 border-r bg-muted/30 hidden lg:flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Order History
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {completedOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No completed orders yet</p>
          ) : (
            completedOrders.slice(0, 20).map((order) => (
              <Card key={order.id} className="bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.order_type === 'parcel' ? 'PARCEL' : `Table ${order.table_number}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ₹{order.total_amount}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Manager Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshOrders} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="px-4 pb-4 flex gap-4">
            <Card className="flex-1">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Orders</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                </div>
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">₹{totalRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 pb-2 flex gap-2">
            <Button 
              variant={activeSection === 'orders' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('orders')}
            >
              <UtensilsCrossed className="h-4 w-4 mr-1" />
              Orders ({pendingOrders.length})
            </Button>
            <Button 
              variant={activeSection === 'menu' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('menu')}
            >
              Menu Control
            </Button>
            <Button 
              variant={activeSection === 'history' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('history')}
              className="lg:hidden"
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          {/* Orders Section */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-muted-foreground">No pending orders</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pendingOrders.map((order) => (
                    <PendingOrderCard
                      key={order.id}
                      order={order}
                      language={language}
                      onConfirm={() => handleConfirmOrder(order.id)}
                      onReject={() => handleRejectOrder(order.id)}
                      onPaymentCash={() => handlePaymentConfirm(order.id, 'Cash', order.table_number)}
                      onPaymentUPI={() => handlePaymentConfirm(order.id, 'Online', order.table_number)}
                      onResetTable={() => handleResetTable(order.table_number)}
                    />
                  ))}
                </div>
              )}

              {/* Completed Orders Section */}
              {completedOrders.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Completed Orders ({completedOrders.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {completedOrders.slice(0, 10).map((order) => (
                      <CompletedOrderCard
                        key={order.id}
                        order={order}
                        language={language}
                        onPrint={() => handlePrintBill(order)}
                        onDelete={() => handleDeleteOrder(order.id, order.table_number)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menu Control Section */}
          {activeSection === 'menu' && (
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
                          <Button
                            variant={item.isAvailable ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleAvailability(item.id, !item.isAvailable)}
                          >
                            {item.isAvailable ? (
                              <><Minus className="h-4 w-4 mr-1" />Disable</>
                            ) : (
                              <><Plus className="h-4 w-4 mr-1" />Enable</>
                            )}
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* History Section (Mobile) */}
          {activeSection === 'history' && (
            <div className="space-y-4 lg:hidden">
              {completedOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No completed orders yet</p>
              ) : (
                completedOrders.map((order) => (
                  <CompletedOrderCard
                    key={order.id}
                    order={order}
                    language={language}
                    onPrint={() => handlePrintBill(order)}
                    onDelete={() => handleDeleteOrder(order.id, order.table_number)}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Wait Time Selector Modal */}
      <WaitTimeSelector
        open={waitTimeOrderId !== null}
        onClose={() => setWaitTimeOrderId(null)}
        onSelect={handleWaitTimeSelect}
      />
    </div>
  );
}

// Pending Order Card Component
interface PendingOrderCardProps {
  order: Order;
  language: 'en' | 'kn';
  onConfirm: () => void;
  onReject: () => void;
  onPaymentCash: () => void;
  onPaymentUPI: () => void;
  onResetTable: () => void;
}

function PendingOrderCard({ 
  order, 
  language, 
  onConfirm, 
  onReject,
  onPaymentCash,
  onPaymentUPI,
  onResetTable
}: PendingOrderCardProps) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const isPending = order.order_status === 'Pending';
  const isConfirmed = order.order_status === 'Confirmed';
  const orderType = order.order_type || 'dine-in';
  const waitTimeMinutes = order.wait_time_minutes;
  const confirmedAt = order.confirmed_at;

  const handleCall = () => {
    window.location.href = `tel:${order.phone_number}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello ${order.customer_name}, this is Nalapaka Nanjangud regarding your order.`);
    window.open(`https://wa.me/91${order.phone_number.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Card className={`${isPending ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {orderType === 'parcel' ? (
              <Badge variant="secondary"><Package className="h-3 w-3 mr-1" />PARCEL</Badge>
            ) : (
              <CardTitle className="text-lg">Table {order.table_number}</CardTitle>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPending ? 'secondary' : 'default'}>
              {isPending ? 'PENDING' : 'CONFIRMED'}
            </Badge>
            <Badge variant="outline">PAYMENT PENDING</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{order.phone_number}</p>
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

        {/* Timer */}
        {isConfirmed && waitTimeMinutes && confirmedAt && (
          <div className="py-2 px-3 bg-primary/10 rounded-md flex items-center justify-between">
            <span className="text-sm font-medium">Wait Time:</span>
            <CountdownTimer confirmedAt={confirmedAt} waitTimeMinutes={waitTimeMinutes} compact />
          </div>
        )}

        <Separator />

        {/* Items */}
        <div className="space-y-1 max-h-32 overflow-auto">
          {orderedItems.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{language === 'kn' ? item.nameKn : item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-primary">₹{order.total_amount}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {isPending && (
            <>
              <Button onClick={onConfirm} className="w-full">
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm
              </Button>
              <Button variant="destructive" onClick={onReject} className="w-full">
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          {isConfirmed && (
            <>
              <Button onClick={onPaymentCash} className="w-full" variant="outline">
                <Banknote className="h-4 w-4 mr-1" />
                Cash Paid
              </Button>
              <Button onClick={onPaymentUPI} className="w-full" variant="outline">
                <Smartphone className="h-4 w-4 mr-1" />
                UPI Paid
              </Button>
            </>
          )}
        </div>

        {/* Reset Table Button */}
        {orderType === 'dine-in' && isConfirmed && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onResetTable}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Table
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Completed Order Card Component
interface CompletedOrderCardProps {
  order: Order;
  language: 'en' | 'kn';
  onPrint: () => void;
  onDelete: () => void;
}

function CompletedOrderCard({ order, language, onPrint, onDelete }: CompletedOrderCardProps) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const orderType = order.order_type || 'dine-in';

  return (
    <Card className="border-green-300 bg-green-50/50 dark:bg-green-900/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {orderType === 'parcel' ? (
              <Badge variant="secondary"><Package className="h-3 w-3 mr-1" />PARCEL</Badge>
            ) : (
              <CardTitle className="text-lg">Table {order.table_number}</CardTitle>
            )}
          </div>
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            PAID ({order.payment_mode})
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <Separator />

        <div className="space-y-1 max-h-24 overflow-auto text-sm">
          {orderedItems.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{language === 'kn' ? item.nameKn : item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="text-green-600">₹{order.total_amount}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print Bill
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
