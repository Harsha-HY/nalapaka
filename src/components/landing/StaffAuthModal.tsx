import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, Loader2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, role } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        if (signInError.message.includes('Invalid login')) {
          setError('Invalid email or password');
        } else {
          setError(signInError.message);
        }
        setIsSubmitting(false);
        return;
      }

      // Login success: let AuthContext redirect or route based on role
      onClose();
      // Small timeout to allow AuthContext role state to sync
      setTimeout(() => {
        const storedRole = localStorage.getItem('dh_role_cache_v1');
        let parsedRole = '';
        try {
          parsedRole = JSON.parse(storedRole || '{}')?.role;
        } catch {}

        if (parsedRole === 'super_admin') navigate('/dining-hub');
        else if (parsedRole === 'manager') navigate('/manager');
        else if (parsedRole === 'server') navigate('/server');
        else if (parsedRole === 'kitchen') navigate('/kitchen');
        else navigate('/manager');
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#DFCFC0] shadow-2xl p-6 sm:p-8 overflow-hidden text-[#2B231D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warm decorative background blur */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 bg-[#E9D5BD]/40 rounded-full blur-2xl -z-10"
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7B6E60] hover:text-[#2B231D] hover:bg-[#EFE7DC] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE6DC] border border-[#DDD0C1] text-[#71543D] text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B85D36]" />
            <span>Authorized Staff Only</span>
          </div>
          <h3 className="text-2xl font-bold font-serif text-[#2B231D]">
            {language === 'kn' ? 'ಸಿಬ್ಬಂದಿ ಮತ್ತು ಮ್ಯಾನೇಜರ್ ಲಾಗಿನ್' : 'Staff & Manager Sign In'}
          </h3>
          <p className="text-xs sm:text-sm text-[#6A5E53] leading-relaxed">
            {language === 'kn'
              ? 'ನಿಮ್ಮ ಹುದ್ದೆಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಲಾಗಿನ್ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.'
              : 'Sign in to access your hotel management, kitchen display (KDS), or server dispatch consoles.'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-modal-email" className="text-xs font-semibold text-[#44382D]">
              Staff Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
              <Input
                id="staff-modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@hotel.com"
                required
                className="pl-10 h-11 bg-white border-[#D9CABE] text-sm text-[#2B231D] focus:border-[#B85D36] focus:ring-[#B85D36]"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-modal-password" className="text-xs font-semibold text-[#44382D]">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
              <Input
                id="staff-modal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="pl-10 h-11 bg-white border-[#D9CABE] text-sm text-[#2B231D] focus:border-[#B85D36] focus:ring-[#B85D36]"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#B85D36] hover:bg-[#9F4D2A] text-white font-semibold text-sm rounded-xl shadow-sm transition-all mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Sign In to Console
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#E8DDD0] text-center text-xs text-[#7A6D61]">
          <span>Need staff account access? Contact your restaurant administrator.</span>
        </div>
      </div>
    </div>
  );
};
