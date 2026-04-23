import { Sparkles } from 'lucide-react';
import { useDailySpecials } from '@/hooks/useDailySpecials';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function TodaysSpecialStrip() {
  const { specials } = useDailySpecials();
  const { menuItems } = useMenuItems();
  const { language } = useLanguage();
  const { addItem } = useCart();

  const specialMenuItems = menuItems.filter((m) => (m as any).is_special);

  const totalCount = specials.length + specialMenuItems.length;
  if (totalCount === 0) return null;

  const handleAddSpecial = (s: typeof specials[number]) => {
    addItem({
      id: `special-${s.id}`,
      name: s.name,
      nameKn: s.name_kn || s.name,
      price: Number(s.price),
      category: 'south-indian' as any,
      timeSlot: 'all' as any,
      isAvailable: true,
    } as any);
    toast.success(`${s.name} added`);
  };

  return (
    <section className="mb-4 animate-fade-in">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          {language === 'kn' ? 'ಇಂದಿನ ವಿಶೇಷ' : "Today's Special"}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x">
        {specials.map((s) => (
          <div
            key={s.id}
            className="snap-start min-w-[180px] bg-gradient-to-br from-primary/15 to-amber-500/10 border border-primary/30 rounded-2xl p-3 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase text-primary">Chef's Special</span>
            </div>
            <p className="font-semibold text-sm truncate">{language === 'kn' && s.name_kn ? s.name_kn : s.name}</p>
            {s.note && <p className="text-xs text-muted-foreground line-clamp-2">{s.note}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-primary">₹{s.price}</span>
              <Button size="sm" className="h-7 text-xs" onClick={() => handleAddSpecial(s)}>Add</Button>
            </div>
          </div>
        ))}
        {specialMenuItems.map((item) => (
          <div
            key={item.id}
            className="snap-start min-w-[180px] bg-gradient-to-br from-amber-500/10 to-primary/10 border border-amber-500/30 rounded-2xl p-3 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span className="text-[10px] font-bold uppercase text-amber-600">Today's Pick</span>
            </div>
            <p className="font-semibold text-sm truncate">{language === 'kn' ? item.nameKn : item.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-primary">₹{item.price}</span>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  addItem(item as any);
                  toast.success(`${item.name} added`);
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
