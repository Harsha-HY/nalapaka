import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Trash2,
  LogOut,
  TrendingUp,
  Users,
  IndianRupee,
  Loader2,
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

export default function DiningHubDashboard() {
  const { signOut, isSuperAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [stats, setStats] = useState<Record<string, HotelStats>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    hotelName: '',
    slug: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
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

    // Pull stats per hotel from orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('hotel_id, total_amount, payment_confirmed, created_at')
      .eq('payment_confirmed', true)
      .gte('created_at', monthStart.toISOString());

    const grouped: Record<string, HotelStats> = {};
    (ordersData || []).forEach((o: any) => {
      const hid = o.hotel_id;
      if (!hid) return;
      if (!grouped[hid]) {
        grouped[hid] = { hotelId: hid, todayOrders: 0, todayRevenue: 0, monthlyOrders: 0, monthlyRevenue: 0 };
      }
      grouped[hid].monthlyOrders += 1;
      grouped[hid].monthlyRevenue += Number(o.total_amount) || 0;
      const created = new Date(o.created_at);
      created.setHours(0, 0, 0, 0);
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

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleCreateHotel = async () => {
    if (!form.hotelName.trim() || !form.adminEmail.trim() || !form.adminPassword) {
      toast.error('Fill all required fields');
      return;
    }
    if (form.adminPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
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
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create hotel');

      toast.success(`Hotel "${form.hotelName}" created`);
      setShowCreate(false);
      setForm({ hotelName: '', slug: '', adminEmail: '', adminPassword: '', confirmPassword: '' });
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
                <Card key={h.id} className="border-l-4 border-l-primary">
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
                    <p className="text-xs text-muted-foreground mt-2">
                      QR URL: /guest/{h.slug}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Hotel Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Hotel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
              <Label htmlFor="adminPassword">Manager Password *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateHotel} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Hotel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
