import { useState, useMemo } from 'react';
import { Order } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Calendar, 
  DollarSign, 
  Banknote, 
  Smartphone,
  ChevronDown,
  ChevronUp,
  Archive
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ManagerHistorySectionProps {
  orders: Order[];
  onDeleteDayHistory: (date: string) => void;
  onMoveToHistory: () => void;
}

interface DayGroup {
  date: string;
  dateLabel: string;
  orders: Order[];
  cashTotal: number;
  upiTotal: number;
  totalRevenue: number;
  isToday: boolean;
}

export function ManagerHistorySection({ orders, onDeleteDayHistory, onMoveToHistory }: ManagerHistorySectionProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Group orders by date
  const dayGroups = useMemo(() => {
    const groups: Record<string, DayGroup> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      const isToday = orderDate.getTime() === today.getTime();

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          dateLabel: isToday 
            ? 'Today' 
            : orderDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
          orders: [],
          cashTotal: 0,
          upiTotal: 0,
          totalRevenue: 0,
          isToday,
        };
      }

      groups[dateKey].orders.push(order);
      
      if (order.payment_confirmed) {
        if (order.payment_mode === 'Cash') {
          groups[dateKey].cashTotal += order.total_amount;
        } else {
          groups[dateKey].upiTotal += order.total_amount;
        }
        groups[dateKey].totalRevenue += order.total_amount;
      }
    });

    // Sort by date descending
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const todayHasCompletedOrders = dayGroups.some(g => g.isToday && g.orders.some(o => o.payment_confirmed));

  return (
    <div className="space-y-4">
      {/* Move to History Button */}
      {todayHasCompletedOrders && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onMoveToHistory}
        >
          <Archive className="h-4 w-4 mr-2" />
          Move Today's Orders to History
        </Button>
      )}

      {dayGroups.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No order history yet</p>
      ) : (
        dayGroups.map((group) => (
          <Card key={group.date} className={group.isToday ? 'border-primary' : ''}>
            <CardHeader 
              className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleDay(group.date)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {group.dateLabel}
                    {group.isToday && <Badge className="ml-2" variant="secondary">Current</Badge>}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{group.orders.length} orders</Badge>
                  {expandedDays.has(group.date) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              
              {/* Summary */}
              <div className="flex gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span>Cash: ₹{group.cashTotal}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span>UPI: ₹{group.upiTotal}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <DollarSign className="h-4 w-4" />
                  <span>Total: ₹{group.totalRevenue}</span>
                </div>
              </div>
            </CardHeader>

            {expandedDays.has(group.date) && (
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                
                {/* Order list */}
                <div className="space-y-3 max-h-96 overflow-auto">
                  {group.orders.map((order) => {
                    const orderedItems = order.ordered_items as Array<{
                      name: string;
                      quantity: number;
                      price: number;
                    }>;

                    return (
                      <div key={order.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.order_type === 'parcel' ? 'PARCEL' : `Table ${order.table_number}`} • 
                              {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge variant={order.payment_confirmed ? 'default' : 'secondary'}>
                            {order.payment_confirmed ? order.payment_mode : 'Pending'}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          {orderedItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-muted-foreground">
                              <span>{item.name} × {item.quantity}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                          <span>Total</span>
                          <span>₹{order.total_amount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delete Day Button - Only for past days */}
                {!group.isToday && (
                  <div className="mt-4 pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Day History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Day History?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all {group.orders.length} orders from {group.dateLabel}. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteDayHistory(group.date)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
