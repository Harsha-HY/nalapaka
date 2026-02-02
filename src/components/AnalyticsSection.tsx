import { useMemo } from 'react';
import { TrendingUp, DollarSign, UtensilsCrossed, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Order } from '@/hooks/useOrders';
import { useReviews } from '@/hooks/useReviews';

interface AnalyticsSectionProps {
  orders: Order[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'];

export function AnalyticsSection({ orders }: AnalyticsSectionProps) {
  const { todayReviews, todayAverages } = useReviews();

  // Calculate daily stats for the last 7 days
  const dailyStats = useMemo(() => {
    const stats: { date: string; revenue: number; orders: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= date && orderDate < nextDate && o.payment_confirmed;
      });
      
      stats.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
        orders: dayOrders.length,
      });
    }
    
    return stats;
  }, [orders]);

  // Today's stats
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && o.payment_confirmed;
    });
    
    return {
      orders: todayOrders.length,
      revenue: todayOrders.reduce((sum, o) => sum + o.total_amount, 0),
      avgOrder: todayOrders.length > 0 
        ? Math.round(todayOrders.reduce((sum, o) => sum + o.total_amount, 0) / todayOrders.length)
        : 0,
    };
  }, [orders]);

  // Payment method distribution
  const paymentDistribution = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && o.payment_confirmed;
    });
    
    const cash = todayOrders.filter(o => o.payment_mode === 'Cash').length;
    const online = todayOrders.filter(o => o.payment_mode === 'Online').length;
    
    return [
      { name: 'Cash', value: cash },
      { name: 'Online', value: online },
    ].filter(d => d.value > 0);
  }, [orders]);

  // Top selling items today
  const topItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && o.payment_confirmed;
    });
    
    const itemCounts: Record<string, number> = {};
    
    todayOrders.forEach(order => {
      const items = order.ordered_items as any[];
      items?.forEach(item => {
        const name = item.name || 'Unknown';
        itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
      });
      
      const extraItems = (order as any).extra_items as any[] || [];
      extraItems.forEach(item => {
        const name = item.name || 'Unknown';
        itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
      });
    });
    
    return Object.entries(itemCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
    orders: { label: 'Orders', color: 'hsl(var(--success))' },
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Analytics
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold">{todayStats.orders}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-success">₹{todayStats.revenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₹{todayStats.avgOrder}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{todayAverages.overall > 0 ? todayAverages.overall.toFixed(1) : '-'}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Order Count Trend */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orders Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={{ fill: 'var(--color-orders)' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Payment Distribution */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentDistribution.length === 0 ? (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                No payments today
              </div>
            ) : (
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {paymentDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                No orders today
              </div>
            ) : (
              <div className="space-y-2">
                {topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <span className="text-sm truncate max-w-[150px]">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
