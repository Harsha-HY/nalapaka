import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  LogOut,
  User,
  ChefHat
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { useKitchenStaff } from '@/hooks/useKitchenStaff';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderExtraItemsBadge } from '@/components/OrderExtraItemsBadge';
import { toast } from 'sonner';

type KitchenSection = 'active' | 'prepared';

export default function KitchenDashboard() {
  const { signOut, user } = useAuth();
  const { orders, isLoading, refreshOrders, kitchenAcceptOrder, kitchenMarkPrepared } = useOrders();
  const { currentKitchen } = useKitchenStaff();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<KitchenSection>('active');

  useEffect(() => {
    if (!currentKitchen) {
      const timer = setTimeout(() => {
        if (!currentKitchen) navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentKitchen, navigate]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }, [orders, today]);

  // Active = not yet prepared (pending or confirmed, not payment_confirmed)
  const activeOrders = todayOrders.filter(o => 
    !o.payment_confirmed && 
    o.order_status !== 'Cancelled' &&
    !(o as any).kitchen_prepared_at
  );

  const preparedOrders = todayOrders.filter(o => 
    (o as any).kitchen_prepared_at && !o.payment_confirmed
  );

  if (!currentKitchen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAcceptOrder = async (orderId: string) => {
    if (!currentKitchen || !user) return;
    try {
      await kitchenAcceptOrder(orderId, currentKitchen.name);
      toast.success('Order accepted and confirmed!');
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleMarkPrepared = async (orderId: string) => {
    if (!currentKitchen) return;
    try {
      await kitchenMarkPrepared(orderId);
      toast.success('Order marked as prepared!');
    } catch (error) {
      toast.error('Failed to mark as prepared');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{currentKitchen.name}</h1>
              <p className="text-xs text-muted-foreground">Kitchen Dashboard</p>
            </div>
          </div>
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

        <div className="px-4 pb-3 flex gap-2">
          <Button 
            variant={activeSection === 'active' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('active')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Active ({activeOrders.length})
          </Button>
          <Button 
            variant={activeSection === 'prepared' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('prepared')}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Prepared ({preparedOrders.length})
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {activeSection === 'active' && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No active orders</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    currentKitchenName={currentKitchen.name}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onMarkPrepared={() => handleMarkPrepared(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'prepared' && (
          <div className="space-y-4">
            {preparedOrders.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No prepared orders</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {preparedOrders.map((order) => {
                  const orderedItems = order.ordered_items as Array<{ name: string; quantity: number }>;
                  const seats = (order as any).seats || [];
                  return (
                    <Card key={order.id} className="shadow-soft border-0 border-l-4 border-l-success">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold">Table {order.table_number}</p>
                            {seats.length > 0 && (
                              <Badge variant="outline" className="text-xs">Seats: {seats.join(', ')}</Badge>
                            )}
                          </div>
                          <Badge className="bg-success text-success-foreground">PREPARED</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        <Separator className="my-2" />
                        <div className="space-y-1">
                          {orderedItems.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.name} × {item.quantity}
                            </div>
                          ))}
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

// Kitchen Order Card - NO prices, NO amounts
interface KitchenOrderCardProps {
  order: Order;
  currentKitchenName: string;
  onAccept: () => void;
  onMarkPrepared: () => void;
}

function KitchenOrderCard({ order, currentKitchenName, onAccept, onMarkPrepared }: KitchenOrderCardProps) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
  }>;

  const isPending = order.order_status === 'Pending';
  const seats = (order as any).seats || [];
  const extraItems = (order as any).extra_items || [];
  const kitchenAccepted = (order as any).accepted_by_kitchen_name;
  const isAcceptedByMe = kitchenAccepted === currentKitchenName;

  // Calculate time since order
  const minutesAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const timeColor = minutesAgo <= 2 ? 'text-success' : minutesAgo <= 5 ? 'text-warning' : 'text-destructive';

  return (
    <Card className={`shadow-soft border-0 ${isPending ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-primary'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Table {order.table_number}</CardTitle>
            {seats.length > 0 && (
              <Badge variant="outline" className="text-xs">Seats: {seats.join(', ')}</Badge>
            )}
          </div>
          <div className="text-right">
            <Badge variant={isPending ? 'secondary' : 'default'} className={isPending ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary'}>
              {isPending ? 'NEW' : 'ACTIVE'}
            </Badge>
            <p className={`text-xs font-semibold mt-1 ${timeColor}`}>
              {minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Customer Name */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{order.customer_name}</span>
        </div>

        <Separator />

        {/* Items - NO PRICES */}
        <div className="space-y-2">
          {orderedItems.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <Badge variant="secondary" className="text-xs">×{item.quantity}</Badge>
            </div>
          ))}
        </div>

        {/* Extra Items */}
        {extraItems.length > 0 && (
          <OrderExtraItemsBadge extraItems={extraItems.map((e: any) => ({ ...e, price: undefined }))} />
        )}

        {/* Kitchen Accepted */}
        {kitchenAccepted && (
          <div className="py-2 px-3 rounded-md flex items-center gap-2 bg-success/20 text-success">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isAcceptedByMe ? 'You accepted this order' : `Accepted by ${kitchenAccepted}`}
            </span>
          </div>
        )}

        {/* Accept Button */}
        {!kitchenAccepted && (
          <Button 
            className="w-full bg-success hover:bg-success/90" 
            onClick={onAccept}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept Order
          </Button>
        )}

        {/* Mark as Prepared Button */}
        {kitchenAccepted && !(order as any).kitchen_prepared_at && (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={onMarkPrepared}
          >
            <ChefHat className="h-4 w-4 mr-1" />
            Mark as Prepared
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
