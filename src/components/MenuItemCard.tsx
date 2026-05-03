import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { getFoodImage } from '@/data/foodImages';

interface MenuItem {
  id: string;
  name: string;
  nameKn: string;
  price: number;
  category: string;
  timeSlot: string;
  isAvailable?: boolean;
  image_url?: string | null;
}

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { language, t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const isAvailable = item.isAvailable !== false;
  const displayName = language === 'kn' ? item.nameKn : item.name;
  const imageUrl = item.image_url || getFoodImage(item.id);

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
      <div className="rounded-2xl overflow-hidden bg-muted/40 border border-dashed border-border opacity-60">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {!imgError ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-cover grayscale"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-background/50" />
          <span className="absolute top-2 right-2 text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {language === 'kn' ? 'ಲಭ್ಯವಿಲ್ಲ' : 'Unavailable'}
          </span>
        </div>
        <div className="p-3">
          <p className="font-medium text-muted-foreground line-through text-sm truncate">{displayName}</p>
          <p className="text-muted-foreground text-sm mt-0.5">₹{item.price}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm menu-item-hover">
      {/* Large food image */}
      <div className="aspect-[4/3] relative overflow-hidden bg-secondary">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Item details */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
          {displayName}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary">₹{item.price}</span>

          {quantity === 0 ? (
            <Button
              onClick={() => addItem(cartMenuItem)}
              size="sm"
              className="h-8 px-4 rounded-full text-xs font-semibold shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t('addToCart')}
            </Button>
          ) : (
            <div className="quantity-stepper inline-flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={() => updateQuantity(item.id, quantity - 1)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center font-bold text-foreground text-sm">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => addItem(cartMenuItem)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
