import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, UtensilsCrossed } from 'lucide-react';
import { useMenuItems, MenuItem } from '@/hooks/useMenuItems';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useSessionResume } from '@/hooks/useSessionResume';
import { useHotelContext, ensureGuestHotelLoaded } from '@/hooks/useHotelContext';
import { ensureAnonSession } from '@/hooks/useAnonAuth';
import { LanguageToggle } from '@/components/LanguageToggle';
import { FloatingCart } from '@/components/FloatingCart';
import { OrderStatusBanner } from '@/components/OrderStatusBanner';
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
  const { isManager } = useAuth();
  const { hotelName, hotelId } = useHotelContext();
  const { menuItems, isLoading: isMenuLoading } = useMenuItems();
  const { currentOrder } = useOrders();
  const navigate = useNavigate();

  // Use session resume hook
  useSessionResume();

  // If a guest somehow lands without a hotel (typed /menu directly), pick a default
  // and silently establish an anonymous Supabase session for RLS-protected writes.
  useEffect(() => {
    if (!isManager) {
      ensureAnonSession();
    }
    if (!hotelId) {
      ensureGuestHotelLoaded();
    }
  }, [hotelId, isManager]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const searchMatch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameKn.includes(searchQuery);

      const timeSlotMatch =
        selectedTimeSlot === 'all' ||
        item.timeSlot === 'all' ||
        item.timeSlot === selectedTimeSlot;

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

  // Check if customer has an active order
  const hasActiveOrder = currentOrder && 
    (currentOrder.order_status === 'Pending' || currentOrder.order_status === 'Confirmed') &&
    !(currentOrder as any).payment_confirmed;

  // Manager should go directly to dashboard
  useEffect(() => {
    if (isManager) {
      navigate('/manager');
    }
  }, [isManager, navigate]);

  if (isManager) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Order status banner */}
      <OrderStatusBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{hotelName || 'Dining Hub'}</h1>
                <p className="text-xs text-muted-foreground">
                  {language === 'kn' ? 'ಮೆನು' : 'Menu'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigate('/order-history')} className="text-muted-foreground hover:text-foreground">
                <History className="h-5 w-5" />
              </Button>
              <LanguageToggle />
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchItems')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Time slot tabs */}
          <Tabs value={selectedTimeSlot} onValueChange={(v) => setSelectedTimeSlot(v as TimeSlot)} className="mb-2">
            <TabsList className="w-full h-auto p-1 bg-secondary/50">
              <TabsTrigger value="all" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('all')}</TabsTrigger>
              <TabsTrigger value="morning" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('morning')}</TabsTrigger>
              <TabsTrigger value="afternoon" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('afternoon')}</TabsTrigger>
              <TabsTrigger value="evening" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('evening')}</TabsTrigger>
              <TabsTrigger value="night" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('night')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category tabs */}
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)}>
            <TabsList className="w-full h-auto p-1 bg-secondary/50">
              <TabsTrigger value="all" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('all')}</TabsTrigger>
              <TabsTrigger value="south-indian" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('southIndian')}</TabsTrigger>
              <TabsTrigger value="north-indian" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('northIndian')}</TabsTrigger>
              <TabsTrigger value="chinese" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('chinese')}</TabsTrigger>
              <TabsTrigger value="tandoor" className="flex-1 text-xs py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{t('tandoor')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Menu items */}
      <main className="flex-1 container py-4 pb-28 px-3">
        {isMenuLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
            ))}
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {language === 'kn' ? 'ಯಾವುದೇ ಐಟಂಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No items found'}
            </p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="mb-6 animate-fade-in">
              <h2 className="section-header mb-3 px-1">
                {getCategoryLabel(category, language)}
                <span className="text-sm font-normal text-muted-foreground">
                  ({items.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
