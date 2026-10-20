import React, { useState } from 'react';
import { 
  Smartphone, 
  ChefHat, 
  Users, 
  BarChart3, 
  Check, 
  QrCode, 
  Volume2, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card3D } from './Card3D';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const PillarsSection: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'guest' | 'kitchen' | 'server' | 'manager'>('guest');

  const tabs = [
    {
      id: 'guest',
      label: language === 'kn' ? 'ಗ್ರಾಹಕರ ಅನುಭವ' : 'Guest Experience',
      icon: Smartphone,
      badge: 'Zero Friction',
    },
    {
      id: 'kitchen',
      label: language === 'kn' ? 'ಅಡುಗೆಮನೆ (KDS)' : 'Kitchen Display (KDS)',
      icon: ChefHat,
      badge: 'Real-Time Sync',
    },
    {
      id: 'server',
      label: language === 'kn' ? 'ವೇಟರ್ & ಸರ್ವರ್ ಹಬ್' : 'Server & Captain Hub',
      icon: Users,
      badge: 'Instant Alerts',
    },
    {
      id: 'manager',
      label: language === 'kn' ? 'ಮಾಲೀಕರು & ಮ್ಯಾನೇಜರ್' : 'Owner & Manager Analytics',
      icon: BarChart3,
      badge: 'Full Oversight',
    },
  ];

  return (
    <section id="ecosystem" className="py-24 bg-[#FAF8F5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6DC] text-[#71543D] text-xs font-semibold tracking-wide uppercase">
            <Layers className="w-3.5 h-3.5 text-[#B85D36]" />
            <span>Complete Hospitality Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2A211B] font-serif">
            {language === 'kn' ? 'ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಸರಿಹೊಂದುವ ಸಮಗ್ರ ವೇದಿಕೆ' : 'Four Specialized Portals. One Harmonious System.'}
          </h2>
          <p className="text-sm sm:text-base text-[#675C51] leading-relaxed">
            {language === 'kn'
              ? 'ಪ್ರತಿಯೊಂದು ಪಾತ್ರಕ್ಕೂ ವಿಶೇಷ ವಿನ್ಯಾಸ — ಅತಿಥಿ, ಅಡುಗೆಯವರು, ಮಾಣಿಗಳು, ಮತ್ತು ಮಾಲೀಕರು ಎಲ್ಲರೂ ಒಂದೇ ಲೈವ್ ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲಿ ಸಂಪರ್ಕಿತರಾಗಿದ್ದಾರೆ.'
              : 'Every corner of your restaurant is seamlessly connected. No paper chits, no confused waiters, no delayed dishes.'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#B85D36] text-white shadow-md'
                    : 'bg-[#F2EBE1] hover:bg-[#E9DFD3] text-[#55473A] border border-[#DFD1C1]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#857160]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents with 3D Tilt Showcases */}
        <div className="mt-6">
          {activeTab === 'guest' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B85D36]">
                  Part 1: The Table Experience
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#2A211B] font-serif leading-snug">
                  Zero App Installs. Instant Camera Scan to Fresh Menu.
                </h3>
                <p className="text-sm sm:text-base text-[#61554A] leading-relaxed">
                  Guests simply aim their phone camera at the QR disc fixed to their table. The menu loads instantly in any browser with vibrant food imagery, accurate allergen badges, and customizable portion notes.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    'Instant multi-language switch between English and ಕನ್ನಡ (Kannada)',
                    'Smart dietary filters: Pure Veg, Jain, Vegan, Gluten-Free, and Chef Specials',
                    'Interactive Seat-Locking: order together on the same table without bill confusion',
                    'Direct Table Calls: request water, napkins, or the bill with a single tap',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#463C32]">
                      <div className="w-5 h-5 rounded-full bg-[#EFE4D6] text-[#B85D36] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/guest')}
                    className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white rounded-xl text-xs sm:text-sm h-11 px-6 font-medium shadow-xs"
                  >
                    Experience Guest QR Flow
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <Card3D intensity={12} depth={20}>
                  <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E3D7C9] shadow-lg space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D8]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#EFE6DC] text-[#B85D36] flex items-center justify-center font-bold text-xs">
                          T4
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#2A211B]">Guest Mobile View</h4>
                          <p className="text-[10px] text-[#786D62]">No sign-up or app required</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active Session
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-2xl bg-[#FBF9F6] border border-[#ECE0D2] flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <span className="text-xs font-bold text-[#292019]">Mysore Masala Dosa</span>
                          </div>
                          <p className="text-[10px] text-[#7A6D61] mt-0.5">Spicy red chutney smeared with potato masala</p>
                        </div>
                        <span className="text-xs font-bold text-[#B85D36]">₹120</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FBF9F6] border border-[#ECE0D2] flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <span className="text-xs font-bold text-[#292019]">Ghee Pongal</span>
                          </div>
                          <p className="text-[10px] text-[#7A6D61] mt-0.5">Steamed rice and lentils with roasted cashews</p>
                        </div>
                        <span className="text-xs font-bold text-[#B85D36]">₹90</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F4EDE3] rounded-2xl flex items-center justify-between text-xs font-semibold text-[#45392D]">
                      <span>Table Total (2 items):</span>
                      <span className="text-sm font-bold text-[#B85D36]">₹210</span>
                    </div>
                  </div>
                </Card3D>
              </div>
            </div>
          )}

          {activeTab === 'kitchen' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B85D36]">
                  Part 2: The Heart of the House
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#2A211B] font-serif leading-snug">
                  High-Visibility Kitchen Tickets. Zero Lost Paper Slips.
                </h3>
                <p className="text-sm sm:text-base text-[#61554A] leading-relaxed">
                  Head chefs and line cooks see live incoming tickets on any rugged tablet or monitor. Chimes sound instantaneously upon order placement, with color-coded countdowns indicating ticket urgency.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    'Instant Audio Rings: audible alert immediately notifies the line when orders land',
                    'Preparation Timers: color shifts from green to amber to alert staff of aging tickets',
                    'Single-Tap 86 / Sold-Out: mark an item finished to automatically remove it from guest menus',
                    '1-Touch "Order Ready" alert dispatched directly to server handhelds',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#463C32]">
                      <div className="w-5 h-5 rounded-full bg-[#EFE4D6] text-[#B85D36] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white rounded-xl text-xs sm:text-sm h-11 px-6 font-medium shadow-xs"
                  >
                    Open Kitchen Display Console
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <Card3D intensity={12} depth={20}>
                  <div className="bg-[#24201D] text-[#ECE7DF] p-6 sm:p-8 rounded-3xl border border-[#3E352D] shadow-xl space-y-4 font-sans">
                    <div className="flex items-center justify-between pb-3 border-b border-[#3A3129]">
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-[#B85D36]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#DDD1C3]">
                          KDS Live Queue
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Kitchen Audio ON
                      </span>
                    </div>

                    <div className="rounded-2xl bg-[#2D2722] p-4 border border-[#44382F] space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white bg-[#B85D36] px-2 py-0.5 rounded">Table 03</span>
                        <span className="text-amber-400 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Cooking (4m)
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-[#DCD1C4]">
                        <p className="flex justify-between">
                          <span>2x Rava Masala Dosa</span>
                          <span className="text-[10px] text-amber-300">Crispy</span>
                        </p>
                        <p className="flex justify-between">
                          <span>1x Pineapple Sheera</span>
                          <span className="text-[10px] text-[#A69788]">Hot</span>
                        </p>
                      </div>
                      <div className="w-full pt-1">
                        <div className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl text-center cursor-pointer transition-colors">
                          ✓ Mark Ticket Ready
                        </div>
                      </div>
                    </div>
                  </div>
                </Card3D>
              </div>
            </div>
          )}

          {activeTab === 'server' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B85D36]">
                  Part 3: Floor Service Excellence
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#2A211B] font-serif leading-snug">
                  Keep Waiters Focused on Hospitality, Not Hand-Writing Orders.
                </h3>
                <p className="text-sm sm:text-base text-[#61554A] leading-relaxed">
                  Captains and waitstaff carry a lightweight, mobile-optimized dashboard. When a table calls for water, extra cutlery, or bill settlement, the assigned server receives an immediate silent or sound prompt.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    'Instant Table Buzzers: eliminate customers waving arms or yelling across crowded dining halls',
                    'Quick Add Dishes: servers can add items to active table tabs on behalf of guests',
                    'Table Assignment: assign specific floor zones or table clusters to distinct servers',
                    'Split Bill Settlement: easily handle multi-payer tables with UPI QR or cash records',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#463C32]">
                      <div className="w-5 h-5 rounded-full bg-[#EFE4D6] text-[#B85D36] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white rounded-xl text-xs sm:text-sm h-11 px-6 font-medium shadow-xs"
                  >
                    Explore Server Hub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <Card3D intensity={12} depth={20}>
                  <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E3D7C9] shadow-lg space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D8]">
                      <div>
                        <h4 className="text-xs font-bold text-[#2A211B]">Captain Dispatch Feed</h4>
                        <p className="text-[10px] text-[#786D62]">Live Table Alerts</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        2 Pending Calls
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-[#2A211B]">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                            <span>Table 02: Water & Chutney Refill</span>
                          </div>
                          <span className="text-[10px] text-[#786D62]">Called 45s ago</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] bg-white border-amber-300 text-amber-900">
                          Acknowledge
                        </Button>
                      </div>

                      <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-[#2A211B]">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span>Table 07: Bill Request (Cash)</span>
                          </div>
                          <span className="text-[10px] text-[#786D62]">Total: ₹410</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] bg-white border-blue-300 text-blue-900">
                          Print & Settle
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card3D>
              </div>
            </div>
          )}

          {activeTab === 'manager' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B85D36]">
                  Part 4: Owner & Manager Intelligence
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#2A211B] font-serif leading-snug">
                  Real-Time Sales Velocity, Table Turns, and Staff Control.
                </h3>
                <p className="text-sm sm:text-base text-[#61554A] leading-relaxed">
                  Gain transparent, live visibility into today's gross revenue, average dining duration, dish profitability, and waitstaff performance. Print branded table QR codes with a single click.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    'Live Financial Dashboard: watch today’s revenue ticker update as tables settle',
                    'Table QR Generation: automatically generate high-resolution QR discs ready for laminate printing',
                    'Staff Credential Vault: securely manage logins for servers and kitchen with strict password protection',
                    'Multi-Hotel Dining Hub: switch between city branches effortlessly with Super Admin control',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#463C32]">
                      <div className="w-5 h-5 rounded-full bg-[#EFE4D6] text-[#B85D36] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white rounded-xl text-xs sm:text-sm h-11 px-6 font-medium shadow-xs"
                  >
                    Open Manager Command Center
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <Card3D intensity={12} depth={20}>
                  <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E3D7C9] shadow-lg space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D8]">
                      <div>
                        <h4 className="text-xs font-bold text-[#2A211B]">Owner Live Analytics</h4>
                        <p className="text-[10px] text-[#786D62]">Real-time shift metrics</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#B85D36]">Live Today</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D4]">
                        <span className="text-[10px] text-[#7A6D61] font-semibold uppercase">Today's Revenue</span>
                        <div className="text-lg font-bold text-[#2B221B] mt-0.5">₹42,850</div>
                        <span className="text-[10px] text-emerald-700 font-semibold">+18.4% vs last week</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE1D4]">
                        <span className="text-[10px] text-[#7A6D61] font-semibold uppercase">Avg Table Turnover</span>
                        <div className="text-lg font-bold text-[#2B221B] mt-0.5">22 Mins</div>
                        <span className="text-[10px] text-[#B85D36] font-semibold">⚡ 9m faster service</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F6EFE6] border border-[#E6D9CB] flex items-center justify-between text-xs">
                      <span className="text-[#554639] font-medium">Bestseller: Davangere Benne Dosa</span>
                      <span className="font-bold text-[#2A211A]">142 Orders</span>
                    </div>
                  </div>
                </Card3D>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
