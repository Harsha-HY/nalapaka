import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FaqItem {
  question: string;
  kannadaQuestion: string;
  answer: string;
  kannadaAnswer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'Do customers need to download an app or create an account to order?',
    kannadaQuestion: 'ಗ್ರಾಹಕರು ಆರ್ಡರ್ ಮಾಡಲು ಯಾವುದೇ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕೆ?',
    answer:
      'Never. Diners simply scan the QR code located on their dining table using their phone camera. The full interactive menu opens instantly in Safari, Chrome, or any mobile browser without any account sign-up.',
    kannadaAnswer:
      'ಖಂಡಿತ ಇಲ್ಲ! ಅತಿಥಿಗಳು ತಮ್ಮ ಮೊಬೈಲ್ ಕ್ಯಾಮೆರಾದಿಂದ ಟೇಬಲ್ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದರೆ ಸಾಕು. ಯಾವುದೇ ಆಪ್ ಅಥವಾ ಸೈನ್-ಅಪ್ ಇಲ್ಲದೆ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮೆನು ತೆರೆಯುತ್ತದೆ.',
  },
  {
    question: 'What hardware is required in our restaurant kitchen and floor?',
    kannadaQuestion: 'ಅಡುಗೆಮನೆ ಮತ್ತು ಹೋಟೆಲ್‌ನಲ್ಲಿ ಯಾವ ಸಲಕರಣೆಗಳು ಬೇಕು?',
    answer:
      'Nalapaka DineOS runs on standard consumer devices you already own: Android tablets, iPads, existing desktop PCs, or smartphones. There is zero requirement for costly proprietary POS hardware or vendor lock-in.',
    kannadaAnswer:
      'ನೀವು ಈಗಾಗಲೇ ಹೊಂದಿರುವ ಯಾವುದೇ ಸ್ಮಾರ್ಟ್‌ಫೋನ್, ಆಂಡ್ರಾಯ್ಡ್ ಟ್ಯಾಬ್ಲೆಟ್, ಐಪ್ಯಾಡ್ ಅಥವಾ ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿ ಇದು ಸುಲಭವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.',
  },
  {
    question: 'How does the bilingual Kannada & English system operate?',
    kannadaQuestion: 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ಭಾಷಾ ವ್ಯವಸ್ಥೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
    answer:
      'Our engine includes native Kannada translation for every dish title, ingredient note, preparation detail, and bill item. Guests can switch languages with a single tap at any point in their ordering journey.',
    kannadaAnswer:
      'ಪ್ರತಿಯೊಂದು ಖಾದ್ಯದ ಹೆಸರು, ವಿವರಣೆ ಮತ್ತು ಬೆಲೆಯನ್ನು ಅತಿಥಿಗಳು ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ವೀಕ್ಷಿಸಬಹುದು.',
  },
  {
    question: 'Can multi-location restaurant chains be managed from one account?',
    kannadaQuestion: 'ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಹೋಟೆಲ್ ಬ್ರಾಂಚ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಬಹುದೇ?',
    answer:
      'Yes! Through the Super Admin Dining Hub, owners can seamlessly monitor sales across multiple hotel branches, compare branch sales velocity, manage manager logins, and update menus centrally.',
    kannadaAnswer:
      'ಹೌದು, ಸೂಪರ್ ಅಡ್ಮಿನ್ ಪೋರ್ಟಲ್ ಮೂಲಕ ಮಾಲೀಕರು ತಮ್ಮ ಎಲ್ಲಾ ನಗರಗಳ ಹೋಟೆಲ್ ಶಾಖೆಗಳ ವ್ಯವಹಾರ ಮತ್ತು ಸಿಬ್ಬಂದಿಯನ್ನು ಒಂದೇ ಸ್ಥಳದಿಂದ ನಿರ್ವಹಿಸಬಹುದು.',
  },
  {
    question: 'How fast can our restaurant get started and go live?',
    kannadaQuestion: 'ನಮ್ಮ ಹೋಟೆಲ್‌ನಲ್ಲಿ ಇದನ್ನು ಪ್ರಾರಂಭಿಸಲು ಎಷ್ಟು ಸಮಯ ಬೇಕು?',
    answer:
      'Under 15 minutes. Create your account, input your dishes and prices, download the auto-generated high-resolution QR discs for your tables, print them out, and you are ready to seat diners.',
    kannadaAnswer:
      'ಕೇವಲ 15 ನಿಮಿಷಗಳಲ್ಲಿ. ನಿಮ್ಮ ಮೆನು ದಾಖಲಿಸಿ, ಟೇಬಲ್ QR ಕೋಡ್‌ಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಪ್ರಿಂಟ್ ಹಾಕಿದರೆ ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಡೈನಿಂಗ್ ಸಿದ್ಧ.',
  },
];

export const FaqSection: React.FC = () => {
  const { language } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6DC] text-[#71543D] text-xs font-semibold tracking-wide uppercase">
            <HelpCircle className="w-3.5 h-3.5 text-[#B85D36]" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2A211B] font-serif">
            {language === 'kn' ? 'ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಉತ್ತರಗಳು' : 'Everything You Need to Know'}
          </h2>
          <p className="text-sm sm:text-base text-[#655A4F] leading-relaxed">
            {language === 'kn'
              ? 'ಹೋಟೆಲ್ ಮಾಲೀಕರು ಮತ್ತು ಅತಿಥಿಗಳು ಸಾಮಾನ್ಯವಾಗಿ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು.'
              : 'Clear answers about table QR ordering, hardware compatibility, and deployment.'}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#E3D7C9] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-[#2B221B]">
                    {language === 'kn' ? faq.kannadaQuestion : faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-[#F5EEE4] flex items-center justify-center text-[#58483B] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 bg-[#B85D36] text-white' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#5C5044] leading-relaxed border-t border-[#F1E8DD] pt-4 animate-in fade-in duration-200">
                    {language === 'kn' ? faq.kannadaAnswer : faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
