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
  User
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

export default function ServerDashboard() {
  const { language } = useLanguage();
  const { signOut, user } = useAuth();
  const { orders, isLoading, refreshOrders } = useOrders();
  const { currentServer } = useServers();
  const { unlockSeatsByOrderId } = useLockedSeats();
  const navigate = useNavigate();

  // Redirect if not a server
  useEffect(() => {
    if (!currentServer) {
      // If no server record, might not be a server
      const timer = setTimeout(() => {
        if (!currentServer) {
          navigate('/menu');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentServer, navigate]);

  // Get today's date for filtering
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Filter orders for assigned tables only
  const myOrders = useMemo(() => {
    if (!currentServer) return [];
    
    return orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      const isToday = orderDate.getTime() === today.getTime();
      const isMyTable = currentServer.assigned_tables.includes(o.table_number);
      return isToday && isMyTable;
    });
  }, [orders, currentServer, today]);

  const pendingOrders = myOrders.filter(o => 
    o.order_status === 'Pending' || 
    (o.order_status === 'Confirmed' && !o.payment_confirmed)
  );
  
  const completedOrders = myOrders.filter(o => o.payment_confirmed);

  // Calculate my revenue
  const myRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

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

  const handleResetSeats = async (orderId: string) => {
    try {
      await unlockSeatsByOrderId(orderId);
      toast.success('Table has been reset');
    } catch (error) {
      toast.error('Failed to reset table');
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
              <h1 className="text-lg font-bold text-foreground">Server Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Logged in as: {currentServer.name}
              </p>
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
        
        {/* Summary Stats */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          <Card className="shadow-soft border-0 bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">My Tables</p>
              <p className="text-lg font-bold text-foreground">
                {currentServer.assigned_tables.join(', ')}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">My Revenue Today</p>
              <p className="text-lg font-bold text-success">₹{myRevenue}</p>
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {/* Pending Orders */}
        <div className="space-y-6">
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
                    onResetSeats={() => handleResetSeats(order.id)}
                    onPrintKitchen={() => handlePrintKitchen(order, false)}
                    onPrintExtraKitchen={() => handlePrintKitchen(order, true)}
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
      </main>
    </div>
  );
}

// Server Order Card Component
interface ServerOrderCardProps {
  order: Order;
  language: 'en' | 'kn';
  onResetSeats: () => void;
  onPrintKitchen: () => void;
  onPrintExtraKitchen: () => void;
}

function ServerOrderCard({ 
  order, 
  language, 
  onResetSeats,
  onPrintKitchen,
  onPrintExtraKitchen
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
