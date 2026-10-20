import React, { useState } from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Hero3DSection } from '@/components/landing/Hero3DSection';
import { InteractiveTableSimulator } from '@/components/landing/InteractiveTableSimulator';
import { PillarsSection } from '@/components/landing/PillarsSection';
import { MenuSamplerSection } from '@/components/landing/MenuSamplerSection';
import { RoiCalculator } from '@/components/landing/RoiCalculator';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { FooterLanding } from '@/components/landing/FooterLanding';
import { StaffAuthModal } from '@/components/landing/StaffAuthModal';
import { TableCameraScanner } from '@/components/landing/TableCameraScanner';
import { HotelOnboardingModal } from '@/components/landing/HotelOnboardingModal';
import { Camera, QrCode, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Index: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2B231D] selection:bg-[#B85D36]/20 selection:text-[#B85D36] font-sans antialiased">
      {/* Top Floating Glass Navigation */}
      <LandingNavbar 
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenScanner={() => setScannerModalOpen(true)}
      />

      <main>
        {/* 3D Atmospheric Hero with Video & 3D Depth Particles & Auto-rotating Role Views */}
        <div id="experience">
          <Hero3DSection 
            onOpenScanner={() => setScannerModalOpen(true)}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        </div>

        {/* Embedded Camera Table QR Scanner Section */}
        <section id="scanner-section" className="py-16 bg-[#F4EDE3] border-y border-[#E6D9CA] relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAE0D3] border border-[#D8C7B6] text-[#71543D] text-xs font-semibold uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5 text-[#B85D36]" />
              <span>Table Camera Scanner</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#2B231D]">
              {language === 'kn' ? 'ನೇರವಾಗಿ ಟೇಬಲ್ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Seated at a Table? Scan to Open Menu'}
            </h2>
            <p className="text-xs sm:text-sm text-[#665B50] max-w-lg mx-auto leading-relaxed">
              {language === 'kn'
                ? 'ಕ್ಯಾಮೆರಾವನ್ನು ನಿಮ್ಮ ಟೇಬಲ್ ಮೇಲಿರುವ QR ಸ್ಟಿಕ್ಕರ್‌ಗೆ ತೋರಿಸಿ. ಯಾವುದೇ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಇಲ್ಲದೆ ಕ್ಷಣಾರ್ಧದಲ್ಲಿ ಮೆನು ತೆರೆಯುತ್ತದೆ.'
                : 'Aim your camera at the QR code disc on your table. It will automatically detect your hotel and table number and take you straight to your dining session.'}
            </p>
          </div>

          <div className="max-w-xl mx-auto px-4">
            <TableCameraScanner inline={true} />
          </div>
        </section>

        {/* 3D Floor Plan & Table Intelligence Simulator */}
        <InteractiveTableSimulator />

        {/* 4 Ecosystem Perspectives (Guest, Kitchen KDS, Server, Manager) */}
        <PillarsSection />

        {/* Digital Culinary Showcase (Browse only, orders activated via Table QR) */}
        <MenuSamplerSection 
          onOpenScanner={() => setScannerModalOpen(true)}
        />

        {/* Restaurant Economics & ROI Calculator with Onboarding Request Trigger */}
        <RoiCalculator 
          onOpenOnboarding={() => setOnboardingOpen(true)}
        />

        {/* Verified Restaurant Testimonials & Metrics */}
        <TestimonialsSection />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Earthy Footer */}
      <FooterLanding />

      {/* Pop-up Staff & Manager Authentication Modal */}
      <StaffAuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* Modal Camera Scanner (when triggered from top navbar or floating buttons) */}
      <TableCameraScanner 
        isOpen={scannerModalOpen} 
        onClose={() => setScannerModalOpen(false)} 
        inline={false} 
      />

      {/* Restaurant Onboarding Request Modal */}
      <HotelOnboardingModal 
        isOpen={onboardingOpen} 
        onClose={() => setOnboardingOpen(false)} 
      />
    </div>
  );
};

export default Index;
