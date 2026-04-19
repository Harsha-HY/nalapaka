import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Printer, 
  XCircle, 
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
  LogOut,
  AlertCircle,
  Users,
  MessageSquare,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, Order } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useLockedSeats } from '@/hooks/useLockedSeats';
import { HotelQRCode } from '@/components/HotelQRCode';
import { AddMenuItemDialog } from '@/components/AddMenuItemDialog';
import { Trash2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ManagerHistorySection } from '@/components/ManagerHistorySection';
import { OrderExtraItemsBadge } from '@/components/OrderExtraItemsBadge';
import { FoodSalesSummary } from '@/components/FoodSalesSummary';
import { AccountHandlingSection } from '@/components/AccountHandlingSection';
import { ReviewsSection } from '@/components/ReviewsSection';
import { AnalyticsSection } from '@/components/AnalyticsSection';
// QRCodePayment removed from manager - manager only sees text for UPI
import { printKitchenSlip, printBill } from '@/components/KitchenSlipPrint';
import { getFoodThumbnail } from '@/data/foodImages';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type DashboardSection = 'orders' | 'menu' | 'history' | 'sales' | 'accounts' | 'reviews' | 'analytics';

export default function ManagerDashboard() {
  const { language } = useLanguage();
  const { isManager, signOut, hotel } = useAuth();
  const { 
    orders, 
    isLoading, 
    cancelOrder, 
    confirmPayment, 
    deleteOrder, 
    refreshOrders,
    getTodayStats,
    deleteDayHistory,
    archiveTodayOrders
  } = useOrders();
  const { menuItems, toggleAvailability, deleteMenuItem, refreshMenuItems } = useMenuItems();
  const { unlockSeatsByOrderId, resetAllSeats } = useLockedSeats();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<DashboardSection>('orders');
  const [showQR, setShowQR] = useState(false);

  // Redirect non-managers
  useEffect(() => {
    if (!isManager) {
      navigate('/menu');
    }
  }, [isManager, navigate]);

  // Get today's date for filtering
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Filter orders - Today's orders only for main view
  const todayOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }, [orders, today]);

  const pendingOrders = todayOrders.filter(o => 
    o.order_status === 'Pending' || 
    (o.order_status === 'Confirmed' && !o.payment_confirmed)
  );
  
  const completedOrders = todayOrders.filter(o => o.payment_confirmed);
  const { totalOrders, totalRevenue } = getTodayStats();

  if (!isManager) {
    return null;
  }

  // Manager no longer confirms orders — server accept is final authority

  const handleRejectOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      await unlockSeatsByOrderId(orderId);
      toast.success('Order rejected');
    } catch (error) {
      toast.error('Failed to reject order');
    }
  };

  const handlePaymentConfirm = async (orderId: string, paymentMode: 'Cash' | 'Online') => {
    try {
      await confirmPayment(orderId, paymentMode);
      toast.success(`Payment confirmed (${paymentMode})!`);
    } catch (error) {
      toast.error('Failed to confirm payment');
    }
  };

  const handleResetSeats = async (orderId: string) => {
    try {
      await unlockSeatsByOrderId(orderId);
      toast.success('Seats have been reset');
    } catch (error) {
      toast.error('Failed to reset seats');
    }
  };

  const handleResetAllTables = async () => {
    if (!confirm('Are you sure you want to reset ALL tables? This will unlock all seats.')) return;
    
    try {
      await resetAllSeats();
      toast.success('All tables have been reset');
    } catch (error) {
      toast.error('Failed to reset tables');
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

  const handleDeleteDayHistory = async (date: string) => {
    try {
      await deleteDayHistory(date);
      toast.success('Day history deleted');
    } catch (error) {
      toast.error('Failed to delete history');
    }
  };

  const handleMoveToHistory = async () => {
    try {
      await archiveTodayOrders();
      toast.success('Orders moved to history');
    } catch (error) {
      toast.error('Failed to move orders');
    }
  };

  const handlePrintKitchen = (order: Order) => {
    const baseItems = (order.ordered_items as any[] || []);
    const extraItems = ((order as any).extra_items || []).map((item: any) => ({
      ...item,
      nameKn: item.nameKn || item.name,
      price: item.price ?? 0,
    }));

    const items = [...baseItems, ...extraItems];
    if (items.length === 0) {
      toast.error('No items to print');
      return;
    }

    printKitchenSlip(order, items, false);
  };

  const handlePrintBill = (order: Order) => {
    if (!order.payment_confirmed) {
      toast.error('Payment must be confirmed before printing bill');
      return;
    }
    printBill(order);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{hotel?.name || 'Manager Dashboard'}</h1>
                <p className="text-xs text-muted-foreground">Manager Dashboard · Dining Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hotel?.slug && (
                <Button variant="outline" size="sm" onClick={() => setShowQR(true)} className="shadow-sm">
                  <QrCode className="h-4 w-4 mr-1" />
                  Menu QR
                </Button>
              )}
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
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Today's Orders</p>
                  <p className="text-3xl font-bold text-foreground">{totalOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-0 bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Today's Revenue</p>
                  <p className="text-3xl font-bold text-success">₹{totalRevenue}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            <Button 
              variant={activeSection === 'orders' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('orders')}
              className={activeSection === 'orders' ? 'shadow-sm' : ''}
            >
              <UtensilsCrossed className="h-4 w-4 mr-1" />
              Orders
              {pendingOrders.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </Button>
            <Button 
              variant={activeSection === 'menu' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('menu')}
              className={activeSection === 'menu' ? 'shadow-sm' : ''}
            >
              Menu Control
            </Button>
            <Button 
              variant={activeSection === 'history' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('history')}
              className={activeSection === 'history' ? 'shadow-sm' : ''}
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
            <Button 
              variant={activeSection === 'sales' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('sales')}
              className={activeSection === 'sales' ? 'shadow-sm' : ''}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Food Sales
            </Button>
            <Button 
              variant={activeSection === 'accounts' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('accounts')}
              className={activeSection === 'accounts' ? 'shadow-sm' : ''}
            >
              <Users className="h-4 w-4 mr-1" />
              Accounts
            </Button>
            <Button 
              variant={activeSection === 'reviews' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('reviews')}
              className={activeSection === 'reviews' ? 'shadow-sm' : ''}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Reviews
            </Button>
            <Button 
              variant={activeSection === 'analytics' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveSection('analytics')}
              className={activeSection === 'analytics' ? 'shadow-sm' : ''}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          </div>

          {/* Reset All Tables Button */}
          <div className="px-4 pb-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetAllTables}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset All Tables
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
                  Pending Orders ({pendingOrders.length})
                </h2>
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
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
                        onReject={() => handleRejectOrder(order.id)}
                        onPaymentCash={() => handlePaymentConfirm(order.id, 'Cash')}
                        onPaymentUPI={() => handlePaymentConfirm(order.id, 'Online')}
                        onResetSeats={() => handleResetSeats(order.id)}
                        onPrintKitchen={() => handlePrintKitchen(order)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Orders Section */}
              {completedOrders.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Completed Orders Today ({completedOrders.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {completedOrders.map((order) => (
                      <CompletedOrderCard
                        key={order.id}
                        order={order}
                        language={language}
                        onPrint={() => handlePrintBill(order)}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu Items ({menuItems.length})</h2>
                <AddMenuItemDialog onItemAdded={refreshMenuItems} />
              </div>
              {['south-indian', 'north-indian', 'chinese', 'tandoor'].map((category) => {
                const categoryItems = menuItems.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="capitalize">{category.replace('-', ' ')} ({categoryItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img 
                              src={getFoodThumbnail(item.id)} 
                              alt={item.name}
                              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <p className={`font-medium truncate ${!item.isAvailable ? 'text-muted-foreground line-through' : ''}`}>
                                {language === 'kn' ? item.nameKn : item.name}
                              </p>
                              <p className="text-sm text-muted-foreground">₹{item.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={async () => {
                                if (!confirm(`Delete "${item.name}"?`)) return;
                                const ok = await deleteMenuItem(item.id);
                                if (ok) toast.success('Item deleted');
                                else toast.error('Failed to delete');
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* History Section */}
          {activeSection === 'history' && (
            <div>
              <ManagerHistorySection 
                orders={orders} 
                onDeleteDayHistory={handleDeleteDayHistory}
                onMoveToHistory={handleMoveToHistory}
              />
            </div>
          )}

          {/* Food Sales Summary Section */}
          {activeSection === 'sales' && (
            <div>
              <FoodSalesSummary orders={orders} />
            </div>
          )}

          {/* Account Handling Section */}
          {activeSection === 'accounts' && (
            <div>
              <AccountHandlingSection />
            </div>
          )}

          {/* Reviews Section */}
          {activeSection === 'reviews' && (
            <div>
              <ReviewsSection />
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div>
              <AnalyticsSection orders={orders} />
            </div>
          )}
        </main>
      </div>

      {hotel?.slug && (
        <HotelQRCode
          hotelName={hotel.name}
          hotelSlug={hotel.slug}
          open={showQR}
          onOpenChange={setShowQR}
        />
      )}
    </div>
  );
}

// Pending Order Card Component
interface PendingOrderCardProps {
  order: Order;
  language: 'en' | 'kn';
  onReject: () => void;
  onPaymentCash: () => void;
  onPaymentUPI: () => void;
  onResetSeats: () => void;
  onPrintKitchen: () => void;
}

function PendingOrderCard({ 
  order, 
  language, 
  onReject,
  onPaymentCash,
  onPaymentUPI,
  onResetSeats,
  onPrintKitchen
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
  const seats = (order as any).seats || [];
  const waitTimeMinutes = order.wait_time_minutes;
  const confirmedAt = order.confirmed_at;
  const paymentIntent = (order as any).payment_intent;
  const eatingFinished = order.eating_finished;
  const extraItems = (order as any).extra_items || [];
  const acceptedByServerName = (order as any).accepted_by_server_name;

  const handleCall = () => {
    window.location.href = `tel:${order.phone_number}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello ${order.customer_name}, this is Nalapaka Nanjangud regarding your order.`);
    window.open(`https://wa.me/91${order.phone_number.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Card className={`shadow-soft border-0 ${isPending ? 'order-card-pending' : 'order-card-confirmed'}`}>
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
            className={isPending ? 'bg-warning/15 text-warning border-warning/30' : 'bg-primary/15 text-primary border-primary/30'}
          >
            {isPending ? 'PENDING' : 'CONFIRMED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Kitchen Print Button - TOP */}
        <Button variant="outline" size="sm" className="w-full" onClick={onPrintKitchen}>
          <Printer className="h-4 w-4 mr-1" />
          Print Kitchen Slip
        </Button>


        {/* Server Acceptance Status */}
        {acceptedByServerName && (
          <div className="py-2 px-3 rounded-md flex items-center gap-2 bg-success/20 text-success">
            <UserCheck className="h-4 w-4" />
            <span className="text-sm font-medium">
              Accepted by Server: {acceptedByServerName}
            </span>
          </div>
        )}

        {/* Kitchen Confirmation Status */}
        {(order as any).accepted_by_kitchen_name && (
          <div className="py-2 px-3 rounded-md flex items-center gap-2 bg-primary/20 text-primary">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Order confirmed by Kitchen – Table {order.table_number}
            </span>
          </div>
        )}

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

        {/* Payment Intent - Show when customer has selected payment method */}
        {eatingFinished && paymentIntent && (
          <div className={`py-2 px-3 rounded-md flex items-center gap-2 ${
            paymentIntent === 'Cash' ? 'bg-warning/20' : 'bg-primary/20'
          }`}>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Customer {order.customer_name} paying through {paymentIntent}
            </span>
          </div>
        )}

        {/* UPI Payment Text Notice (no QR for manager) */}
        {eatingFinished && paymentIntent === 'UPI' && (
          <div className="py-2 px-3 rounded-md flex items-center gap-2 bg-primary/10">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Customer at Table {order.table_number} is paying via UPI
            </span>
          </div>
        )}

        {/* Timer */}
        {isConfirmed && waitTimeMinutes && confirmedAt && (
          <div className="py-2 px-3 bg-primary/10 rounded-md flex items-center justify-between">
            <span className="text-sm font-medium">Wait Time:</span>
            <CountdownTimer confirmedAt={confirmedAt} waitTimeMinutes={waitTimeMinutes} compact />
          </div>
        )}

        <Separator />

        {/* Base Items */}
        <div className="space-y-1 max-h-32 overflow-auto">
          {orderedItems.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{language === 'kn' ? item.nameKn : item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Extra Items Badge with time */}
        <OrderExtraItemsBadge extraItems={extraItems} />

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-primary">₹{order.total_amount}</span>
        </div>

        {/* Payment Status */}
        <Badge variant="outline" className="w-full justify-center py-1">
          PAYMENT PENDING
        </Badge>

        {/* Action Buttons */}
        <div className="grid gap-2 pt-2">
          {/* Reject button - Manager emergency override (available for any non-paid order) */}
          {!order.payment_confirmed && (
            <Button variant="destructive" onClick={onReject} className="w-full">
              <XCircle className="h-4 w-4 mr-1" />
              Reject Order
            </Button>
          )}
          {/* Payment confirmation buttons for confirmed orders */}
          {isConfirmed && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onPaymentCash} className="w-full" variant="outline">
                <Banknote className="h-4 w-4 mr-1" />
                Cash Paid
              </Button>
              <Button onClick={onPaymentUPI} className="w-full" variant="outline">
                <Smartphone className="h-4 w-4 mr-1" />
                UPI Paid
              </Button>
            </div>
          )}
        </div>

        {/* Reset Seats Button */}
        {orderType === 'dine-in' && isConfirmed && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onResetSeats}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Seats
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Completed Order Card Component (Today only - no delete)
interface CompletedOrderCardProps {
  order: Order;
  language: 'en' | 'kn';
  onPrint: () => void;
}

function CompletedOrderCard({ order, language, onPrint }: CompletedOrderCardProps) {
  const orderedItems = order.ordered_items as Array<{
    name: string;
    nameKn: string;
    quantity: number;
    price: number;
  }>;

  const orderType = order.order_type || 'dine-in';
  const seats = (order as any).seats || [];

  return (
    <Card className="shadow-soft border-0 order-card-completed">
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
          <Badge className="bg-success text-success-foreground">
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

        <Button variant="outline" size="sm" className="w-full" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-1" />
          Print Bill
        </Button>
      </CardContent>
    </Card>
  );
}
