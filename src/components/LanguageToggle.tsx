import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
      className="font-medium"
    >
      {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
    </Button>
  );
}
