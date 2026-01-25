import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, LayoutDashboard } from 'lucide-react';
import { useMenuItems, MenuItem } from '@/hooks/useMenuItems';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTableNumber } from '@/hooks/useTableNumber';
import { useOrders } from '@/hooks/useOrders';
import { useCart } from '@/contexts/CartContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { FloatingCart } from '@/components/FloatingCart';
import { OrderStatusBanner } from '@/components/OrderStatusBanner';
import { TableNumberModal } from '@/components/TableNumberModal';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

type TimeSlot = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
type Category = 'all' | 'south-indian' | 'north-indian' | 'chinese' | 'tandoor';

const getCategoryLabel = (category: string, language: 'en' | 'kn'): string => {
  const labels: Record<string, { en: string; kn: string }> = {
    'south-indian': { en: 'South Indian', kn: 'ದಕ್ಷಿಣ ಭಾರತೀಯ' },
    'north-indian': { en: 'North Indian', kn: 'ಉತ್ತರ ಭಾರತೀಯ' },
    'chinese': { en: 'Chinese', kn: 'ಚೈನೀಸ್' },
    'tandoor': { en: 'Tandoor', kn: 'ತಂದೂರ್' },
  };
  return labels[category]?.[language] || category;
};

export default function MenuPage() {
  const { t, language } = useLanguage();
  const { signOut, isManager } = useAuth();
  const { isTableSet, saveTableNumber } = useTableNumber();
  const { menuItems, isLoading: isMenuLoading } = useMenuItems();
  const { currentOrder } = useOrders();
  const { items: cartItems } = useCart();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Search filter
      const searchMatch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameKn.includes(searchQuery);

      // Time slot filter
      const timeSlotMatch =
        selectedTimeSlot === 'all' ||
        item.timeSlot === 'all' ||
        item.timeSlot === selectedTimeSlot;

      // Category filter
      const categoryMatch =
        selectedCategory === 'all' || item.category === selectedCategory;

      return searchMatch && timeSlotMatch && categoryMatch;
    });
  }, [menuItems, searchQuery, selectedTimeSlot, selectedCategory]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Check if customer has an active order
  const hasActiveOrder = currentOrder && 
    (currentOrder.order_status === 'Pending' || currentOrder.order_status === 'Confirmed') &&
    !(currentOrder as any).payment_confirmed;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Order status banner */}
      <OrderStatusBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">Nalapaka</h1>
              <p className="text-sm text-muted-foreground">Nanjangud</p>
            </div>
            <div className="flex items-center gap-2">
              {isManager && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/manager')}
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  {t('managerDashboard')}
                </Button>
              )}
              <LanguageToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('searchItems')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Time slot tabs */}
          <Tabs value={selectedTimeSlot} onValueChange={(v) => setSelectedTimeSlot(v as TimeSlot)}>
            <TabsList className="w-full h-auto flex-wrap">
              <TabsTrigger value="all" className="flex-1">{t('all')}</TabsTrigger>
              <TabsTrigger value="morning" className="flex-1">{t('morning')}</TabsTrigger>
              <TabsTrigger value="afternoon" className="flex-1">{t('afternoon')}</TabsTrigger>
              <TabsTrigger value="evening" className="flex-1">{t('evening')}</TabsTrigger>
              <TabsTrigger value="night" className="flex-1">{t('night')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as Category)}
            className="mt-2"
          >
            <TabsList className="w-full h-auto flex-wrap">
              <TabsTrigger value="all" className="flex-1">{t('all')}</TabsTrigger>
              <TabsTrigger value="south-indian" className="flex-1">{t('southIndian')}</TabsTrigger>
              <TabsTrigger value="north-indian" className="flex-1">{t('northIndian')}</TabsTrigger>
              <TabsTrigger value="chinese" className="flex-1">{t('chinese')}</TabsTrigger>
              <TabsTrigger value="tandoor" className="flex-1">{t('tandoor')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Menu items */}
      <main className="flex-1 container py-6 pb-24">
        {isMenuLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'kn' ? 'ಯಾವುದೇ ಐಟಂಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No items found'}
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                {getCategoryLabel(category, language)}
              </h2>
              <div className="grid gap-3">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating cart button */}
      <FloatingCart hasActiveOrder={hasActiveOrder} />

      {/* Table number modal */}
      <TableNumberModal open={!isTableSet} onSave={saveTableNumber} />
    </div>
  );
}
