import React, { useState } from 'react';
import { 
  Coffee, 
  UtensilsCrossed, 
  Sparkles, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card3D } from './Card3D';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface DishItem {
  id: string;
  name: string;
  kannadaName: string;
  category: 'dosas' | 'tiffins' | 'specials' | 'beverages';
  price: number;
  description: string;
  kannadaDesc: string;
  badge?: string;
  spicy?: boolean;
  image: string;
}

const dishes: DishItem[] = [
  {
    id: '1',
    name: 'Benne Masala Dosa',
    kannadaName: 'ಬೆಣ್ಣೆ ಮಸಾಲ ದೋಸೆ',
    category: 'dosas',
    price: 110,
    description: 'Golden crisp fermented crepe layered with rich white butter and potato masala.',
    kannadaDesc: 'ಗರಿಗರಿಯಾದ ದೋಸೆ, ತಾಜಾ ಬೆಣ್ಣೆ ಮತ್ತು ಆಲೂಗಡ್ಡೆ ಮಸಾಲೆಯೊಂದಿಗೆ.',
    badge: "Chef's Signature",
    spicy: true,
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    name: 'Mysore Mallige Idli (2 Pcs)',
    kannadaName: 'ಮಲ್ಲಿಗೆ ಇಡ್ಲಿ (೨ ಪೀಸ್)',
    category: 'tiffins',
    price: 70,
    description: 'Cloud-soft steamed rice cakes served with fresh coconut chutney and piping hot sambar.',
    kannadaDesc: 'ಹತ್ತಿಯಂತಹ ಮೃದುವಾದ ಇಡ್ಲಿ, ತೆಂಗಿನಕಾಯಿ ಚಟ್ನಿ ಮತ್ತು ಬಿಸಿ ಸಾಂಬಾರ್.',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    name: 'Maddur Vada (2 Pcs)',
    kannadaName: 'ಮದ್ದೂರು ವಡೆ (೨ ಪೀಸ್)',
    category: 'tiffins',
    price: 65,
    description: 'Crispy heritage fritter of semolina, onions, curry leaves, and green chilies.',
    kannadaDesc: 'ಈರುಳ್ಳಿ, ರವೆ ಮತ್ತು ಮಸಾಲೆಗಳಿಂದ ಕೂಡಿದ ಸಾಂಪ್ರದಾಯಿಕ ಗರಿಗರಿ ವಡೆ.',
    spicy: true,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    name: 'Royal Nalapaka Thali',
    kannadaName: 'ರಾಜ ಭೋಜನ ತಾಲಿ',
    category: 'specials',
    price: 240,
    description: 'Comprehensive feast with Bisi Bele Bath, Kosambari, Palya, Poori, Chitranna, and Payasa.',
    kannadaDesc: 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್, ಪಲ್ಯ, ಕೋಸಂಬರಿ, ಪೂರಿ ಮತ್ತು ಪಾಯಸದೊಂದಿಗೆ ಭರ್ಜರಿ ಊಟ.',
    badge: 'Heritage Feast',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    name: 'Open Butter Masala Dosa',
    kannadaName: 'ಓಪನ್ ಬೆಣ್ಣೆ ಮಸಾಲ ದೋಸೆ',
    category: 'dosas',
    price: 125,
    description: 'Thick spongy dosa smeared with gunpowder chutney powder and topped with melting butter.',
    kannadaDesc: 'ಚಟ್ನಿ ಪುಡಿ ಮತ್ತು ಬೆಣ್ಣೆಯೊಂದಿಗೆ ಸಿದ್ಧಪಡಿಸಿದ ದಪ್ಪ ಸ್ಪಂಜ್ ದೋಸೆ.',
    badge: 'Must Try',
    spicy: true,
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '6',
    name: 'Kumbakonam Degree Filter Coffee',
    kannadaName: 'ಕುಂಭಕೋಣಂ ಫಿಲ್ಟರ್ ಕಾಫಿ',
    category: 'beverages',
    price: 35,
    description: 'Aromatic chicory blend frothed to creamy perfection in traditional brass dabara.',
    kannadaDesc: 'ಸಾಂಪ್ರದಾಯಿಕ ಹಿತ್ತಾಳೆ ಲೋಟದಲ್ಲಿ ನೊರೆ ಬರುವ ಅಸಲಿ ಫಿಲ್ಟರ್ ಕಾಫಿ.',
    badge: 'Iconic Brew',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },
];

export const MenuSamplerSection: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'dosas' | 'tiffins' | 'specials' | 'beverages'>('all');
  const [sampleCart, setSampleCart] = useState<{ [id: string]: number }>({});

  const filteredDishes =
    activeCategory === 'all'
      ? dishes
      : dishes.filter((d) => d.category === activeCategory);

  const addItem = (id: string) => {
    setSampleCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeItem = (id: string) => {
    setSampleCart((prev) => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id] -= 1;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const totalItemsCount = Object.values(sampleCart).reduce((a, b) => a + b, 0);
  const totalCartValue = Object.entries(sampleCart).reduce((acc, [id, qty]) => {
    const dish = dishes.find((d) => d.id === id);
    return acc + (dish ? dish.price * qty : 0);
  }, 0);

  return (
    <section id="menu-sampler" className="py-24 bg-[#F7F2EA] border-t border-[#E8DDD1] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EADCCF] text-[#694F3B] text-xs font-semibold tracking-wide uppercase">
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#B85D36]" />
            <span>Digital Culinary Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2A211B] font-serif">
            {language === 'kn' ? 'ಸಾಂಪ್ರದಾಯಿಕ ಸ್ವಾದ, ಸುಲಭ ಆರ್ಡರ್' : 'Taste the Tradition. Experience the Simplicity.'}
          </h2>
          <p className="text-sm sm:text-base text-[#65594D] leading-relaxed">
            {language === 'kn'
              ? 'ಸ್ಪಷ್ಟ ಚಿತ್ರಗಳು, ಪದಾರ್ಥಗಳ ವಿವರ ಮತ್ತು ನೇರ ಬೆಲೆ. ಕೆಳಗಿನ ಖಾದ್ಯಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ ಮತ್ತು ಸ್ಯಾಂಪಲ್ ಪ್ಲೇಟ್‌ಗೆ ಸೇರಿಸಿ.'
              : 'Crisp photography, allergen transparency, and instant table ordering. Add any dish to test the live table checkout experience.'}
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {[
            { id: 'all', label: language === 'kn' ? 'ಎಲ್ಲವೂ' : 'All Dishes' },
            { id: 'dosas', label: language === 'kn' ? 'ದೋಸೆಗಳು' : 'Crisp Dosas' },
            { id: 'tiffins', label: language === 'kn' ? 'ತಿಂಡಿಗಳು' : 'Heritage Tiffins' },
            { id: 'specials', label: language === 'kn' ? 'ವಿಶೇಷ ಊಟ' : "Chef's Specials" },
            { id: 'beverages', label: language === 'kn' ? 'ಪಾನೀಯಗಳು' : 'Filter Coffee & Drinks' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#B85D36] text-white shadow-sm'
                  : 'bg-[#EDE4D8] hover:bg-[#E3D7C8] text-[#554638]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dish Grid with 3D Card Tilt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredDishes.map((dish) => {
            const count = sampleCart[dish.id] || 0;
            return (
              <Card3D key={dish.id} intensity={10} depth={18}>
                <div className="rounded-3xl bg-white border border-[#E4D7CA] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                  {/* Dish Image with Badge */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#EAE0D3]">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    {/* Badge */}
                    {dish.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF8F5]/90 backdrop-blur-md text-[#553E2D] border border-white/50 shadow-2xs">
                        {dish.badge}
                      </span>
                    )}

                    {/* Vegetarian Indicator */}
                    <div className="absolute top-3 right-3 w-5 h-5 rounded bg-white/90 backdrop-blur-md p-1 border border-emerald-600 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    </div>

                    {/* Price Tag in Image */}
                    <div className="absolute bottom-3 left-3 text-white font-bold text-lg drop-shadow-sm font-serif">
                      ₹{dish.price}
                    </div>
                  </div>

                  {/* Dish Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base text-[#2A211B]">
                          {language === 'kn' ? dish.kannadaName : dish.name}
                        </h3>
                        {dish.spicy && (
                          <span className="flex items-center text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Flame className="w-3 h-3 text-[#B85D36] mr-0.5" />
                            Spiced
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6F6458] leading-relaxed line-clamp-2">
                        {language === 'kn' ? dish.kannadaDesc : dish.description}
                      </p>
                    </div>

                    {/* Interactive Add to Plate Stepper */}
                    <div className="pt-3 border-t border-[#F1E7DC] flex items-center justify-between">
                      <span className="text-xs text-[#7B6E61] font-medium">Table Plate:</span>

                      {count > 0 ? (
                        <div className="flex items-center gap-2.5 bg-[#F7EFE6] px-3 py-1 rounded-full border border-[#DFD1C1]">
                          <button
                            onClick={() => removeItem(dish.id)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-[#554639] hover:bg-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-[#2A211B]">{count}</span>
                          <button
                            onClick={() => addItem(dish.id)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-[#554639] hover:bg-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addItem(dish.id)}
                          className="bg-[#F6EFE6] hover:bg-[#B85D36] text-[#554639] hover:text-white border border-[#DFD0BF] h-8 px-3 text-xs font-semibold rounded-xl gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Plate</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>

        {/* Floating Sample Table Cart Bar */}
        {totalItemsCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in slide-in-from-bottom-5 duration-300">
            <div className="glass-stone-warm p-4 rounded-2xl flex items-center justify-between shadow-xl border border-[#D5C2B0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B85D36] text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2B221B]">
                    Sample Table Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
                  </div>
                  <div className="text-sm font-bold text-[#B85D36]">₹{totalCartValue}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSampleCart({})}
                  className="text-xs text-[#7A6C5F] hover:text-[#282119] h-9"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/guest')}
                  className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-xs gap-1.5"
                >
                  <span>Launch Live Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
