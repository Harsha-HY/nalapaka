import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { HotelQRCode } from '@/components/HotelQRCode';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Building2,
  Plus,
  Trash2,
  LogOut,
  TrendingUp,
  Users,
  IndianRupee,
  Loader2,
  QrCode,
  BarChart3,
} from 'lucide-react';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

interface HotelStats {
  hotelId: string;
  todayOrders: number;
  todayRevenue: number;
  monthlyOrders: number;
  monthlyRevenue: number;
}

const validatePasswordStrength = (password: string): string | null => {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z)';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z)';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9)';
  }
  return null;
};

export default function DiningHubDashboard() {
  const { signOut, isSuperAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [stats, setStats] = useState<Record<string, HotelStats>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrHotel, setQrHotel] = useState<Hotel | null>(null);
  const [activeTab, setActiveTab] = useState<'hotels' | 'analytics'>('hotels');
  const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({
    hotelName: '',
    slug: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    address: '',
    phone: '',
    tagline: '',
  });

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isSuperAdmin, navigate]);

  const loadHotels = async () => {
    setLoading(true);
    const { data: hotelsData, error } = await supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setHotels((hotelsData as Hotel[]) || []);

    // Pull stats per hotel from orders (past 30 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('hotel_id, total_amount, payment_confirmed, created_at')
      .eq('payment_confirmed', true)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (ordersData) {
      setOrders(ordersData);
    }

    const grouped: Record<string, HotelStats> = {};
    (ordersData || []).forEach((o: any) => {
      const hid = o.hotel_id;
      if (!hid) return;
      if (!grouped[hid]) {
        grouped[hid] = { hotelId: hid, todayOrders: 0, todayRevenue: 0, monthlyOrders: 0, monthlyRevenue: 0 };
      }
      
      const created = new Date(o.created_at);
      created.setHours(0, 0, 0, 0);

      // Only count for monthly stats if it's within the current month
      if (created >= monthStart) {
        grouped[hid].monthlyOrders += 1;
        grouped[hid].monthlyRevenue += Number(o.total_amount) || 0;
      }

      if (created.getTime() === today.getTime()) {
        grouped[hid].todayOrders += 1;
        grouped[hid].todayRevenue += Number(o.total_amount) || 0;
      }
    });
    setStats(grouped);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) loadHotels();
  }, [isSuperAdmin]);

  const platformTotals = useMemo(() => {
    let monthlyRevenue = 0;
    let monthlyOrders = 0;
    let todayRevenue = 0;
    let todayOrders = 0;
    Object.values(stats).forEach((s) => {
      monthlyRevenue += s.monthlyRevenue;
      monthlyOrders += s.monthlyOrders;
      todayRevenue += s.todayRevenue;
      todayOrders += s.todayOrders;
    });
    return { monthlyRevenue, monthlyOrders, todayRevenue, todayOrders };
  }, [stats]);

  // 7-day Platform Revenue and Orders Trend
  const dailyStats = useMemo(() => {
    const statsList: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= date && orderDate < nextDate;
      });
      
      statsList.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        orders: dayOrders.length,
      });
    }
    return statsList;
  }, [orders]);

  // Hotel comparison data for charts
  const hotelComparisonData = useMemo(() => {
    return hotels.map(h => {
      const hotelOrders = orders.filter(o => o.hotel_id === h.id);
      return {
        name: h.name,
        revenue: hotelOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        orders: hotelOrders.length,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [hotels, orders]);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleCreateHotel = async () => {
    if (!form.hotelName.trim() || !form.adminEmail.trim() || !form.adminPassword) {
      toast.error('Fill all required fields');
      return;
    }
    const passwordError = validatePasswordStrength(form.adminPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (form.adminPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const slug = form.slug.trim() ? slugify(form.slug) : slugify(form.hotelName);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-hotel`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelName: form.hotelName.trim(),
            hotelSlug: slug,
            managerEmail: form.adminEmail.trim(),
            managerPassword: form.adminPassword,
            managerName: form.hotelName.trim() + ' Manager',
            address: form.address.trim() || null,
            phone: form.phone.trim() || null,
            tagline: form.tagline.trim() || null,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create hotel');

      toast.success(`Hotel "${form.hotelName}" created`);
      setShowCreate(false);
      setForm({ hotelName: '', slug: '', adminEmail: '', adminPassword: '', confirmPassword: '', address: '', phone: '', tagline: '' });
      await loadHotels();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create hotel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHotel = async (hotel: Hotel) => {
    if (!confirm(`Delete "${hotel.name}" and ALL its data? This cannot be undone.`)) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-hotel`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotelId: hotel.id }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');
      toast.success('Hotel deleted');
      await loadHotels();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete hotel');
    }
  };

  const handleToggleActive = async (hotel: Hotel) => {
    const { error } = await supabase
      .from('hotels')
      .update({ is_active: !hotel.is_active })
      .eq('id', hotel.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Hotel ${hotel.is_active ? 'deactivated' : 'activated'}`);
      loadHotels();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Dining Hub</h1>
              <p className="text-xs text-muted-foreground">Super Admin Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Platform Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Building2 className="h-5 w-5" />} label="Total Hotels" value={hotels.length.toString()} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Today Orders" value={platformTotals.todayOrders.toString()} />
          <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Today Revenue" value={`₹${platformTotals.todayRevenue}`} highlight />
          <StatCard icon={<IndianRupee className="h-5 w-5" />} label="This Month" value={`₹${platformTotals.monthlyRevenue}`} highlight />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b pb-3">
          <Button
            variant={activeTab === 'hotels' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('hotels')}
            className="font-semibold"
          >
            <Building2 className="h-4 w-4 mr-1.5" />
            Manage Hotels
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
            className="font-semibold"
          >
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Platform Analytics
          </Button>
        </div>

        {activeTab === 'hotels' ? (
          <>
            {/* Hotels list */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Hotels</h2>
              <Button onClick={() => setShowCreate(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Hotel
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : hotels.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hotels yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create your first hotel to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {hotels.map((h) => {
                  const s = stats[h.id];
                  return (
                    <Card key={h.id} className="border-l-4 border-l-primary shadow-soft border-0">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {h.name}
                              <Badge variant={h.is_active ? 'default' : 'secondary'} className="text-xs">
                                {h.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">slug: {h.slug}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => setQrHotel(h)}>
                              <QrCode className="h-4 w-4 mr-1" />
                              QR
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleActive(h)}>
                              {h.is_active ? 'Disable' : 'Enable'}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteHotel(h)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-secondary/50 rounded p-2">
                            <p className="text-xs text-muted-foreground">Today</p>
                            <p className="font-semibold">{s?.todayOrders || 0} orders</p>
                            <p className="text-success font-medium">₹{s?.todayRevenue || 0}</p>
                          </div>
                          <div className="bg-secondary/50 rounded p-2">
                            <p className="text-xs text-muted-foreground">This Month</p>
                            <p className="font-semibold">{s?.monthlyOrders || 0} orders</p>
                            <p className="text-success font-medium">₹{s?.monthlyRevenue || 0}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                          QR URL: /guest/{h.slug}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* Platform Analytics Panel */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Platform Revenue (7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Orders Trend Chart */}
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Platform Orders (7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats}>
                      <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="orders" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Hotel Performance Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Hotel Revenue Share Chart */}
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Hotel Revenue Share (Past 30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full">
                  {hotelComparisonData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No sales data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hotelComparisonData} layout="vertical">
                        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                        <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} width={100} />
                        <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Performing List */}
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Hotel Ranking (Past 30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hotelComparisonData.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No ranking data available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {hotelComparisonData.map((hotel, index) => (
                        <div key={hotel.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-muted-foreground font-medium">#{index + 1}</span>
                            <p className="font-semibold text-sm text-foreground">{hotel.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-success">₹{hotel.revenue}</p>
                            <p className="text-xs text-muted-foreground">{hotel.orders} orders</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Create Hotel Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Create New Hotel</DialogTitle>
            <DialogDescription>
              Set up a new hotel with its manager account and branding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-6 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="hotelName">Hotel Name *</Label>
              <Input
                id="hotelName"
                value={form.hotelName}
                onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                placeholder="e.g. Nalapaka Nanjangud"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug (optional)</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={slugify(form.hotelName) || 'auto-generated'}
              />
              <p className="text-xs text-muted-foreground">QR will be /guest/{form.slug ? slugify(form.slug) : slugify(form.hotelName) || 'slug'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Manager Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                placeholder="manager@hotel.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Manager Password (min 12 chars, A-Z, a-z, 0-9) *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                placeholder="••••••••••••"
                minLength={12}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••••••"
                minLength={12}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. Authentic South Indian since 1985"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-background">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateHotel} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Hotel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {qrHotel && (
        <HotelQRCode
          hotelName={qrHotel.name}
          hotelSlug={qrHotel.slug}
          open={!!qrHotel}
          onOpenChange={(o) => !o && setQrHotel(null)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className={`text-2xl font-bold ${highlight ? 'text-success' : 'text-foreground'}`}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
