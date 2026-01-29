import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { UtensilsCrossed, ChefHat, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const Index = () => {
  const navigate = useNavigate();
  const { user, isManager, isLoading } = useAuth();
  const { language } = useLanguage();

  // Auto-redirect authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      if (isManager) {
        navigate('/manager');
      } else {
        navigate('/menu');
      }
    }
  }, [user, isManager, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <UtensilsCrossed className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Language toggle in corner */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md mx-auto text-center space-y-8 animate-fade-in">
          {/* Logo / Brand */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
              <UtensilsCrossed className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Nalapaka
            </h1>
            <p className="text-lg text-muted-foreground">
              Nanjangud
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <p className="text-xl text-foreground/80">
              {language === 'kn' 
                ? 'ಸ್ವಾದಿಷ್ಟ ಊಟದ ಅನುಭವ' 
                : 'A Delicious Dining Experience'}
            </p>
            <p className="text-muted-foreground">
              {language === 'kn'
                ? 'ನಿಮ್ಮ ಮೇಜಿನಿಂದ ನೇರವಾಗಿ ಆರ್ಡರ್ ಮಾಡಿ'
                : 'Order directly from your table'}
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-border" />
            <ChefHat className="h-5 w-5 text-muted-foreground" />
            <div className="h-px w-12 bg-border" />
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-medium shadow-soft hover:shadow-elevated transition-all"
              onClick={() => navigate('/auth')}
            >
              {language === 'kn' ? 'ಮುಂದುವರಿಸಿ' : 'Continue'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-xs text-muted-foreground">
              {language === 'kn' 
                ? 'ಆರ್ಡರ್ ಮಾಡಲು ಲಾಗಿನ್ ಮಾಡಿ' 
                : 'Login to place your order'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Nalapaka Restaurant
        </p>
      </footer>
    </div>
  );
};

export default Index;
