import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ensureAnonSession } from '@/hooks/useAnonAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface HotelOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface OnboardingRequest {
  id: string;
  hotelName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  tablesCount: number;
  notes?: string;
  createdAt: string;
  status: 'pending' | 'contacted' | 'approved';
}

const STORAGE_KEY = 'nalapaka_onboarding_requests_v1';

export function saveOnboardingRequest(req: OnboardingRequest) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([req, ...existing]));
  } catch {}
}

export function getOnboardingRequests(): OnboardingRequest[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export const HotelOnboardingModal: React.FC<HotelOnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    // 1. Save to local storage for local immediate backup
    saveOnboardingRequest(newRequest);

    // 2. Persist to Supabase Database (orders table with table_number = 'ONBOARDING')
    // This allows the Super Admin to see it in real-time from any device or location!
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

      // Get active hotel ID to attach as foreign key
      const { data: hotels } = await supabase.from('hotels').select('id').limit(1);
      const hotelId = hotels?.[0]?.id || '32bbe6e4-029d-4450-b587-4295c9289a21';

      if (userId && hotelId) {
        const { error: insertErr } = await supabase.from('orders').insert({
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
        if (insertErr) {
          console.error('Supabase onboarding order insert error:', insertErr);
        }
      }
    } catch (err) {
      console.error('Error syncing onboarding request to Supabase:', err);
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#DFCFC0] shadow-2xl p-6 sm:p-8 overflow-hidden text-[#2B231D] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7B6E60] hover:text-[#2B231D] hover:bg-[#EFE7DC] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-serif text-[#2B231D]">
                Partnership Request Received!
              </h3>
              <p className="text-xs sm:text-sm text-[#6A5E53] max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{ownerName || 'Partner'}</strong>. Your restaurant details have been forwarded to the Nalapaka Super Admin panel. Our onboarding engineering team will contact you via WhatsApp / Phone within 2 hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E4D7CA] text-xs text-left max-w-sm mx-auto space-y-1 text-[#554638]">
              <div><strong>Restaurant:</strong> {hotelName}</div>
              <div><strong>Location:</strong> {city || 'Karnataka'}</div>
              <div><strong>Contact:</strong> {phone} • {email}</div>
            </div>

            <Button
              onClick={handleReset}
              className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white px-6 h-10 text-xs font-semibold rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE6DC] border border-[#DDD0C1] text-[#71543D] text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#B85D36]" />
                <span>Restaurant Onboarding</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#2B231D]">
                Get Nalapaka DineOS for Your Restaurant
              </h3>
              <p className="text-xs sm:text-sm text-[#6A5E53] leading-relaxed">
                Fill in your hotel details below. Your request will be directly routed to our Super Admin console for immediate activation and QR disc printing.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="req-hotel-name" className="text-xs font-semibold text-[#44382D]">
                    Restaurant / Hotel Name *
                  </Label>
                  <Input
                    id="req-hotel-name"
                    required
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="e.g. Nalapaka Heritage"
                    className="h-10 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-owner-name" className="text-xs font-semibold text-[#44382D]">
                    Owner / Contact Person *
                  </Label>
                  <Input
                    id="req-owner-name"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Harsha Gowda"
                    className="h-10 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="req-phone" className="text-xs font-semibold text-[#44382D]">
                    Phone / WhatsApp Number *
                  </Label>
                  <Input
                    id="req-phone"
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-email" className="text-xs font-semibold text-[#44382D]">
                    Email Address *
                  </Label>
                  <Input
                    id="req-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@hotel.com"
                    className="h-10 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="req-city" className="text-xs font-semibold text-[#44382D]">
                    City / Location *
                  </Label>
                  <Input
                    id="req-city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Nanjangud / Mysore"
                    className="h-10 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-tables" className="text-xs font-semibold text-[#44382D]">
                    Number of Tables
                  </Label>
                  <Input
                    id="req-tables"
                    type="number"
                    min="1"
                    max="500"
                    value={tablesCount}
                    onChange={(e) => setTablesCount(e.target.value)}
                    placeholder="20"
                    className="h-10 bg-white border-[#D9CABE] text-sm text-[#2B231D]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-notes" className="text-xs font-semibold text-[#44382D]">
                  Special Requests / Current Setup (Optional)
                </Label>
                <Textarea
                  id="req-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us about your cuisine, branch locations, or specific requirements..."
                  rows={2}
                  className="bg-white border-[#D9CABE] text-sm text-[#2B231D] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[#B85D36] hover:bg-[#9F4D2A] text-white font-semibold text-sm rounded-xl shadow-sm transition-all mt-3 gap-2"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Request...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Submit Onboarding Request
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
