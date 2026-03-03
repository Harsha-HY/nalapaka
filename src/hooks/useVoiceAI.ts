import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceAction {
  action: string;
  item_name: string;
  quantity: number;
  table_number: string;
  seat_blocks: string[];
  dining_type: string;
  response_text: string;
}

export function useVoiceAI() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const processingRef = useRef(false);
  const navigate = useNavigate();
  const { addItem, removeItem, items } = useCart();

  // Check item availability from database
  const checkItemAvailability = useCallback(async (itemName: string) => {
    const lower = itemName.toLowerCase().trim();
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, name_kn, price, is_available, category')
      .eq('is_available', true);
    
    if (!data || data.length === 0) return null;
    
    // Fuzzy match
    let match = data.find(m => m.name.toLowerCase() === lower);
    if (!match) match = data.find(m => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()));
    if (!match) {
      const words = lower.split(' ');
      match = data.find(m => {
        const mWords = m.name.toLowerCase().split(' ');
        return words.some(w => w.length > 2 && mWords.some(mw => mw.includes(w)));
      });
    }
    return match || null;
  }, []);

  // Speak with soft, friendly voice
  const speak = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.7;
    // Try to pick a softer voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en-IN'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Execute a single action
  const executeAction = useCallback(async (action: VoiceAction) => {
    switch (action.action) {
      case 'add_item': {
        const item = await checkItemAvailability(action.item_name);
        if (item) {
          const cartItem = { id: item.id, name: item.name, nameKn: item.name_kn, price: Number(item.price), category: item.category as any, timeSlot: 'all' as const };
          for (let i = 0; i < (action.quantity || 1); i++) {
            addItem(cartItem);
          }
          speak(action.response_text || `Added ${action.quantity || 1} ${item.name}`);
          toast.success(`Added ${action.quantity || 1}x ${item.name}`);
        } else {
          speak(`Sorry, ${action.item_name} is currently not available.`);
          toast.error(`Not available: ${action.item_name}`);
        }
        break;
      }
      case 'remove_item': {
        const cartItem = items.find(i =>
          i.name.toLowerCase().includes(action.item_name.toLowerCase()) ||
          action.item_name.toLowerCase().includes(i.name.toLowerCase())
        );
        if (cartItem) {
          removeItem(cartItem.id);
          speak(action.response_text || `Removed ${cartItem.name}`);
          toast.success(`Removed ${cartItem.name}`);
        } else {
          speak(`${action.item_name} is not in your cart.`);
          toast.error(`Not in cart: ${action.item_name}`);
        }
        break;
      }
      case 'navigate_menu':
        navigate('/menu');
        speak(action.response_text || 'Opening menu');
        break;
      case 'navigate_cart':
        navigate('/cart');
        speak(action.response_text || 'Opening your cart');
        break;
      case 'proceed_order':
        navigate('/checkout');
        speak(action.response_text || 'Opening checkout');
        break;
      case 'pay_cash':
      case 'pay_online':
        navigate('/order-status');
        speak(action.response_text || 'Please proceed with payment.');
        break;
      case 'finish_order':
        navigate('/order-status');
        speak(action.response_text || 'Navigating to order status');
        break;
      case 'select_table':
      case 'select_seat':
        speak(action.response_text || 'Noted. Please confirm during checkout.');
        toast.info(action.response_text || 'Table/seat selection noted');
        break;
      case 'unknown':
        speak(action.response_text || "Sorry, I didn't understand. Please try again.");
        break;
      default:
        break;
    }
  }, [checkItemAvailability, addItem, removeItem, items, navigate, speak]);

  // Process transcript through AI
  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim() || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setTranscript(text);

    try {
      const { data, error } = await supabase.functions.invoke('voice-intent', {
        body: { text },
      });

      if (error) {
        console.error('Voice intent error:', error);
        speak('Sorry, there was an error. Please try again.');
        return;
      }

      const actions: VoiceAction[] = data?.actions || [];
      for (const action of actions) {
        await executeAction(action);
        if (actions.length > 1) await new Promise(r => setTimeout(r, 400));
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      speak('Sorry, something went wrong.');
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      setTimeout(() => setTranscript(''), 2000);
    }
  }, [executeAction, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const result = event.results[0]?.[0]?.transcript || '';
      if (result.trim()) {
        processTranscript(result.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error('Mic error: ' + event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart for next command if still listening and not processing
      if (recognitionRef.current && !processingRef.current) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch {}
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
    setIsListening(true);
    toast.success('🎤 Voice AI active');
  }, [processTranscript]);

  const stopListening = useCallback(() => {
    const ref = recognitionRef.current;
    recognitionRef.current = null;
    if (ref) {
      ref.onend = null;
      ref.onerror = null;
      try { ref.stop(); } catch {}
    }
    setIsListening(false);
    setTranscript('');
    window.speechSynthesis?.cancel();
  }, []);

  const toggleListening = useCallback(() => {
    isListening ? stopListening() : startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      if (ref) { ref.onend = null; try { ref.stop(); } catch {} }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { isListening, isProcessing, transcript, toggleListening, startListening, stopListening };
}
