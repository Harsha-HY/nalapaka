import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Routes where the assistant is available (customer-only)
const ALLOWED_ROUTES = ['/menu', '/cart', '/checkout', '/order-status', '/order-history'];

// Browser Speech API typings (loose)
type SR = any;

export function VoiceAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem, removeItem, items: cartItems } = useCart();
  const { language } = useLanguage();
  const { menuItems } = useMenuItems();
  const { isManager, role } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [thinking, setThinking] = useState(false);

  const recognitionRef = useRef<SR | null>(null);
  const supported = typeof window !== 'undefined' && (
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  // Hide on staff routes / for staff
  const visible =
    !isManager &&
    role !== 'manager' &&
    role !== 'server' &&
    role !== 'kitchen' &&
    role !== 'super_admin' &&
    ALLOWED_ROUTES.some((r) => location.pathname.startsWith(r));

  const speak = useCallback((text: string) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      utter.rate = 1;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('TTS failed', e);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  const findMenuItem = useCallback((q: string) => {
    if (!q) return null;
    const lower = q.toLowerCase().trim();
    // exact
    let m = menuItems.find((i) => i.name.toLowerCase() === lower);
    if (m) return m;
    // contains
    m = menuItems.find((i) => i.name.toLowerCase().includes(lower) || lower.includes(i.name.toLowerCase()));
    if (m) return m;
    // kannada match
    m = menuItems.find((i) => i.nameKn.includes(q));
    return m || null;
  }, [menuItems]);

  const executeAction = useCallback(async (action: any) => {
    const itemNameRaw = action.item_name || '';
    switch (action.action) {
      case 'add_item': {
        const item = findMenuItem(itemNameRaw);
        if (!item) { toast.error(`Couldn't find: ${itemNameRaw}`); return false; }
        if (!item.isAvailable) { toast.error(`${item.name} not available`); return false; }
        const qty = Math.max(1, Number(action.quantity) || 1);
        for (let i = 0; i < qty; i++) addItem(item as any);
        toast.success(`Added ${qty} × ${item.name}`);
        return true;
      }
      case 'remove_item': {
        const item = findMenuItem(itemNameRaw);
        const cartItem = item ? cartItems.find((c) => c.id === item.id) : null;
        if (!cartItem) { toast.error(`${itemNameRaw} not in cart`); return false; }
        removeItem(cartItem.id);
        toast.success(`Removed ${cartItem.name}`);
        return true;
      }
      case 'navigate_menu':
        navigate('/menu');
        return true;
      case 'navigate_cart':
        navigate('/cart');
        return true;
      case 'proceed_order':
        if (cartItems.length === 0) { toast.error('Cart is empty'); return false; }
        navigate('/checkout');
        return true;
      case 'finish_order':
        navigate('/order-status');
        return true;
      case 'unknown':
      default:
        return false;
    }
  }, [addItem, removeItem, cartItems, navigate, findMenuItem]);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setThinking(true);
    setReply('');
    try {
      const { data, error } = await supabase.functions.invoke('voice-intent', { body: { text } });
      if (error) throw error;
      const actions = data?.actions || [];
      let replies: string[] = [];
      for (const a of actions) {
        await executeAction(a);
        if (a.response_text) replies.push(a.response_text);
      }
      const finalReply = replies.join('. ') || (language === 'kn' ? 'ಆಯಿತು' : 'Done');
      setReply(finalReply);
      speak(finalReply);
    } catch (e: any) {
      console.error('Voice intent error', e);
      const msg = language === 'kn' ? 'ಕ್ಷಮಿಸಿ, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : 'Sorry, try again';
      setReply(msg);
      speak(msg);
    } finally {
      setThinking(false);
    }
  }, [executeAction, speak, language]);

  const startListening = useCallback(() => {
    if (!supported) {
      toast.error('Voice not supported on this browser');
      return;
    }
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec: SR = new SpeechRecognition();
      rec.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => { setListening(true); setTranscript(''); setReply(''); };
      rec.onresult = (e: any) => {
        let txt = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          txt += e.results[i][0].transcript;
        }
        setTranscript(txt);
        if (e.results[e.results.length - 1].isFinal) {
          processTranscript(txt);
        }
      };
      rec.onerror = (e: any) => {
        console.warn('STT error', e.error);
        setListening(false);
        if (e.error === 'no-speech') setReply(language === 'kn' ? 'ಕೇಳಿಸಲಿಲ್ಲ' : "I didn't hear anything");
      };
      rec.onend = () => setListening(false);
      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.error('Failed to start STT', e);
      toast.error('Voice failed to start');
    }
  }, [language, supported, processTranscript]);

  useEffect(() => () => stopListening(), [stopListening]);

  if (!visible) return null;

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={() => { setIsOpen(true); setTimeout(startListening, 200); }}
        className={cn(
          'fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-primary to-amber-500 text-primary-foreground',
          'flex items-center justify-center hover:scale-105 transition-transform'
        )}
        aria-label="Voice assistant"
      >
        <Mic className="h-6 w-6" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => { stopListening(); setIsOpen(false); }}
        >
          <div
            className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-6 border border-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="font-bold">
                  {language === 'kn' ? 'ಧ್ವನಿ ಸಹಾಯಕ' : 'Voice Assistant'}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { stopListening(); setIsOpen(false); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-[100px] space-y-3">
              <div className="text-sm text-muted-foreground">
                {language === 'kn'
                  ? 'ಉದಾ: "ಎರಡು ದೋಸೆ ಸೇರಿಸಿ", "ಕಾರ್ಟ್ ತೆರೆಯಿರಿ", "ಆರ್ಡರ್ ಮಾಡಿ"'
                  : 'Try: "Add 2 dosa", "Open cart", "Place my order"'}
              </div>
              {transcript && (
                <div className="bg-muted/50 rounded-xl p-3 text-sm">
                  <span className="text-xs text-muted-foreground">You said:</span>
                  <p className="font-medium mt-1">{transcript}</p>
                </div>
              )}
              {thinking && (
                <div className="text-xs text-muted-foreground animate-pulse">
                  {language === 'kn' ? 'ಯೋಚಿಸುತ್ತಿದೆ…' : 'Thinking…'}
                </div>
              )}
              {reply && (
                <div className="bg-primary/10 rounded-xl p-3 text-sm border border-primary/20">
                  <span className="text-xs text-primary font-semibold">Jarvis:</span>
                  <p className="mt-1">{reply}</p>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={listening ? stopListening : startListening}
                className={cn(
                  'h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-lg',
                  listening
                    ? 'bg-destructive text-destructive-foreground animate-pulse scale-110'
                    : 'bg-gradient-to-br from-primary to-amber-500 text-primary-foreground hover:scale-105'
                )}
              >
                {listening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              {listening
                ? (language === 'kn' ? 'ಕೇಳುತ್ತಿದೆ…' : 'Listening…')
                : (language === 'kn' ? 'ಪ್ರಾರಂಭಿಸಲು ಮೈಕ್ ಒತ್ತಿರಿ' : 'Tap mic to start')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
