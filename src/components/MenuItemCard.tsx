import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  id: string;
  name: string;
  nameKn: string;
  price: number;
  category: string;
  timeSlot: string;
  isAvailable?: boolean;
}

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { language, t } = useLanguage();

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const isAvailable = item.isAvailable !== false;

  const displayName = language === 'kn' ? item.nameKn : item.name;

  // Convert item to MenuItem format expected by cart
  const cartMenuItem = {
    id: item.id,
    name: item.name,
    nameKn: item.nameKn,
    price: item.price,
    category: item.category as 'south-indian' | 'north-indian' | 'chinese' | 'tandoor',
    timeSlot: item.timeSlot as 'morning' | 'afternoon' | 'evening' | 'night' | 'all',
  };

  if (!isAvailable) {
    return (
      <Card className="overflow-hidden bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-muted-foreground line-through truncate">
                {displayName}
              </h3>
              <p className="text-muted-foreground">₹{item.price}</p>
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground shrink-0">
              {language === 'kn' ? 'ಲಭ್ಯವಿಲ್ಲ' : 'Unavailable'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden menu-item-hover bg-card border shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{displayName}</h3>
            <p className="text-lg font-bold text-primary">₹{item.price}</p>
          </div>
          
          <div className="flex items-center shrink-0">
            {quantity === 0 ? (
              <Button
                onClick={() => addItem(cartMenuItem)}
                size="sm"
                className="h-9 px-4 rounded-full shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('addToCart')}
              </Button>
            ) : (
              <div className="quantity-stepper">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-foreground">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                  onClick={() => addItem(cartMenuItem)}
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
