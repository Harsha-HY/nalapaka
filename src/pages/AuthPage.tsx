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

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp, role, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Redirect based on role when user is authenticated
  useEffect(() => {
    if (user && role) {
      if (role === 'manager') {
        navigate('/manager');
      } else if (role === 'server') {
        navigate('/server');
      } else {
        navigate('/menu');
      }
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError(t('passwordMismatch'));
          setIsSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        }
        // Navigation will happen via useEffect when role is set
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            setError(t('wrongPassword'));
          } else {
            setError(error.message);
          }
        }
        // Navigation will happen via useEffect when role is set
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
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

        {/* Auth card */}
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === 'login' ? t('login') : t('createAccount')}
            </CardTitle>
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
                />
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-12 text-base"
                  />
                </div>
              )}

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
                ) : mode === 'login' ? (
                  t('login')
                ) : (
                  t('createAccount')
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'login' ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('forgotPassword')}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                  >
                    {t('createAccount')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="link"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                >
                  {t('login')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
