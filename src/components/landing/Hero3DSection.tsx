import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Sparkles, 
  UtensilsCrossed, 
  ArrowRight, 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  BellRing, 
  ShieldCheck, 
  Flame, 
  Coffee,
  Camera,
  Check,
  UserCheck,
  Smartphone,
  Tablet,
  Users,
  BarChart3,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card3D } from './Card3D';
import { HeroAtmosphericBackground } from './HeroAtmosphericBackground';
import { useLanguage } from '@/contexts/LanguageContext';

interface Hero3DSectionProps {
  onOpenScanner?: () => void;
  onOpenAuthModal?: () => void;
}

type PreviewPerspective = 'customer' | 'kitchen' | 'server' | 'manager';

// Dynamic rotating food datasets
const customerFoodCycles = [
  {
    table: 'Table 07',
    hotel: 'Nalapaka Grand',
    items: [
      { name: 'Davangere Benne Dosa', desc: 'Crisp golden crepe, butter dollop, potato mash', price: 110, badge: "Chef's Special" },
      { name: 'Kumbakonam Filter Coffee', desc: 'Frothed chicory-coffee decoction', price: 35, badge: 'Heritage Brew' },
      { name: 'Maddur Vada (2 Pcs)', desc: 'Crispy onion semolina fritter', price: 65, badge: 'Popular' },
    ],
    subtotal: 210,
    statusText: 'Kitchen preparing • Table active',
  },
  {
    table: 'Table 04',
    hotel: 'Nalapaka Heritage',
    items: [
      { name: 'Royal South Indian Thali', desc: 'Bisi Bele Bath, Kosambari, Poori, Payasa', price: 240, badge: 'Grand Feast' },
      { name: 'Fresh Mango Lassi', desc: 'Chilled Alphonso yogurt smoothie', price: 60, badge: 'Cooler' },
      { name: 'Pineapple Kesari Bath', desc: 'Ghee semolina pudding with saffron', price: 50, badge: 'Sweet' },
    ],
    subtotal: 350,
    statusText: 'Dishes served • Diners enjoying',
  },
  {
    table: 'Table 12',
    hotel: 'Nalapaka Central',
    items: [
      { name: 'Mysore Ghee Roast Dosa', desc: 'Spicy red garlic chutney, potato masala', price: 125, badge: 'Bestseller' },
      { name: 'Mallige Idli & Vada Combo', desc: 'Steamed rice cakes, medu vada, sambar', price: 85, badge: 'Morning Classic' },
      { name: 'Badam Milk (Hot)', desc: 'Crushed almonds, saffron, cardamom', price: 45, badge: 'Warm Brew' },
    ],
    subtotal: 255,
    statusText: 'Order dispatched • Server alerted',
  },
];

export const Hero3DSection: React.FC<Hero3DSectionProps> = ({
  onOpenScanner,
  onOpenAuthModal,
}) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  
  // Perspective tab and auto-cycle state
  const [perspective, setPerspective] = useState<PreviewPerspective>('customer');
  const [foodCycleIdx, setFoodCycleIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through perspectives and food items every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setPerspective((prev) => {
        if (prev === 'customer') return 'kitchen';
        if (prev === 'kitchen') return 'server';
        if (prev === 'server') return 'manager';
        return 'customer';
      });
      setFoodCycleIdx((prev) => (prev + 1) % customerFoodCycles.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const currentFood = customerFoodCycles[foodCycleIdx];

  const perspectiveTabs: { id: PreviewPerspective; label: string; icon: any }[] = [
    { id: 'customer', label: '1. Customer Phone', icon: Smartphone },
    { id: 'kitchen', label: '2. Kitchen KDS', icon: ChefHat },
    { id: 'server', label: '3. Waiter Hub', icon: Users },
    { id: 'manager', label: '4. Manager Intel', icon: BarChart3 },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F6F1EA] to-[#FAF8F5]">
      {/* 3D Atmospheric Video & Ambient Particle Background */}
      <HeroAtmosphericBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Value Proposition, Action CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
            {/* Organic Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE6DC]/90 backdrop-blur-md border border-[#DFCFC0] text-[#71543D] text-xs font-medium tracking-wide shadow-xs animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-[#B85D36] animate-pulse" />
              <span>{language === 'kn' ? 'ಆಧುನಿಕ ರೆಸ್ಟೋರೆಂಟ್ ವ್ಯವಸ್ಥೆ' : 'Artisanal Dining Intelligence'}</span>
              <span className="text-[#A38973]">•</span>
              <span className="text-[#5E4734] font-semibold">{language === 'kn' ? 'ಟೇಬಲ್ QR ಸ್ಕ್ಯಾನ್ ಮಾತ್ರ' : 'Table QR Scan to Dine'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#2B231D] font-serif leading-[1.12]">
              {language === 'kn' ? (
                <>
                  ರುಚಿಕರ ಅನುಭವ, <br />
                  <span className="text-[#B85D36] italic font-normal">ಸ್ಪಷ್ಟ ತಂತ್ರಜ್ಞಾನ.</span>
                </>
              ) : (
                <>
                  Effortless Table Dining. <br />
                  <span className="text-[#B85D36] italic font-normal">Pure Hospitality.</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#5F554C] leading-relaxed max-w-xl mx-auto lg:mx-0">
              {language === 'kn'
                ? 'ಗ್ರಾಹಕರು ತಮ್ಮ ಟೇಬಲ್ ಮೇಲಿರುವ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ತಕ್ಷಣ ಮೆನು ಲಭ್ಯ. ಅಡುಗೆಮನೆಗೆ ನೇರ ತಲುಪುವಿಕೆ, ವೇಗದ ಸೇವೆ, ಮತ್ತು ಮಾಲೀಕರಿಗೆ ಪೂರ್ಣ ನಿಯಂತ್ರಣ.'
                : 'Frictionless table-side QR ordering, bilingual Kannada & English menus, and live kitchen synchronization. Zero waiting for paper menus, zero lost orders, and ₹0 commission cuts.'}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {/* Camera Scanner Trigger */}
              <Button
                size="lg"
                onClick={onOpenScanner}
                className="w-full sm:w-auto h-12 px-7 text-sm font-semibold bg-[#B85D36] hover:bg-[#9F4D2A] text-white shadow-md hover:shadow-lg transition-all rounded-xl gap-2.5"
              >
                <Camera className="w-4 h-4" />
                <span>{language === 'kn' ? 'ಕ್ಯಾಮೆರಾದಿಂದ ಟೇಬಲ್ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Scan Table QR with Camera'}</span>
              </Button>

              {/* Staff Sign In Modal Trigger */}
              <Button
                size="lg"
                variant="outline"
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto h-12 px-6 text-sm font-medium border-[#D6C7BC] bg-[#FDFBF7]/90 backdrop-blur-md text-[#473D34] hover:bg-[#F2ECE3] hover:text-[#28211A] transition-all rounded-xl gap-2"
              >
                <ChefHat className="w-4 h-4 text-[#8C7A6B]" />
                <span>{language === 'kn' ? 'ಸಿಬ್ಬಂದಿ ಮತ್ತು ಮ್ಯಾನೇಜರ್ ಲಾಗಿನ್' : 'Staff & Manager Sign In'}</span>
              </Button>
            </div>

            {/* Reassurance Feature Highlights */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#E8DDD1] max-w-lg mx-auto lg:mx-0 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#2B231D] font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#B85D36]" />
                  <span>Camera Scan</span>
                </div>
                <p className="text-xs text-[#786E64]">{language === 'kn' ? 'ನೇರ ಲಿಂಕ್' : 'Instant Table Link'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#2B231D] font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#B85D36]" />
                  <span>Dine-In Only</span>
                </div>
                <p className="text-xs text-[#786E64]">{language === 'kn' ? 'ಟೇಬಲ್ ರಕ್ಷಣೆ' : 'Zero Fake Orders'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#2B231D] font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#B85D36]" />
                  <span>KN + EN</span>
                </div>
                <p className="text-xs text-[#786E64]">{language === 'kn' ? 'ದ್ವಿಭಾಷಾ ಬೆಂಬಲ' : 'Bilingual Native'}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Rotating Perspective Simulator with 3D Card Tilt */}
          <div 
            className="lg:col-span-6 relative flex flex-col items-center py-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Top Interactive Perspective Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-[#EFE6DC]/90 backdrop-blur-md border border-[#DFCFBF] mb-4 z-30 shadow-xs">
              {perspectiveTabs.map((tab) => {
                const Icon = tab.icon;
                const active = perspective === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPerspective(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#B85D36] text-white shadow-xs scale-102'
                        : 'text-[#615143] hover:text-[#2B231D] hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Perspective Device Screen */}
            <div className="relative w-full max-w-[360px] z-20">
              <Card3D intensity={12} depth={25}>
                
                {/* 1. CUSTOMER PERSPECTIVE */}
                {perspective === 'customer' && (
                  <div className="rounded-[32px] p-2 bg-[#2D2621] shadow-2xl border-4 border-[#3D342C] ring-1 ring-black/10 animate-in fade-in duration-300">
                    <div className="rounded-[26px] bg-[#FAF8F5] text-[#2B231D] overflow-hidden border border-[#E9DFD3] flex flex-col">
                      
                      {/* Notch Bar */}
                      <div className="bg-[#2D2621] text-[#A69788] px-5 py-2 flex items-center justify-between text-[11px] font-medium">
                        <span>9:41</span>
                        <div className="w-16 h-3.5 bg-[#1F1A16] rounded-full mx-auto" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">5G</span>
                          <div className="w-4 h-2 border border-[#A69788] rounded-xs relative">
                            <div className="h-full w-3/4 bg-[#A69788]" />
                          </div>
                        </div>
                      </div>

                      {/* Header */}
                      <div className="p-3.5 bg-gradient-to-r from-[#F6EDE2] to-[#FAF5EE] border-b border-[#E8DDD1]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#B85D36] text-white flex items-center justify-center font-bold text-xs">
                              07
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#2B231D]">{currentFood.hotel}</h4>
                              <p className="text-[10px] text-[#786D62]">{currentFood.table} • Table Scanned & Active</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Live Table
                          </span>
                        </div>

                        <div className="w-full py-1.5 px-3 rounded-lg text-[11px] font-medium bg-white text-[#524438] border border-[#DFCFBF] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <BellRing className="w-3 h-3 text-[#B85D36]" />
                            <span>Call Waiter / Water</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">Ready</span>
                        </div>
                      </div>

                      {/* Dynamic Rotating Food Items */}
                      <div className="p-3.5 space-y-2.5 flex-1 min-h-[220px]">
                        {currentFood.items.map((item, idx) => (
                          <div key={idx} className="rounded-xl p-2.5 bg-white border border-[#E9DFD3] shadow-2xs space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded border border-emerald-600 flex items-center justify-center p-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-800 uppercase">
                                    {item.badge}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-[#2B231D] mt-0.5">{item.name}</h5>
                                <p className="text-[10px] text-[#7A7066] line-clamp-1">{item.desc}</p>
                              </div>
                              <span className="text-xs font-bold text-[#B85D36]">₹{item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Order Bar */}
                      <div className="p-3 bg-white border-t border-[#E8DFD3] shadow-md">
                        <div className="flex items-center justify-between text-xs font-bold mb-2 text-[#2B231D]">
                          <span>Table Total ({currentFood.items.length} items):</span>
                          <span className="text-[#B85D36] text-sm">₹{currentFood.subtotal}</span>
                        </div>
                        <button
                          onClick={onOpenScanner}
                          className="w-full py-2 bg-[#B85D36] hover:bg-[#9F4D2A] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Scan Your Physical Table QR</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. KITCHEN KDS PERSPECTIVE */}
                {perspective === 'kitchen' && (
                  <div className="rounded-[32px] p-4 bg-[#211D1A] text-[#EDE7DF] shadow-2xl border-4 border-[#3B322A] ring-1 ring-black/10 animate-in fade-in duration-300 font-sans">
                    <div className="flex items-center justify-between pb-3 border-b border-[#3E352C] mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D5C5B3]">
                          Kitchen KDS Queue
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Chimes Active
                      </span>
                    </div>

                    <div className="rounded-2xl bg-[#2D2621] p-3.5 border border-[#44382F] space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white bg-[#B85D36] px-2 py-0.5 rounded">
                          Table 09
                        </span>
                        <span className="text-amber-400 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Cooking (2m 14s)
                        </span>
                      </div>
                      <div className="text-xs space-y-1.5 text-[#DCD1C4] pt-1">
                        <p className="flex justify-between border-b border-[#3D332A] pb-1">
                          <span>2x Rava Masala Dosa</span>
                          <span className="text-[10px] text-amber-300">Crispy</span>
                        </p>
                        <p className="flex justify-between border-b border-[#3D332A] pb-1">
                          <span>1x Royal South Indian Thali</span>
                          <span className="text-[10px] text-[#A69788]">Extra Poori</span>
                        </p>
                        <p className="flex justify-between">
                          <span>2x Kumbakonam Filter Coffee</span>
                          <span className="text-[10px] text-emerald-400">Piping Hot</span>
                        </p>
                      </div>
                      <div className="pt-2">
                        <div className="w-full py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl text-center">
                          ✓ Ticket Marked Ready for Server!
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-[#29221C] border border-[#3E342B] flex items-center justify-between text-[11px] text-[#A69788]">
                      <span>Next Order: #249 (Table 03)</span>
                      <span className="text-amber-300">1m ago</span>
                    </div>
                  </div>
                )}

                {/* 3. SERVER / WAITER PERSPECTIVE */}
                {perspective === 'server' && (
                  <div className="rounded-[32px] p-4 bg-[#FFFFFF] text-[#2B231D] shadow-2xl border-4 border-[#3D342C] ring-1 ring-black/10 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D8] mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#2A211B]">Captain Dispatch Console</h4>
                        <p className="text-[10px] text-[#786D62]">Live Handheld Feed</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        2 Live Alerts
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-[#2A211B]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                            Table 04: Water & Chutney Refill
                          </span>
                          <span className="text-[10px] text-amber-800">18s ago</span>
                        </div>
                        <p className="text-[10px] text-[#786D62]">Assigned to: Captain Ramesh</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-[#2A211B]">
                          <span className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-blue-700" />
                            Table 07: Bill Request (UPI QR)
                          </span>
                          <span className="text-[10px] text-blue-800 font-bold">₹420</span>
                        </div>
                        <p className="text-[10px] text-[#786D62]">Diners requested digital receipt</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span>Kitchen: Table 12 Food Ready</span>
                          <span className="text-[10px] text-emerald-700">Counter 1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MANAGER & OWNER PERSPECTIVE */}
                {perspective === 'manager' && (
                  <div className="rounded-[32px] p-4 bg-[#FFFFFF] text-[#2B231D] shadow-2xl border-4 border-[#3D342C] ring-1 ring-black/10 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D8] mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#2A211B]">Hotel Command Center</h4>
                        <p className="text-[10px] text-[#786D62]">Live Revenue & Seating</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#B85D36] bg-[#F7EFE6] px-2 py-0.5 rounded border border-[#E8DDD1]">
                        Live Shift
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D4]">
                        <span className="text-[10px] text-[#7A6D61] font-semibold uppercase">Today's Sales</span>
                        <div className="text-lg font-bold text-[#2B221B] mt-0.5">₹54,280</div>
                        <span className="text-[10px] text-emerald-700 font-semibold">+22.4% vs last week</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D4]">
                        <span className="text-[10px] text-[#7A6D61] font-semibold uppercase">Active Tables</span>
                        <div className="text-lg font-bold text-[#2B221B] mt-0.5">24 / 28</div>
                        <span className="text-[10px] text-[#B85D36] font-semibold">85% Occupancy</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F6EFE6] border border-[#E6D9CB] space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#554639]">
                        <span>Bestseller Dish:</span>
                        <span className="font-bold text-[#2A211A]">Benne Masala Dosa (148)</span>
                      </div>
                      <div className="flex justify-between text-[#554639]">
                        <span>Avg Service Time:</span>
                        <span className="font-bold text-emerald-800">12 Mins (Fast)</span>
                      </div>
                    </div>
                  </div>
                )}

              </Card3D>
            </div>

            {/* Floating Live Sync Pill */}
            <div className="mt-4 animate-calm-float z-30">
              <div className="glass-stone px-4 py-2 rounded-2xl flex items-center gap-2.5 text-xs text-[#3D332A] font-medium shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-[#B85D36] animate-pulse" />
                <span className="text-[11px] font-semibold">Auto-simulating live dining ecosystem (tap tabs above)</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
