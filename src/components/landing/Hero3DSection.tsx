import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card3D } from './Card3D';
import { HeroAtmosphericBackground } from './HeroAtmosphericBackground';
import { useLanguage } from '@/contexts/LanguageContext';

interface Hero3DSectionProps {
  onOpenScanner?: () => void;
  onOpenAuthModal?: () => void;
}

export const Hero3DSection: React.FC<Hero3DSectionProps> = ({
  onOpenScanner,
  onOpenAuthModal,
}) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  
  // Interactive states inside the 3D phone
  const [dosaCount, setDosaCount] = useState(1);
  const [coffeeCount, setCoffeeCount] = useState(2);
  const [ticketStatus, setTicketStatus] = useState<'pending' | 'cooking' | 'ready'>('cooking');
  const [waterCalled, setWaterCalled] = useState(false);

  const totalDemoBill = dosaCount * 110 + coffeeCount * 35;

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

          {/* Right Column: 3D Interactive Device Preview with Tilt & Parallax */}
          <div className="lg:col-span-6 relative flex justify-center items-center py-6">
            
            {/* Background 3D Depth Card: Kitchen Display System (Tablet View) */}
            <div className="hidden sm:block absolute -top-2 right-2 w-[340px] md:w-[390px] z-10 opacity-90 transition-transform duration-500 hover:opacity-100 hover:scale-[1.02]">
              <Card3D intensity={8} depth={15}>
                <div className="rounded-2xl bg-[#282420] text-[#EFEBE4] p-4 shadow-2xl border border-[#483E36] font-sans">
                  <div className="flex items-center justify-between pb-3 border-b border-[#3D352E] mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#B5A593]">
                        Kitchen Display System (KDS)
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#38312B] text-[#D4C3B2] border border-[#4D4238]">
                      Live Tickets
                    </span>
                  </div>

                  {/* KDS Order Card */}
                  <div className="rounded-xl bg-[#332D27] p-3 border border-[#4A3F35] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="px-1.5 py-0.5 rounded bg-[#B85D36] text-[10px] text-white">T-07</span>
                        <span>Order #248</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#AFA191]">
                        <Clock className="w-3 h-3 text-[#B85D36]" />
                        <span>Just now</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-[#DDD2C6] pt-1">
                      <div className="flex justify-between items-center py-0.5 border-b border-[#403830]">
                        <span>{dosaCount}x Benne Masala Dosa</span>
                        <span className="text-[10px] text-emerald-400 font-medium">Extra Crispy</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span>{coffeeCount}x Kumbakonam Filter Coffee</span>
                        <span className="text-[10px] text-[#B5A593]">Strong / Less Sugar</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setTicketStatus(ticketStatus === 'cooking' ? 'ready' : 'cooking');
                        }}
                        className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          ticketStatus === 'cooking'
                            ? 'bg-[#B85D36] hover:bg-[#A14F2B] text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {ticketStatus === 'cooking' ? '👨‍🍳 In Preparation (Tap when Ready)' : '✓ Order Ready for Server!'}
                      </button>
                    </div>
                  </div>
                </div>
              </Card3D>
            </div>

            {/* Foreground 3D Depth Card: Guest Table Mobile Simulator */}
            <div className="relative w-full max-w-[340px] sm:max-w-[350px] z-20 sm:mr-16">
              <Card3D intensity={14} depth={30}>
                <div className="rounded-[32px] p-2 bg-[#2D2621] shadow-2xl border-4 border-[#3D342C] ring-1 ring-black/10">
                  {/* Phone Screen Container */}
                  <div className="rounded-[26px] bg-[#FAF8F5] text-[#2B231D] overflow-hidden border border-[#E9DFD3] flex flex-col">
                    
                    {/* Phone Top Notch Bar */}
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

                    {/* Table Header inside Phone */}
                    <div className="p-4 bg-gradient-to-r from-[#F6EDE2] to-[#FAF5EE] border-b border-[#E8DDD1]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#B85D36] text-white flex items-center justify-center font-bold text-xs">
                            07
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#2B231D]">Nalapaka Grand</h4>
                            <p className="text-[10px] text-[#786D62]">Table 07 • Scanned & Active</p>
                          </div>
                        </div>

                        {/* Interactive In-Phone Language Switcher */}
                        <button
                          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white border border-[#D8C7B8] text-[#55463A] hover:bg-[#F2ECE3] shadow-2xs"
                        >
                          {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
                        </button>
                      </div>

                      {/* Guest interactive call button */}
                      <button
                        onClick={() => setWaterCalled(!waterCalled)}
                        className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border ${
                          waterCalled 
                            ? 'bg-amber-100 text-amber-900 border-amber-300' 
                            : 'bg-white text-[#524438] border-[#DFCFBF] hover:bg-[#F4ECE3]'
                        }`}
                      >
                        <BellRing className={`w-3 h-3 ${waterCalled ? 'text-amber-700 animate-bounce' : 'text-[#8E7E70]'}`} />
                        <span>{waterCalled ? 'Server Alerted for Table 07!' : 'Call Waiter / Request Water'}</span>
                      </button>
                    </div>

                    {/* Interactive Dish Card inside Phone */}
                    <div className="p-3.5 space-y-3 flex-1">
                      <div className="rounded-xl p-3 bg-white border border-[#E9DFD3] shadow-xs hover:border-[#D5C2B1] transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center p-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">
                                {language === 'kn' ? 'ವಿಶೇಷ ತಿನಿಸು' : "Chef's Special"}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-[#2B231D]">
                              {language === 'kn' ? 'ಬೆಣ್ಣೆ ಮಸಾಲ ದೋಸೆ' : 'Benne Masala Dosa'}
                            </h5>
                            <p className="text-[10px] text-[#7A7066] line-clamp-2 mt-0.5">
                              {language === 'kn' 
                                ? 'ತಾಜಾ ಬೆಣ್ಣೆ, ಮಸಾಲ ಆಲೂಗಡ್ಡೆ, ತೆಂಗಿನಕಾಯಿ ಚಟ್ನಿ ಮತ್ತು ಸಾಂಬಾರ್ ಜತೆ' 
                                : 'Davangere style golden crisp crepe smeared with fresh butter, spiced potato mash.'}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[#B85D36] whitespace-nowrap">₹110</span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="mt-2.5 pt-2 border-t border-[#F1E9DF] flex items-center justify-between">
                          <span className="text-[10px] text-[#7A6E63] font-medium">Quantity:</span>
                          <div className="inline-flex items-center gap-2 bg-[#F6EFE6] px-2 py-0.5 rounded-full border border-[#E4D7CA]">
                            <button
                              onClick={() => setDosaCount(Math.max(1, dosaCount - 1))}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-[#554639] hover:bg-white"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-[#2B231D]">{dosaCount}</span>
                            <button
                              onClick={() => setDosaCount(dosaCount + 1)}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-[#554639] hover:bg-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Second Dish: Filter Coffee */}
                      <div className="rounded-xl p-3 bg-white border border-[#E9DFD3] shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Coffee className="w-3 h-3 text-[#8A5A36]" />
                              <span className="text-[10px] font-semibold text-[#8A5A36]">Traditional Brew</span>
                            </div>
                            <h5 className="text-xs font-bold text-[#2B231D]">Kumbakonam Filter Coffee</h5>
                            <p className="text-[10px] text-[#7A7066]">Frothed chicory-coffee decoction.</p>
                          </div>
                          <span className="text-xs font-bold text-[#B85D36]">₹35</span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#F1E9DF] flex items-center justify-between">
                          <span className="text-[10px] text-[#7A6E63]">Quantity:</span>
                          <div className="inline-flex items-center gap-2 bg-[#F6EFE6] px-2 py-0.5 rounded-full border border-[#E4D7CA]">
                            <button
                              onClick={() => setCoffeeCount(Math.max(1, coffeeCount - 1))}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-[#554639] hover:bg-white"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-[#2B231D]">{coffeeCount}</span>
                            <button
                              onClick={() => setCoffeeCount(coffeeCount + 1)}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-[#554639] hover:bg-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar inside Phone */}
                    <div className="p-3 bg-white border-t border-[#E8DFD3] shadow-md">
                      <div className="flex items-center justify-between text-xs font-bold mb-2 text-[#2B231D]">
                        <span>Table Subtotal:</span>
                        <span className="text-[#B85D36] text-sm">₹{totalDemoBill}</span>
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
              </Card3D>
            </div>

            {/* Floating 3D Pills with Natural Calm Shadows */}
            <div className="absolute -bottom-6 -left-4 sm:left-4 z-30 animate-calm-float">
              <div className="glass-stone px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs text-[#3D332A] font-medium">
                <div className="w-8 h-8 rounded-xl bg-[#EFE4D6] flex items-center justify-center text-[#B85D36]">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#231B15]">Instant Dining Sync</div>
                  <div className="text-[11px] text-[#73675C]">Phone ➔ Kitchen in 0.8s</div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-4 right-4 z-30 animate-calm-float-reverse">
              <div className="glass-stone px-3.5 py-2 rounded-2xl flex items-center gap-2.5 text-xs text-[#3D332A] font-medium">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span className="text-[11px]">Table session verified by QR</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
