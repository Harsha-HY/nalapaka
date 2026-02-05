import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Printer, 
  Phone,
  MessageCircle,
  RotateCcw,
  Package,
  LogOut,
  AlertCircle,
  User,
  History,
  Table,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { useServers } from '@/hooks/useServers';
import { useLockedSeats } from '@/hooks/useLockedSeats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CountdownTimer } from '@/components/CountdownTimer';
import { OrderExtraItemsBadge } from '@/components/OrderExtraItemsBadge';
import { QRCodePayment } from '@/components/QRCodePayment';
import { printKitchenSlip } from '@/components/KitchenSlipPrint';
import { toast } from 'sonner';

type ServerSection = 'orders' | 'history';

export default function ServerDashboard() {
  const { language } = useLanguage();
  const { signOut, user, isServer } = useAuth();
  const { orders, isLoading, refreshOrders, serverAcceptOrder } = useOrders();
  const { currentServer } = useServers();
  const { unlockSeatsByOrderId } = useLockedSeats();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ServerSection>('orders');

  // Redirect if not a server - STRICT server-only access
  useEffect(() => {
    if (!isServer && !currentServer) {
      const timer = setTimeout(() => {
        if (!currentServer) {
          navigate('/');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentServer, isServer, navigate]);

  // Get today's date and 48 hours ago for filtering
  const { today, fortyEightHoursAgo } = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const h48 = new Date();
    h48.setHours(h48.getHours() - 48);
    return { today: d, fortyEightHoursAgo: h48 };
  }, []);

  // Filter orders for assigned tables only - Today
  const myTodayOrders = useMemo(() => {
    if (!currentServer) return [];
    
    return orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      const isToday = orderDate.getTime() === today.getTime();
      const isMyTable = currentServer.assigned_tables.includes(o.table_number);
      return isToday && isMyTable;
    });
  }, [orders, currentServer, today]);

  // Filter orders for assigned tables - Last 48 hours (for history)
  const myHistoryOrders = useMemo(() => {
    if (!currentServer) return [];
    
    return orders.filter(o => {
      const orderDate = new Date(o.created_at);
      const isWithin48Hours = orderDate >= fortyEightHoursAgo;
      const isMyTable = currentServer.assigned_tables.includes(o.table_number);
      const isPaid = o.payment_confirmed;
      return isWithin48Hours && isMyTable && isPaid;
    });
  }, [orders, currentServer, fortyEightHoursAgo]);

  const pendingOrders = myTodayOrders.filter(o => 
    o.order_status === 'Pending' || 
    (o.order_status === 'Confirmed' && !o.payment_confirmed)
  );
  
  const completedOrders = myTodayOrders.filter(o => o.payment_confirmed);

  if (!currentServer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleResetSeats = async (orderId: string, tableNumber: string, seats: string[]) => {
    try {
      await unlockSeatsByOrderId(orderId);
      toast.success(`Table ${tableNumber} – Seats ${seats.join(', ')} have been reset`);
    } catch (error) {
      toast.error('Failed to reset table');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!currentServer || !user) return;
    
    try {
      await serverAcceptOrder(orderId, user.id, currentServer.name);
      toast.success('Order accepted! Manager has been notified.');
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handlePrintKitchen = (order: Order, isExtra: boolean = false) => {
    const items = isExtra 
      ? ((order as any).extra_items || [])
      : (order.ordered_items as any[] || []);
    
    if (items.length === 0) {
      toast.error('No items to print');
      return;
    }
    
    printKitchenSlip(order, items, isExtra);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{currentServer.name}</h1>
              <p className="text-xs text-muted-foreground">Server Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshOrders} disabled={isLoading} className="shadow-sm">
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
        
        {/* Assigned Tables Display */}
        <div className="px-4 pb-4">
          <Card className="shadow-soft border-0 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Table className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Assigned Tables</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentServer.assigned_tables.map(table => (
                  <Badge key={table} variant="secondary" className="text-sm">
                    Table {table}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pb-3 flex gap-2">
          <Button 
            variant={activeSection === 'orders' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('orders')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Orders
            {pendingOrders.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </Button>
          <Button 
            variant={activeSection === 'history' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('history')}
          >
            <History className="h-4 w-4 mr-1" />
            History (48h)
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {/* Orders Section */}
        {activeSection === 'orders' && (
          <div className="space-y-6">
            {/* Pending Orders */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Active Orders ({pendingOrders.length})
              </h2>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-muted-foreground">No active orders</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingOrders.map((order) => (
                    <ServerOrderCard
                      key={order.id}
                      order={order}
                      language={language}
                      currentServer={currentServer}
                      onResetSeats={() => handleResetSeats(order.id, order.table_number, (order as any).seats || [])}
                      onPrintKitchen={() => handlePrintKitchen(order, false)}
                      onPrintExtraKitchen={() => handlePrintKitchen(order, true)}
                      onAcceptOrder={() => handleAcceptOrder(order.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Completed Today ({completedOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {completedOrders.slice(0, 6).map((order) => (
                    <Card key={order.id} className="shadow-soft border-0">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Table {order.table_number}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                          </div>
                          <Badge className="bg-success text-success-foreground">
                            ₹{order.total_amount}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Section - 48 hours */}
        {activeSection === 'history' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Showing paid orders from your tables in the last 48 hours. This history is read-only.
            </div>
            {myHistoryOrders.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myHistoryOrders.map((order) => {
                  const orderedItems = order.ordered_items as Array<{
                    name: string;
                    quantity: number;
                    price: number;
                  }>;
                  return (
                    <Card key={order.id} className="shadow-soft border-0">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">Table {order.table_number}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <Badge className="bg-success text-success-foreground">
                            {order.payment_mode}
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="text-sm space-y-1">
                          {orderedItems.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-muted-foreground">
                              <span>{item.name} × {item.quantity}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          {orderedItems.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{orderedItems.length - 3} more items</p>
                          )}
                        </div>
                        <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                          <span>Total</span>
                          <span>₹{order.total_amount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Server Order Card Component
interface ServerOrderCardProps {
  order: Order;
  language: 'en' | 'kn';
  currentServer: { name: string; user_id: string } | null;
  onResetSeats: () => void;
  onPrintKitchen: () => void;
  onPrintExtraKitchen: () => void;
  onAcceptOrder: () => void;
}

function ServerOrderCard({ 
  order, 
  language, 
  currentServer,
  onResetSeats,
  onPrintKitchen,
  onPrintExtraKitchen,
  onAcceptOrder
}: ServerOrderCardProps) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const isPending = order.order_status === 'Pending';
  const isConfirmed = order.order_status === 'Confirmed';
  const orderType = order.order_type || 'dine-in';
  const seats = (order as any).seats || [];
  const waitTimeMinutes = order.wait_time_minutes;
  const confirmedAt = order.confirmed_at;
  const paymentIntent = (order as any).payment_intent;
  const eatingFinished = order.eating_finished;
  const extraItems = (order as any).extra_items || [];
  const acceptedByServerName = (order as any).accepted_by_server_name;
  const isAcceptedByMe = currentServer && (order as any).accepted_by_server_id === currentServer.user_id;

  const handleCall = () => {
    window.location.href = `tel:${order.phone_number}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello ${order.customer_name}, this is Nalapaka regarding your order.`);
    window.open(`https://wa.me/91${order.phone_number.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Card className={`shadow-soft border-0 ${isPending ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-primary'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {orderType === 'parcel' ? (
              <Badge variant="secondary" className="w-fit"><Package className="h-3 w-3 mr-1" />PARCEL</Badge>
            ) : (
              <>
                <CardTitle className="text-lg font-bold">Table {order.table_number}</CardTitle>
                {seats.length > 0 && (
                  <Badge variant="outline" className="text-xs w-fit bg-card">Seats: {seats.join(', ')}</Badge>
                )}
              </>
            )}
          </div>
          <Badge 
            variant={isPending ? 'secondary' : 'default'}
            className={isPending ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary'}
          >
            {isPending ? 'PENDING' : 'CONFIRMED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Print Buttons */}
        <Button variant="outline" size="sm" className="w-full" onClick={onPrintKitchen}>
          <Printer className="h-4 w-4 mr-1" />
          Print Kitchen Slip
        </Button>

        {extraItems.length > 0 && (
          <Button variant="outline" size="sm" className="w-full bg-accent" onClick={onPrintExtraKitchen}>
            <Printer className="h-4 w-4 mr-1" />
            Print EXTRA Items
          </Button>
        )}

        {/* Server Acceptance Status */}
        {acceptedByServerName && (
          <div className="py-2 px-3 rounded-md flex items-center gap-2 bg-success/20 text-success">
            <UserCheck className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isAcceptedByMe ? 'You accepted this order' : `Accepted by ${acceptedByServerName}`}
            </span>
          </div>
        )}

        {/* Accept Order Button - show if confirmed but not yet accepted */}
        {isConfirmed && !acceptedByServerName && (
          <Button 
            className="w-full bg-success hover:bg-success/90" 
            onClick={onAcceptOrder}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Accept Order
          </Button>
        )}

        {/* Customer Info */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{order.phone_number}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCall}>
              <Phone className="h-4 w-4 text-success" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleWhatsApp}>
              <MessageCircle className="h-4 w-4 text-success" />
            </Button>
          </div>
        </div>

        {/* Payment Intent Notification */}
        {eatingFinished && paymentIntent && (
          <div className={`py-2 px-3 rounded-md flex items-center gap-2 ${
            paymentIntent === 'Cash' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Paying through {paymentIntent}
            </span>
          </div>
        )}

        {/* QR Code for Online Payment */}
        {eatingFinished && paymentIntent === 'UPI' && (
          <QRCodePayment amount={order.total_amount} orderId={order.id} size={150} />
        )}

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

        {/* Extra Items */}
        <OrderExtraItemsBadge extraItems={extraItems} />

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-primary">₹{order.total_amount}</span>
        </div>

        {/* Reset Button */}
        {orderType === 'dine-in' && isConfirmed && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onResetSeats}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Table
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
