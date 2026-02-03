import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Order } from '@/hooks/useOrders';

interface FoodSalesSummaryProps {
  orders: Order[];
}

interface ItemSales {
  name: string;
  nameKn: string;
  quantity: number;
  pricePerUnit: number;
  totalRevenue: number;
}

export function FoodSalesSummary({ orders }: FoodSalesSummaryProps) {
  // Calculate item-wise totals for today
  const salesData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter today's completed orders
    const todaysOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && order.payment_confirmed;
    });

    // Aggregate item sales
    const itemMap: Record<string, ItemSales> = {};

    todaysOrders.forEach(order => {
      // Use ordered_items which contains the final merged list of all items
      // This is the source of truth and already includes base + extras merged
      const allItems = (order.ordered_items as Array<{
        name: string;
        nameKn?: string;
        quantity: number;
        price: number;
      }>) || [];

      allItems.forEach(item => {
        const key = item.name;
        if (!itemMap[key]) {
          itemMap[key] = {
            name: item.name,
            nameKn: item.nameKn || item.name,
            quantity: 0,
            pricePerUnit: item.price,
            totalRevenue: 0,
          };
        }
        itemMap[key].quantity += item.quantity;
        itemMap[key].totalRevenue += item.price * item.quantity;
      });
    });

    // Convert to array and sort by revenue
    return Object.values(itemMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [orders]);

  // Calculate totals
  const totalQuantity = salesData.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = salesData.reduce((sum, item) => sum + item.totalRevenue, 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Today's Food Sales Summary
            </CardTitle>
            <Badge variant="outline">{salesData.length} items sold</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm mb-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Total Items: <strong>{totalQuantity}</strong></span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              <span>Total Revenue: ₹{totalRevenue}</span>
            </div>
          </div>

          {salesData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sales data yet. Sales will appear here once orders are completed.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {/* Header */}
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground py-2 border-b">
                <span>Item</span>
                <span className="text-center">Qty Sold</span>
                <span className="text-center">Price/Unit</span>
                <span className="text-right">Revenue</span>
              </div>
              
              {/* Item Rows */}
              {salesData.map((item, idx) => (
                <div 
                  key={item.name} 
                  className={`grid grid-cols-4 gap-2 text-sm py-2 ${idx < salesData.length - 1 ? 'border-b border-dashed' : ''}`}
                >
                  <span className="font-medium truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {item.quantity}
                    </Badge>
                  </span>
                  <span className="text-center text-muted-foreground">
                    ₹{item.pricePerUnit}
                  </span>
                  <span className="text-right font-semibold text-green-600">
                    ₹{item.totalRevenue}
                  </span>
                </div>
              ))}

              {/* Total Footer */}
              <Separator className="my-2" />
              <div className="grid grid-cols-4 gap-2 text-sm py-2 font-bold">
                <span>TOTAL</span>
                <span className="text-center">{totalQuantity}</span>
                <span className="text-center">—</span>
                <span className="text-right text-green-600">₹{totalRevenue}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <p className="text-xs text-muted-foreground text-center">
        This summary resets automatically at midnight. All data is read-only and auto-calculated from completed orders.
      </p>
    </div>
  );
}
