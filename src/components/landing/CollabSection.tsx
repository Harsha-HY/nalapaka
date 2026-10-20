import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  Utensils, 
  ShieldCheck, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ensureAnonSession } from '@/hooks/useAnonAuth';
import { saveOnboardingRequest, OnboardingRequest } from './HotelOnboardingModal';
import { useLanguage } from '@/contexts/LanguageContext';

export const CollabSection: React.FC = () => {
  const { language } = useLanguage();
  const [hotelName, setHotelName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [tablesCount, setTablesCount] = useState('20');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName.trim() || !phone.trim() || !ownerName.trim()) return;

    setSubmitting(true);

    const newRequest: OnboardingRequest = {
      id: `req-${Date.now()}`,
      hotelName: hotelName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      tablesCount: Number(tablesCount) || 15,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // 1. Save to local storage backup
    saveOnboardingRequest(newRequest);

    // 2. Persist directly to Supabase orders table (table_number = 'ONBOARDING')
    try {
      await ensureAnonSession();
      let authData = await supabase.auth.getUser();
      let userId = authData.data?.user?.id;
      if (!userId) {
        const sessionRes = await supabase.auth.getSession();
        userId = sessionRes.data.session?.user?.id;
      }
      if (!userId) {
        const anonRes = await supabase.auth.signInAnonymously();
        userId = anonRes.data.user?.id;
      }

      const { data: hotels } = await supabase.from('hotels').select('id').limit(1);
      const hotelId = hotels?.[0]?.id || '32bbe6e4-029d-4450-b587-4295c9289a21';

      if (userId && hotelId) {
        await supabase.from('orders').insert({
          user_id: userId,
          hotel_id: hotelId,
          customer_name: newRequest.ownerName,
          phone_number: newRequest.phone,
          table_number: 'ONBOARDING',
          ordered_items: [
            {
              type: 'hotel_onboarding_request',
              hotel_name: newRequest.hotelName,
              owner_name: newRequest.ownerName,
              email: newRequest.email,
              phone: newRequest.phone,
              city: newRequest.city,
              tables_count: newRequest.tablesCount,
              notes: newRequest.notes,
              timestamp: newRequest.createdAt,
            },
          ],
          total_amount: 0,
          order_status: 'Pending',
          order_stage: 'cart',
        });
      }
    } catch (err) {
      console.error('Error submitting collaboration request to Supabase:', err);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setHotelName('');
    setOwnerName('');
    setPhone('');
    setEmail('');
    setCity('');
    setTablesCount('20');
    setNotes('');
  };

  return (
    <section id="collab" className="py-20 sm:py-28 bg-[#F5EFE6] border-t border-[#E5DACD] relative overflow-hidden">
      {/* Decorative calm background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#EADCCF]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DFCFBF]/30 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8DDD1] text-[#69503D] text-xs font-semibold tracking-wider uppercase border border-[#D9C7B6]">
            <Building2 className="w-3.5 h-3.5 text-[#B85D36]" />
            <span>{language === 'kn' ? 'ನಲಪಾಕ ಪಾಲುದಾರಿಕೆ' : 'Collaborate With Nalapaka'}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold font-serif text-[#2B231D] tracking-tight">
            {language === 'kn'
              ? 'ನಿಮ್ಮ ರೆಸ್ಟೋರೆಂಟ್‌ಗೆ ನಲಪಾಕ DineOS ತನ್ನಿ'
              : 'Collab with Nalapaka — Submit Your Details'}
          </h2>

          <p className="text-sm sm:text-base text-[#65584C] max-w-2xl mx-auto leading-relaxed">
            {language === 'kn'
              ? 'ನಿಮ್ಮ ಹೋಟೆಲ್ ಅಥವಾ ಕೆಫೆಯಲ್ಲಿ ಆನ್‌ಲೈನ್ ಟೇಬಲ್ ಆರ್ಡರಿಂಗ್ ಮತ್ತು ಕಿಚನ್ ಡಿಸ್ಪ್ಲೇ ಅಳವಡಿಸಲು ಕೆಳಗಿನ ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ. ನಮ್ಮ ಸೂಪರ್ ಅಡ್ಮಿನ್ ತಂಡವು ನಿಮ್ಮೊಂದಿಗೆ ೨ ಗಂಟೆಗಳ ಒಳಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲಿದೆ.'
              : 'Bring high-efficiency table QR ordering, bilingual menus, and live kitchen synchronization to your restaurant. Submit your inquiry below and our Super Admin team will review and contact you directly.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Left Column: Why Partner Info (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-[#E3D6C8] shadow-sm space-y-6">
              <h3 className="text-xl font-bold font-serif text-[#2B231D]">
                What Happens Next?
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F4EBE0] text-[#B85D36] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2A211B]">Instant Admin Review</h4>
                    <p className="text-xs text-[#6F6357] mt-0.5 leading-relaxed">
                      Your submission lands immediately in our Super Admin Console with your hotel profile and contact number.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F4EBE0] text-[#B85D36] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2A211B]">Tailored Menu Digitsation</h4>
                    <p className="text-xs text-[#6F6357] mt-0.5 leading-relaxed">
                      We digitize your existing menu with Kannada & English translations, dietary badges, and prices.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F4EBE0] text-[#B85D36] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2A211B]">Custom Table QR Discs Shipped</h4>
                    <p className="text-xs text-[#6F6357] mt-0.5 leading-relaxed">
                      We ship waterproof QR table stands/stickers programmed with your hotel slug and individual table numbers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F4EBE0] text-[#B85D36] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2A211B]">Zero Commission Guarantee</h4>
                    <p className="text-xs text-[#6F6357] mt-0.5 leading-relaxed">
                      Keep 100% of your dining revenue. Nalapaka charges no commissions per customer order.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct helpline card */}
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCE] text-xs text-[#655749] space-y-2">
                <div className="font-semibold text-[#292019] flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#B85D36]" />
                  <span>Direct Partner Hotline:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 font-medium text-xs">
                  <a href="tel:+919886000000" className="text-[#B85D36] hover:underline">+91 98860 00000</a>
                  <a href="mailto:contact@nalapaka.com" className="text-[#B85D36] hover:underline">contact@nalapaka.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Submission Form (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-white p-6 sm:p-10 border border-[#E3D6C8] shadow-md relative overflow-hidden">
              
              {submitted ? (
                <div className="py-12 text-center space-y-5 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-serif text-[#2B231D]">
                      Details Sent to Super Admin!
                    </h3>
                    <p className="text-sm text-[#66594C] max-w-md mx-auto leading-relaxed">
                      Thank you, <strong>{ownerName}</strong>. Your inquiry for <strong>{hotelName}</strong> has been logged in our cloud administrative panel. Our team will contact you via WhatsApp / Phone within 2 hours.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DC CE] max-w-md mx-auto text-xs text-left text-[#58493B] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#847567]">Restaurant:</span>
                      <span className="font-semibold text-[#2B231D]">{hotelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#847567]">Contact Phone:</span>
                      <span className="font-semibold text-[#2B231D]">{phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#847567]">Location:</span>
                      <span className="font-semibold text-[#2B231D]">{city || 'Karnataka'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#847567]">Tables Count:</span>
                      <span className="font-semibold text-[#2B231D]">{tablesCount} Tables</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-[#D8CAC0] text-[#554638] hover:bg-[#F2ECE4] h-10 px-6 text-xs font-semibold rounded-xl"
                  >
                    Submit Another Restaurant
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-[#EFE5DA] pb-4">
                    <h3 className="text-xl font-bold font-serif text-[#2B231D]">
                      Restaurant Onboarding Details
                    </h3>
                    <p className="text-xs text-[#7B6E61] mt-1">
                      Fill out your eatery information to establish your Nalapaka DineOS setup.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Restaurant Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="collab-hotelName" className="text-xs font-semibold text-[#453A30]">
                        Restaurant / Hotel Name *
                      </Label>
                      <Input
                        id="collab-hotelName"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        placeholder="e.g. Nalapaka Heritage Bhavan"
                        required
                        className="bg-[#FAF7F2] border-[#DCCEC0] focus-visible:ring-[#B85D36] text-xs h-10 rounded-xl"
                      />
                    </div>

                    {/* Owner / Contact Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="collab-ownerName" className="text-xs font-semibold text-[#453A30]">
                        Owner / Manager Name *
                      </Label>
                      <Input
                        id="collab-ownerName"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Anand Rao"
                        required
                        className="bg-[#FAF7F2] border-[#DCCEC0] focus-visible:ring-[#B85D36] text-xs h-10 rounded-xl"
                      />
                    </div>

                    {/* Phone / WhatsApp */}
                    <div className="space-y-1.5">
                      <Label htmlFor="collab-phone" className="text-xs font-semibold text-[#453A30]">
                        Phone / WhatsApp Number *
                      </Label>
                      <Input
                        id="collab-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98860 00000"
                        required
                        className="bg-[#FAF7F2] border-[#DCCEC0] focus-visible:ring-[#B85D36] text-xs h-10 rounded-xl"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="collab-email" className="text-xs font-semibold text-[#453A30]">
                        Email Address
                      </Label>
                      <Input
                        id="collab-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="manager@hotel.com"
                        className="bg-[#FAF7F2] border-[#DCCEC0] focus-visible:ring-[#B85D36] text-xs h-10 rounded-xl"
                      />
                    </div>

                    {/* City / Location */}
                    <div className="space-y-1.5">
                      <Label htmlFor="collab-city" className="text-xs font-semibold text-[#453A30]">
                        City / Area *
                      </Label>
                      <Input
                        id="collab-city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mysuru / Bengaluru / Hubballi"
                        required
                        className="bg-[#FAF7F2] border-[#DCCEC0] focus-visible:ring-[#B85D36] text-xs h-10 rounded-xl"
                      />
                    </div>

                    {/* Number of Tables */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="collab-tables" className="text-xs font-semibold text-[#453A30]">
                        Estimated Dining Tables Count
                      </Label>
                      <div className="flex gap-2">
                        {['10', '20', '35', '50+'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTablesCount(val.replace('+', ''))}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                              tablesCount === val.replace('+', '')
                                ? 'bg-[#B85D36] text-white border-[#B85D36]'
                                : 'bg-[#FAF7F2] text-[#57493D] border-[#DCCEC0] hover:bg-[#EFE8DD]'
                            }`}
                          >
                            {val} Tables
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes / Message */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="collab-notes" className="text-xs font-semibold text-[#453A30]">
                        Special Notes or Inquiries
                      </Label>
                      <Textarea
                        id="collab-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tell us about your restaurant setup (multi-floor, bar, self-service counter, POS integration needs)..."
                        rows={3}
                        className="bg-[#FAF7F2] border-[#DCCEC0] focus-visible:ring-[#B85D36] text-xs rounded-xl resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#B85D36] hover:bg-[#9F4D2A] text-white font-semibold text-xs sm:text-sm h-11 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Routing Details to Super Admin...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Collaboration Details</span>
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-center text-[#847668] mt-2">
                      🔒 No payment or credit card required. Details routed directly to verified Super Admin.
                    </p>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};