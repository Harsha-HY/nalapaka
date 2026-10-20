import React, { useState } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Clock, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card3D } from './Card3D';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const RoiCalculator: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [dailyTables, setDailyTables] = useState<number>(45);
  const [avgTicket, setAvgTicket] = useState<number>(650);

  // Faster table turnaround (average 20% extra table turn per shift)
  const monthlyTables = dailyTables * 30;
  const currentMonthlyGross = monthlyTables * avgTicket;

  // 18% additional turnover capacity unlocked through table QR ordering
  const extraMonthlyRevenue = Math.round(currentMonthlyGross * 0.18);
  
  // Approximate waiter labor hours saved per month (approx 3.5 mins saved per table interaction)
  const monthlyHoursSaved = Math.round((monthlyTables * 3.5) / 60);

  // 0% platform commission compared to 22% typical aggregator fees
  const aggregatorSavedFee = Math.round(currentMonthlyGross * 0.22);

  return (
    <section id="roi-calculator" className="py-24 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6DC] text-[#71543D] text-xs font-semibold tracking-wide uppercase">
            <Coins className="w-3.5 h-3.5 text-[#B85D36]" />
            <span>Restaurant Economics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2A211B] font-serif">
            {language === 'kn' ? 'ರೆಸ್ಟೋರೆಂಟ್ ಲಾಭ ಮತ್ತು ಸಮಯ ಉಳಿತಾಯ' : 'Quantify Your Hospitality Return on Investment'}
          </h2>
          <p className="text-sm sm:text-base text-[#655A4F] leading-relaxed">
            {language === 'kn'
              ? 'ಆರ್ಡರ್ ತಲುಪಿಸುವ ವೇಗ ಹೆಚ್ಚಿದಂತೆ, ಟೇಬಲ್ ವಹಿವಾಟು ವೇಗಗೊಳ್ಳುತ್ತದೆ. ನಿಮ್ಮ ದಿನದ ಟೇಬಲ್‌ಗಳ ಸಂಖ್ಯೆಯನ್ನು ಹೊಂದಿಸಿ ನೋಡಿ.'
              : 'By cutting down 12 minutes of paper menu waiting and billing friction per table, your dining room serves more guests without expanding floor space.'}
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Sliders Input (Left 6 Cols) */}
          <div className="lg:col-span-6 bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E3D7C9] shadow-sm space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[#2A211B]">
                  Daily Seated Dining Tables:
                </label>
                <span className="text-lg font-bold text-[#B85D36] bg-[#F7EFE6] px-3 py-1 rounded-xl border border-[#E5D7CA]">
                  {dailyTables} tables / day
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={dailyTables}
                onChange={(e) => setDailyTables(Number(e.target.value))}
                className="w-full h-2.5 bg-[#E8DDD1] rounded-lg appearance-none cursor-pointer accent-[#B85D36]"
              />
              <div className="flex justify-between text-[11px] text-[#86786A]">
                <span>10 (Boutique Cafe)</span>
                <span>75 (Midsize Dining)</span>
                <span>150 (High-Volume Banquet)</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[#2A211B]">
                  Average Dining Bill / Table:
                </label>
                <span className="text-lg font-bold text-[#B85D36] bg-[#F7EFE6] px-3 py-1 rounded-xl border border-[#E5D7CA]">
                  ₹{avgTicket}
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="3000"
                step="50"
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="w-full h-2.5 bg-[#E8DDD1] rounded-lg appearance-none cursor-pointer accent-[#B85D36]"
              />
              <div className="flex justify-between text-[11px] text-[#86786A]">
                <span>₹200 (Quick Tiffin)</span>
                <span>₹1,500 (Family Dinner)</span>
                <span>₹3,000 (Royal Feast)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] text-xs text-[#5E5144] space-y-2">
              <div className="font-semibold text-[#292019] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#B85D36]" />
                Direct Table-Side QR Advantage:
              </div>
              <p>
                Guests order within 30 seconds of sitting down. No waiting for captains to bring physical menus, reducing table wait times and freeing up staff for attentive table service.
              </p>
            </div>
          </div>

          {/* Results Summary (Right 6 Cols) */}
          <div className="lg:col-span-6">
            <Card3D intensity={10} depth={20}>
              <div className="bg-gradient-to-br from-[#2D2621] to-[#1E1916] text-[#EFEBE4] p-6 sm:p-8 rounded-3xl border border-[#483E36] shadow-xl space-y-6 font-sans">
                
                <div className="flex items-center justify-between pb-4 border-b border-[#433830]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B85D36]">
                      Projected Impact
                    </span>
                    <h3 className="text-xl font-bold text-white font-serif">
                      Monthly Efficiency Dividend
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#3D332B] flex items-center justify-center text-[#B85D36]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Metric 1 */}
                  <div className="p-4 rounded-2xl bg-[#372E27] border border-[#4D4036] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#B5A594] block">Unlocked Table Turnover Revenue:</span>
                      <span className="text-xs text-[#7F7061] mt-0.5 block">+18% seating capacity reclaimed</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-serif">
                        +₹{extraMonthlyRevenue.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-[#A69787]">per month</span>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-4 rounded-2xl bg-[#372E27] border border-[#4D4036] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#B5A594] block">Staff Labor Time Reclaimed:</span>
                      <span className="text-xs text-[#7F7061] mt-0.5 block">Eliminates manual ticket writing</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-bold text-amber-300 font-serif">
                        {monthlyHoursSaved} Hours
                      </div>
                      <span className="text-[10px] text-[#A69787]">saved monthly</span>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-4 rounded-2xl bg-[#372E27] border border-[#4D4036] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#B5A594] block">Platform Commissions Paid:</span>
                      <span className="text-xs text-[#7F7061] mt-0.5 block">Direct dining, 0% third-party cuts</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-bold text-white font-serif">
                        ₹0
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">100% margin retained</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-[#B85D36] hover:bg-[#9F4D2A] text-white font-semibold text-xs sm:text-sm h-11 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Get Nalapaka DineOS for Your Restaurant</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

              </div>
            </Card3D>
          </div>

        </div>

      </div>
    </section>
  );
};
