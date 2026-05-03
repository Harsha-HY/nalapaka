import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PairingSuggestions } from '@/components/PairingSuggestions';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalAmount, clearCart, addItem } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="container py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('cart')}</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-4">{t('emptyCart')}</p>
            <Button onClick={() => navigate('/menu')}>{t('menu')}</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('cart')}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </header>

      {/* Cart items */}
      <main className="flex-1 container py-6">
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {language === 'kn' ? item.nameKn : item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-primary">₹{item.price * item.quantity}</p>
                    <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <PairingSuggestions
          contextItems={items.map((i) => ({ id: i.id, name: i.name }))}
          onAdd={(it) => addItem(it as any)}
        />
      </main>

      {/* Footer with total and proceed button */}
      <footer className="sticky bottom-0 bg-background border-t p-4">
        <div className="container">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg">{t('total')}</span>
            <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
          </div>
          <Button
            className="w-full h-14 text-lg"
            onClick={() => navigate('/checkout')}
          >
            {t('proceedOrder')}
          </Button>
        </div>
      </footer>
    </div>
  );
}
