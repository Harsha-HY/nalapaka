import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, role, user, isLoading, roleLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // STRICT role-based redirect - waits for role to be loaded
  useEffect(() => {
    if (user && role && !roleLoading) {
      console.log('Redirecting based on role:', role);
      
      // STRICT REDIRECT RULES - NO FALLBACK
      if (role === 'manager') {
        navigate('/manager', { replace: true });
      } else if (role === 'server') {
        navigate('/server', { replace: true });
      } else {
        // Customer or any other role
        navigate('/menu', { replace: true });
      }
    }
  }, [user, role, roleLoading, navigate]);

  // Show loading while checking existing session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while role is being fetched after login
  if (user && roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-2">Verifying account...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login')) {
          setError(t('wrongPassword'));
        } else if (error.message.includes('Email not confirmed')) {
          // This should not happen since we auto-confirm
          setError('Account not verified. Please contact manager.');
        } else {
          setError(error.message);
        }
        setIsSubmitting(false);
      }
      // Navigation will happen via useEffect when role is set
    } catch (err) {
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 flex justify-end">
        <LanguageToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Restaurant name */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-2">{t('welcome')}</p>
          <h1 className="text-4xl font-bold text-primary">Nalapaka</h1>
          <p className="text-lg text-muted-foreground">Nanjangud</p>
        </div>

        {/* Auth card - LOGIN ONLY */}
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('login')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-12 text-base"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('login')
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('forgotPassword')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Contact manager for account access
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
