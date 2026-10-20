import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Hero3DSection } from '@/components/landing/Hero3DSection';
import { InteractiveTableSimulator } from '@/components/landing/InteractiveTableSimulator';
import { PillarsSection } from '@/components/landing/PillarsSection';
import { MenuSamplerSection } from '@/components/landing/MenuSamplerSection';
import { RoiCalculator } from '@/components/landing/RoiCalculator';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { FooterLanding } from '@/components/landing/FooterLanding';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2B231D] selection:bg-[#B85D36]/20 selection:text-[#B85D36] font-sans antialiased">
      {/* Top Floating Glass Navigation */}
      <LandingNavbar />

      <main>
        {/* 3D Atmospheric Hero with Interactive Device Simulator */}
        <div id="experience">
          <Hero3DSection />
        </div>

        {/* 3D Floor Plan & Table Intelligence Simulator */}
        <InteractiveTableSimulator />

        {/* 4 Ecosystem Pillars (Guest, Kitchen KDS, Server, Manager) */}
        <PillarsSection />

        {/* Digital Culinary Sampler with 3D Tilt Cards */}
        <MenuSamplerSection />

        {/* Restaurant Economics & ROI Calculator */}
        <RoiCalculator />

        {/* Verified Restauarant Testimonials & Metrics */}
        <TestimonialsSection />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Earthy Footer */}
      <FooterLanding />
    </div>
  );
};

export default Index;
