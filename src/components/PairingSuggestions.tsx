import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useLanguage } from '@/contexts/LanguageContext';
import { computePairings } from '@/lib/pairings';
import { toast } from 'sonner';

interface CartLike { id: string; name: string }

interface Props {
  /** Items currently in cart OR already ordered (used to derive pairings) */
  contextItems: CartLike[];
  /** Title shown above the suggestions */
  title?: string;
  /** Called when user taps "Add" — receives the menu item */
  onAdd: (item: { id: string; name: string; nameKn: string; price: number; category: any; timeSlot: any }) => void;
  /** Hide entirely if no pairings */
  hideEmpty?: boolean;
}

/**
 * Smart pairing strip — surfaces classic combos like "Roti + Paneer".
 * Reusable on Cart page, OrderStatus (Add more items), etc.
 */
export function PairingSuggestions({ contextItems, title, onAdd, hideEmpty = true }: Props) {
  const { menuItems } = useMenuItems();
  const { language } = useLanguage();

  const recos = computePairings(contextItems, menuItems, 6);
  if (recos.length === 0 && hideEmpty) return null;

  const heading = title || (language === 'kn' ? 'ಒಟ್ಟಿಗೆ ಪ್ರಯತ್ನಿಸಿ' : 'Goes well with your order');

  return (
    <section className="my-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">{heading}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x">
        {recos.map(({ item, reason, combo }) => (
          <div key={item.id} className="snap-start min-w-[170px] bg-card border rounded-2xl p-3 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-primary mb-1">{combo ? '🍽️ Combo' : reason}</p>
            <p className="font-semibold text-sm truncate">
              {language === 'kn' ? item.nameKn : item.name}
            </p>
            {combo && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{combo}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-primary">₹{item.price}</span>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onAdd({
                    id: item.id, name: item.name, nameKn: item.nameKn, price: item.price,
                    category: item.category, timeSlot: item.timeSlot,
                  });
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
