import { Sparkles, Wand2 } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function Recommendations() {
  const { recos, loading, askAI } = useRecommendations();
  const { language } = useLanguage();
  const { addItem } = useCart();

  if (recos.length === 0) return null;

  return (
    <section className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {language === 'kn' ? 'ನಿಮಗಾಗಿ ಶಿಫಾರಸುಗಳು' : 'Recommended for you'}
        </h2>
        <Button variant="ghost" size="sm" onClick={askAI} disabled={loading} className="text-xs">
          <Wand2 className="h-3 w-3 mr-1" /> {loading ? '...' : 'Suggest for me'}
        </Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x">
        {recos.map(({ item, reason }) => (
          <div key={item.id} className="snap-start min-w-[160px] bg-card border rounded-2xl p-3 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-primary mb-1">{reason}</p>
            <p className="font-semibold text-sm truncate">{language === 'kn' ? item.nameKn : item.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-primary">₹{item.price}</span>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => { addItem(item as any); toast.success(`${item.name} added`); }}
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
