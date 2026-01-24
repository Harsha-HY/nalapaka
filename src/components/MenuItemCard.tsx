import { Plus, Minus } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { language, t } = useLanguage();

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const displayName = language === 'kn' ? item.nameKn : item.name;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{displayName}</h3>
            <p className="text-lg font-bold text-primary">₹{item.price}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {quantity === 0 ? (
              <Button
                onClick={() => addItem(item)}
                size="sm"
                className="min-w-[70px]"
              >
                {t('addToCart')}
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => addItem(item)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
