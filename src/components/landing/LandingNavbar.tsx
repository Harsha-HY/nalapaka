import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Menu, X, ArrowUpRight, Sparkles, Shield, User, Globe, LogOut, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface LandingNavbarProps {
  onOpenAuthModal?: () => void;
  onOpenScanner?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenAuthModal,
  onOpenScanner,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (role === 'super_admin') return '/dining-hub';
    if (role === 'manager') return '/manager';
    if (role === 'server') return '/server';
    if (role === 'kitchen') return '/kitchen';
    return '/menu';
  };

  const getRoleLabel = () => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'manager') return 'Manager';
    if (role === 'server') return 'Server';
    if (role === 'kitchen') return 'Kitchen';
    return 'Console';
  };

  const navLinks = [
    { name: language === 'kn' ? 'ಅನುಭವ' : 'Experience', href: '#experience' },
    { name: language === 'kn' ? '3D ಸಿಮ್ಯುಲೇಟರ್' : '3D Simulator', href: '#simulator' },
    { name: language === 'kn' ? 'ಮೆನು ಮಾದರಿ' : 'Menu Preview', href: '#menu-sampler' },
    { name: language === 'kn' ? 'ಲಾಭ ಕ್ಯಾಲ್ಕುಲೇಟರ್' : 'ROI Calculator', href: '#roi-calculator' },
    { name: language === 'kn' ? 'ಸಹಯೋಗ (Collab)' : 'Collab with Us', href: '#collab' },
    { name: language === 'kn' ? 'ಪ್ರಶ್ನೋತ್ತರ' : 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF8F5]/90 backdrop-blur-md shadow-sm border-b border-[#E8DFD5]/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B85D36] to-[#8C3E1F] flex items-center justify-center shadow-sm text-white transform transition-transform group-hover:scale-105">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#2B231D] flex items-center gap-1.5 font-serif">
                Nalapaka
                <span className="text-[10px] font-sans font-medium uppercase px-1.5 py-0.5 rounded-full bg-[#EFE8DF] text-[#7A5B44] border border-[#DDD0C2]">
                  DineOS
                </span>
              </span>
              <p className="text-[11px] text-[#7E7369] tracking-wider uppercase font-medium">
                {language === 'kn' ? 'ಆಧುನಿಕ ಊಟದ ತಂತ್ರಜ್ಞಾನ' : 'Modern Dining Suite'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#5C5248] hover:text-[#B85D36] transition-colors relative py-1 group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#B85D36] transition-all duration-200 group-hover:w-full rounded-full" />
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E3D7C9] bg-[#F7F2EB] text-[#554A40] hover:bg-[#EFE7DC] transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#8A7663]" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* If logged in staff: Show direct dashboard button */}
            {user && role && role !== 'customer' ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate(getDashboardPath())}
                  className="bg-[#2D2621] hover:bg-[#40362F] text-white font-medium h-9 text-xs gap-1.5 shadow-xs"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>{getRoleLabel()} Console</span>
                </Button>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-[#7C6E61] hover:text-[#2A211B] rounded-lg hover:bg-[#EFE7DC] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAuthModal}
                className="border-[#D8CAC0] text-[#473E35] hover:bg-[#F2ECE4] hover:text-[#2E2721] font-medium h-9 text-xs gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#887869]" />
                <span>{language === 'kn' ? 'ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್' : 'Staff Sign In'}</span>
              </Button>
            )}

            {/* Live Camera Scanner Button */}
            <Button
              size="sm"
              onClick={onOpenScanner}
              className="bg-[#B85D36] hover:bg-[#9F4D2A] text-white shadow-sm font-medium h-9 px-4 text-xs gap-1.5 transition-all hover:shadow"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{language === 'kn' ? 'ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್' : 'Scan Table QR'}</span>
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="text-xs font-semibold px-2 py-1 rounded border border-[#E3D7C9] bg-[#F7F2EB] text-[#554A40]"
            >
              {language === 'en' ? 'ಕನ್ನಡ' : 'EN'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#4A4036] hover:bg-[#EFE7DC] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-6 px-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFC5] shadow-lg animate-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-[#4C4237] hover:bg-[#F0E8DC] rounded-xl transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-3 border-t border-[#E8DFD5] flex flex-col gap-2">
                {user && role && role !== 'customer' ? (
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(getDashboardPath());
                    }}
                    className="w-full justify-center bg-[#2D2621] text-white h-11"
                  >
                    <Shield className="w-4 h-4 mr-2 text-amber-400" />
                    Open {getRoleLabel()} Dashboard
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="w-full justify-center border-[#D8CAC0] text-[#473E35] h-11"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {language === 'kn' ? 'ಸಿಬ್ಬಂದಿ ಮತ್ತು ಮ್ಯಾನೇಜರ್ ಲಾಗಿನ್' : 'Staff & Manager Sign In'}
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenScanner) onOpenScanner();
                  }}
                  className="w-full justify-center bg-[#B85D36] hover:bg-[#9F4D2A] text-white h-11 gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {language === 'kn' ? 'ಕ್ಯಾಮೆರಾದಿಂದ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Scan Table QR with Camera'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
