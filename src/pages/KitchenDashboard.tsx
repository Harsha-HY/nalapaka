import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  LogOut,
  User,
  ChefHat,
  Bell,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { useKitchenStaff } from '@/hooks/useKitchenStaff';
import { useHotelContext } from '@/hooks/useHotelContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

type KitchenSection = 'active' | 'prepared' | 'history';

export default function KitchenDashboard() {
  const { signOut, user } = useAuth();
  const { 
    orders, 
    isLoading, 
    refreshOrders, 
    kitchenAcceptOrder, 
    kitchenMarkPrepared, 
    cleanupPreparedOlderThan24Hours,
    toggleExtraItemComplete
  } = useOrders();
  const { currentKitchen } = useKitchenStaff();
  const { hotelName } = useHotelContext();
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

  useEffect(() => {
    cleanupPreparedOlderThan24Hours().catch(() => {
      // no-op: dashboard still works even if cleanup fails
    });
  }, [cleanupPreparedOlderThan24Hours]);

  const last24HoursAgo = useMemo(() => {
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }, []);

  const recentOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at);
      return orderDate >= last24HoursAgo && !(o as any).archived_at;
    });
  }, [orders, last24HoursAgo]);

  // Active = not yet prepared (pending or confirmed, not payment_confirmed, not Cancelled)
  const activeOrders = recentOrders.filter(o => 
    !o.payment_confirmed && 
    o.order_status !== 'Cancelled' &&
    !(o as any).kitchen_prepared_at
  );

  // Prepared = prepared but not yet paid
  const preparedOrders = recentOrders.filter(o => 
    (o as any).kitchen_prepared_at && !o.payment_confirmed
  );

  // History = prepared or paid orders in the last 24h
  const historyOrders = recentOrders.filter(o => 
    o.payment_confirmed || (o as any).kitchen_prepared_at
  );

  if (!currentKitchen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading Kitchen Workspace...</p>
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

  const handleToggleExtraItemComplete = async (orderId: string, itemIdx: number) => {
    try {
      await toggleExtraItemComplete(orderId, itemIdx);
      toast.success('Extra item completion updated!');
    } catch (error) {
      toast.error('Failed to update extra item status');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b shadow-sm">
        <div className="p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">{hotelName || 'Dining Hub'}</h1>
              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Kitchen Station: <span className="text-foreground">{currentKitchen.name}</span>
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

        {/* Tab Navigation */}
        <div className="border-t">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex gap-2">
            <Button 
              variant={activeSection === 'active' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveSection('active')}
              className={`rounded-lg transition-all font-semibold ${
                activeSection === 'active' 
                  ? 'shadow-md bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Clock className="h-4 w-4 mr-1.5" />
              Active Orders
              {activeOrders.length > 0 && (
                <span className="ml-2 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {activeOrders.length}
                </span>
              )}
            </Button>
            
            <Button 
              variant={activeSection === 'prepared' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveSection('prepared')}
              className={`rounded-lg transition-all font-semibold ${
                activeSection === 'prepared' 
                  ? 'shadow-md bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Prepared
              {preparedOrders.length > 0 && (
                <span className="ml-2 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {preparedOrders.length}
                </span>
              )}
            </Button>

            <Button 
              variant={activeSection === 'history' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveSection('history')}
              className={`rounded-lg transition-all font-semibold ${
                activeSection === 'history' 
                  ? 'shadow-md bg-slate-700 hover:bg-slate-800 text-white' 
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <History className="h-4 w-4 mr-1.5" />
              History (24h)
              {historyOrders.length > 0 && (
                <span className="ml-2 bg-muted/40 text-muted-foreground dark:text-muted bg-slate-200 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {historyOrders.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 overflow-auto">
        {/* Active Section */}
        {activeSection === 'active' && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="text-center py-16 bg-background rounded-2xl border shadow-sm">
                <ChefHat className="h-16 w-16 mx-auto text-muted-foreground/60 mb-4 animate-bounce" />
                <p className="text-xl font-bold text-foreground">No active orders</p>
                <p className="text-sm text-muted-foreground mt-1">New incoming orders will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    currentKitchenName={currentKitchen.name}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onMarkPrepared={() => handleMarkPrepared(order.id)}
                    onToggleExtraItemComplete={(itemIdx) => handleToggleExtraItemComplete(order.id, itemIdx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prepared Section */}
        {activeSection === 'prepared' && (
          <div className="space-y-4">
            {preparedOrders.length === 0 ? (
              <div className="text-center py-16 bg-background rounded-2xl border shadow-sm">
                <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground/60 mb-4" />
                <p className="text-xl font-bold text-foreground">No prepared orders</p>
                <p className="text-sm text-muted-foreground mt-1">Prepared orders waiting to be served appear here.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {preparedOrders.map((order) => {
                  const originalItems = ((order as any).base_items && (order as any).base_items.length > 0
                    ? (order as any).base_items
                    : order.ordered_items || []) as Array<{ name: string; quantity: number }>;
                  const extraItems = (order as any).extra_items || [];
                  const seats = (order as any).seats || [];
                  const minutesAgo = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
                  
                  return (
                    <Card key={order.id} className="shadow-md border border-emerald-100 dark:border-emerald-950 bg-background border-l-4 border-l-emerald-500 overflow-hidden hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3 bg-emerald-500/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-black text-emerald-800 dark:text-emerald-400">Table {order.table_number}</CardTitle>
                            {seats.length > 0 && (
                              <Badge variant="outline" className="text-xs bg-background mt-1 font-semibold">
                                Seats: {seats.join(', ')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px]">
                              PREPARED
                            </Badge>
                            <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              {minutesAgo < 1 ? 'Just now' : `${minutesAgo}m ago`}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                          <User className="h-4 w-4" />
                          <span>{order.customer_name}</span>
                        </div>
                        <Separator />
                        
                        {/* Base items */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Original Order</p>
                          {originalItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-muted/50 last:border-0">
                              <span className="font-bold text-foreground text-md">{item.name}</span>
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-extrabold text-sm px-2.5 py-0.5">
                                ×{item.quantity}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        {/* Extra items */}
                        {extraItems.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">Extra Items</p>
                            {extraItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center py-1">
                                <span className="font-bold text-destructive text-md">{item.name}</span>
                                <Badge className="bg-destructive/10 text-destructive font-extrabold text-sm px-2.5 py-0.5">
                                  ×{item.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <div className="space-y-4">
            {historyOrders.length === 0 ? (
              <div className="text-center py-16 bg-background rounded-2xl border shadow-sm">
                <History className="h-16 w-16 mx-auto text-muted-foreground/60 mb-4" />
                <p className="text-xl font-bold text-foreground">No history yet</p>
                <p className="text-sm text-muted-foreground mt-1">Orders prepared or paid in the last 24 hours will show here.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {historyOrders.map((order) => {
                  const originalItems = ((order as any).base_items && (order as any).base_items.length > 0
                    ? (order as any).base_items
                    : order.ordered_items || []) as Array<{ name: string; quantity: number }>;
                  const extraItems = (order as any).extra_items || [];
                  const seats = (order as any).seats || [];
                  const isPaid = order.payment_confirmed;

                  return (
                    <Card key={order.id} className={`shadow-sm border bg-background overflow-hidden hover:shadow-md transition-all duration-300 ${
                      isPaid ? 'border-l-4 border-l-slate-400 border-slate-100' : 'border-l-4 border-l-emerald-500 border-emerald-100'
                    }`}>
                      <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Table {order.table_number}</CardTitle>
                            <p className="text-xs text-muted-foreground font-semibold">
                              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Badge variant={isPaid ? 'secondary' : 'default'} className={
                            isPaid 
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-extrabold' 
                              : 'bg-emerald-600 text-white font-extrabold'
                          }>
                            {isPaid ? 'COMPLETED (PAID)' : 'PREPARED / WAITING'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{order.customer_name}</span>
                          <span>{order.payment_mode || 'Pending Payment'}</span>
                        </div>
                        <Separator />
                        
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Original Order</p>
                          {originalItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                              <span className="text-muted-foreground font-bold">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {extraItems.length > 0 && (
                          <div className="pt-2 border-t mt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-1">Extra Items</p>
                            <div className="space-y-1.5">
                              {extraItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs py-0.5">
                                  <span className={`font-semibold ${item.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>{item.name}</span>
                                  <span className="text-muted-foreground font-bold">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

// Item Timer component to compute relative elapsed time
function ItemTimer({ createdAt }: { createdAt: string }) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const calc = () => {
      const ms = Date.now() - new Date(createdAt).getTime();
      setMinutes(Math.floor(ms / 60000));
    };
    calc();
    const interval = setInterval(calc, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return <span className="text-[10px] font-medium opacity-80 font-mono">({minutes < 1 ? '0m ago' : `${minutes}m ago`})</span>;
}

// Kitchen Order Card - Readability optimized for fast-paced kitchens
interface KitchenOrderCardProps {
  order: Order;
  currentKitchenName: string;
  onAccept: () => void;
  onMarkPrepared: () => void;
  onToggleExtraItemComplete: (itemIdx: number) => Promise<void>;
}

function KitchenOrderCard({ 
  order, 
  currentKitchenName, 
  onAccept, 
  onMarkPrepared,
  onToggleExtraItemComplete
}: KitchenOrderCardProps) {
  const originalItems = ((order as any).base_items && (order as any).base_items.length > 0
    ? (order as any).base_items
    : order.ordered_items || []) as Array<{
      name: string;
      nameKn: string;
      quantity: number;
    }>;

  const isPending = order.order_status === 'Pending';
  const seats = (order as any).seats || [];
  const extraItems = (order as any).extra_items || [];
  const kitchenAccepted = (order as any).accepted_by_kitchen_name;
  const isAcceptedByMe = kitchenAccepted === currentKitchenName;

  // Split extra items into completed (upside) and pending (downside)
  const indexedExtras = useMemo(() => {
    return extraItems.map((item: any, idx: number) => ({ ...item, originalIdx: idx }));
  }, [extraItems]);

  const completedExtras = useMemo(() => {
    return indexedExtras.filter((item: any) => item.completed);
  }, [indexedExtras]);

  const pendingExtras = useMemo(() => {
    return indexedExtras.filter((item: any) => !item.completed);
  }, [indexedExtras]);

  // Calculate dynamic minutes elapsed since order creation
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
      setMinutesAgo(diff);
    };
    calculateTime();
    const interval = setInterval(calculateTime, 30000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const timeColor = minutesAgo <= 3 
    ? 'text-emerald-500 bg-emerald-500/10' 
    : minutesAgo <= 7 
      ? 'text-amber-500 bg-amber-500/10 animate-pulse' 
      : 'text-rose-500 bg-rose-500/10 font-bold border border-rose-500/20 animate-pulse';

  return (
    <Card className={`shadow-md border bg-background overflow-hidden hover:shadow-lg transition-all duration-300 ${
      isPending 
        ? 'border-l-4 border-l-amber-500 border-amber-100 dark:border-amber-950' 
        : 'border-l-4 border-l-blue-500 border-blue-100 dark:border-blue-950'
    }`}>
      <CardHeader className="pb-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-foreground">
              Table {order.table_number}
            </CardTitle>
            {seats.length > 0 && (
              <Badge variant="outline" className="text-xs bg-background mt-1 font-bold">
                Seats: {seats.join(', ')}
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={isPending ? 'secondary' : 'default'} className={
              isPending 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 font-extrabold tracking-wider text-[10px]' 
                : 'bg-blue-600 text-white font-extrabold tracking-wider text-[10px]'
            }>
              {isPending ? 'NEW' : 'ACTIVE'}
            </Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${timeColor}`}>
              <Clock className="h-3.5 w-3.5" />
              {minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Customer Details */}
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{order.customer_name}</span>
        </div>

        <Separator />

        {/* 1. Original Order List (Displayed first) */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Original Order</p>
          {originalItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">
                {item.name}
              </span>
              <Badge className="bg-primary text-primary-foreground font-black text-md px-3 py-1 shadow-sm">
                ×{item.quantity}
              </Badge>
            </div>
          ))}
        </div>

        {/* 2. Completed Extras (Moved to the upside above pending extras, turned green) */}
        {completedExtras.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Completed Extras
            </p>
            <div className="space-y-2">
              {completedExtras.map((item: any) => (
                <div 
                  key={item.originalIdx}
                  onClick={() => onToggleExtraItemComplete(item.originalIdx)}
                  className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-base line-through opacity-80">{item.name}</span>
                    {item.addedAt && <ItemTimer createdAt={item.addedAt} />}
                  </div>
                  <Badge className="bg-emerald-600 text-white font-extrabold text-xs">
                    ×{item.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Pending Extra Items (Displayed downside, clickable) */}
        {pendingExtras.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              Pending Extras (Click to complete)
            </p>
            <div className="space-y-2">
              {pendingExtras.map((item: any) => (
                <div 
                  key={item.originalIdx}
                  onClick={() => onToggleExtraItemComplete(item.originalIdx)}
                  className="flex justify-between items-center p-2.5 rounded-lg bg-rose-500/5 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 cursor-pointer hover:bg-rose-500/10 hover:scale-[1.01] transition-all"
                >
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base">{item.name}</span>
                    {item.addedAt && <ItemTimer createdAt={item.addedAt} />}
                  </div>
                  <Badge variant="destructive" className="font-extrabold text-xs px-2 py-0.5">
                    ×{item.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Server Accepted Alert */}
        {(order as any).accepted_by_server_name && (
          <div className="py-2 px-3 rounded-lg flex items-center gap-2 bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
            <Bell className="h-4 w-4" />
            <span className="text-xs font-semibold">
              Server {(order as any).accepted_by_server_name} accepted this order
            </span>
          </div>
        )}

        {/* Kitchen Accepted Alert */}
        {kitchenAccepted && (
          <div className="py-2 px-3 rounded-lg flex items-center gap-2 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">
              {isAcceptedByMe ? 'You accepted this order' : `Accepted by ${kitchenAccepted}`}
            </span>
          </div>
        )}

        {/* Action Button: Accept Order */}
        {!kitchenAccepted && (
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-all hover:scale-[1.01]" 
            onClick={onAccept}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Accept Order
          </Button>
        )}

        {/* Action Button: Mark as Prepared */}
        {kitchenAccepted && !(order as any).kitchen_prepared_at && (
          <Button 
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 text-white font-extrabold shadow-md transition-all hover:scale-[1.01]" 
            onClick={onMarkPrepared}
          >
            <ChefHat className="h-4 w-4 mr-1.5 animate-bounce" />
            Mark as Prepared
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
