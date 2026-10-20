import React from 'react';
import { Star, Quote, CheckCircle2, Building2 } from 'lucide-react';
import { Card3D } from './Card3D';
import { useLanguage } from '@/contexts/LanguageContext';

export const TestimonialsSection: React.FC = () => {
  const { language } = useLanguage();

  const reviews = [
    {
      name: 'Ramesh Hegde',
      role: 'General Manager, Nalapaka Heritage Nanjangud',
      quote:
        'During our Sunday rush hour, waiters used to scramble with paper slips. With Nalapaka DineOS, families sit down, scan the table disc, and the kitchen printer and screens receive the tickets before the waiter even reaches the table. Our table turn time dropped by 14 minutes.',
      location: 'Nanjangud, Karnataka',
      rating: 5,
    },
    {
      name: 'Ananya & Preetham Rao',
      role: 'Weekend Diners',
      quote:
        'The Kannada language option made my grandparents feel right at home. They could read the Kannada descriptions of Benne Dosa and filter coffee directly on my phone. Plus, calling for water was just one quiet tap instead of waving across the room.',
      location: 'Mysore',
      rating: 5,
    },
    {
      name: 'Chef Manjunath K.',
      role: 'Executive Line Chef',
      quote:
        'The KDS screen changed our kitchen. The audio chime sounds when a ticket arrives, and special customer requests like "extra crispy" or "less oil" are highlighted in clean typography. No more deciphering messy handwriting on grease-stained slips.',
      location: 'Bengaluru',
      rating: 5,
    },
  ];

  return (
    <section className="py-24 bg-[#F5EFE6] border-y border-[#E9DFD3] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DDD0] text-[#6E533F] text-xs font-semibold tracking-wide uppercase">
            <Star className="w-3.5 h-3.5 text-[#B85D36] fill-[#B85D36]" />
            <span>Proven in Everyday Dining</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2A211B] font-serif">
            {language === 'kn' ? 'ಗ್ರಾಹಕರು ಮತ್ತು ಸಿಬ್ಬಂದಿಯ ನೈಜ ಅನುಭವ' : 'Trusted by Hoteliers and Loved by Diners'}
          </h2>
          <p className="text-sm sm:text-base text-[#655A4F] leading-relaxed">
            {language === 'kn'
              ? 'ಪ್ರಸಿದ್ಧ ಹೋಟೆಲ್‌ಗಳು ಮತ್ತು ಅತಿಥಿಗಳು ತಮ್ಮ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಾರೆ.'
              : 'Real stories from the front of the house to the kitchen prep line.'}
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((rev, index) => (
            <Card3D key={index} intensity={8} depth={15}>
              <div className="rounded-3xl bg-[#FAF7F2] p-6 sm:p-7 border border-[#E3D7C9] shadow-sm flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#B85D36] text-[#B85D36]" />
                      ))}
                    </div>
                    <Quote className="w-5 h-5 text-[#C9BAAA]" />
                  </div>

                  <p className="text-xs sm:text-sm text-[#4E4338] leading-relaxed italic">
                    "{rev.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[#EAE0D3]">
                  <h4 className="text-sm font-bold text-[#2B221B]">{rev.name}</h4>
                  <p className="text-xs text-[#7B6E61]">{rev.role}</p>
                  <span className="text-[11px] text-[#A69788] block mt-0.5">{rev.location}</span>
                </div>
              </div>
            </Card3D>
          ))}
        </div>

        {/* Four Big Metrics */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4D7CA] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#B85D36] font-serif">18s</div>
            <p className="text-xs text-[#73665A] mt-1 font-medium">Order-to-Kitchen Sync</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4D7CA] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#2B221B] font-serif">99.4%</div>
            <p className="text-xs text-[#73665A] mt-1 font-medium">Order Accuracy</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4D7CA] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#B85D36] font-serif">0 App</div>
            <p className="text-xs text-[#73665A] mt-1 font-medium">Downloads for Guests</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4D7CA] text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-bold text-[#2B221B] font-serif">₹0</div>
            <p className="text-xs text-[#73665A] mt-1 font-medium">Third-Party Commissions</p>
          </div>
        </div>

      </div>
    </section>
  );
};
