import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowUpRight, Heart, Shield, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const FooterLanding: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <footer className="bg-[#241E1A] text-[#EDE7E0] border-t border-[#3B322A] pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#3B322A]">
          
          {/* Brand & Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B85D36] text-white flex items-center justify-center font-bold">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white font-serif">
                  Nalapaka
                </span>
                <span className="text-xs text-[#B5A594] ml-2 tracking-wider uppercase font-semibold">
                  DineOS
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#A89887] leading-relaxed max-w-sm">
              {language === 'kn'
                ? 'ಸಾಂಪ್ರದಾಯಿಕ ಆತಿಥ್ಯ ಮತ್ತು ಆಧುನಿಕ ತಂತ್ರಜ್ಞಾನದ ಸುಂದರ ಸಂಗಮ. ಟೇಬಲ್ QR ಆರ್ಡರ್, ಅಡುಗೆಮನೆ ಡಿಸ್ಪ್ಲೇ, ಮತ್ತು ಪೂರ್ಣ ಹೋಟೆಲ್ ನಿಯಂತ್ರಣ.'
                : 'Where traditional hospitality meets modern understated intelligence. Frictionless table-side QR ordering, synchronized kitchen displays, and live restaurant analytics.'}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-[#9B8B7B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Engineered for Authentic Dining Rooms</span>
            </div>
          </div>

          {/* Guest Experience Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Guest Experience
            </h4>
            <ul className="space-y-2 text-xs text-[#A89887]">
              <li>
                <Link to="/guest" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Guest Table Entry</span>
                  <ArrowUpRight className="w-3 h-3 text-[#B85D36]" />
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-white transition-colors">
                  Digital Menu Page
                </Link>
              </li>
              <li>
                <Link to="/order-status" className="hover:text-white transition-colors">
                  Live Order Tracker
                </Link>
              </li>
              <li>
                <a href="#simulator" className="hover:text-white transition-colors">
                  3D Table Simulator
                </a>
              </li>
            </ul>
          </div>

          {/* Staff & Kitchen Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Staff Portals
            </h4>
            <ul className="space-y-2 text-xs text-[#A89887]">
              <li>
                <Link to="/auth" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Staff & Manager Sign In</span>
                  <ArrowUpRight className="w-3 h-3 text-[#B85D36]" />
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Kitchen KDS Display
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Server Dispatch Console
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Super Admin Dining Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Info & Heritage */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Heritage
            </h4>
            <p className="text-xs text-[#A89887] leading-relaxed">
              Rooted in the royal culinary traditions of Karnataka — Nanjangud, Mysore, and Bengaluru.
            </p>
            <div className="pt-2 text-xs text-[#B85D36] font-semibold">
              Bilingual English & ಕನ್ನಡ
            </div>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F7F70]">
          <p>© {new Date().getFullYear()} Nalapaka Restaurant Suite. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[#8F7F70]">
            <span>Crafted with calm care for memorable dining</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
