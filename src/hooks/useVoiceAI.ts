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
  customer_name?: string;
  phone_number?: string;
}

interface VoiceCheckoutPatch {
  customer_name?: string;
  phone_number?: string;
  order_type?: 'dine-in' | 'parcel';
  table_number?: string;
  seat_blocks?: string[];
}

const CHECKOUT_PATCH_EVENT = 'voice-checkout-patch';

export function useVoiceAI() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const processingRef = useRef(false);
  const queuedTranscriptRef = useRef<string | null>(null);
  const isListeningRef = useRef(false);
  const lastHandledRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const lastCommandAtRef = useRef(Date.now());
  const idlePromptedRef = useRef(false);

  const navigate = useNavigate();
  const { addItem, removeItem, items } = useCart();

  const emitCheckoutPatch = useCallback((patch: VoiceCheckoutPatch) => {
    window.dispatchEvent(new CustomEvent(CHECKOUT_PATCH_EVENT, { detail: patch }));
  }, []);

  const checkItemAvailability = useCallback(async (itemName: string) => {
    const lower = itemName.toLowerCase().trim();
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, name_kn, price, is_available, category')
      .eq('is_available', true);

    if (!data || data.length === 0) return null;

    let match = data.find((m) => m.name.toLowerCase() === lower);
    if (!match) match = data.find((m) => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()));
    if (!match) {
      const words = lower.split(' ');
      match = data.find((m) => {
        const mWords = m.name.toLowerCase().split(' ');
        return words.some((w) => w.length > 2 && mWords.some((mw) => mw.includes(w)));
      });
    }

    return match || null;
  }, []);

  const checkTableLocked = useCallback(async (tableNumber: string) => {
    const normalized = tableNumber.trim();
    if (!normalized) return false;

    const { data, error } = await supabase
      .from('locked_seats')
      .select('seat')
      .eq('table_number', normalized);

    if (error) return false;
    return (data?.length || 0) >= 4;
  }, []);

  const speak = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.7;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang === 'en-IN' && /female|zira|aria|samantha/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en-IN')) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, []);

  const removeItemByVoice = useCallback((itemName: string) => {
    const target = itemName.toLowerCase().trim();
    const cartItem = items.find((i) => i.name.toLowerCase() === target)
      || items.find((i) => i.name.toLowerCase().includes(target) || target.includes(i.name.toLowerCase()))
      || items.find((i) => {
        const words = target.split(' ');
        const cartWords = i.name.toLowerCase().split(' ');
        return words.some((w) => w.length > 2 && cartWords.some((cw) => cw.includes(w)));
      });

    if (cartItem) {
      removeItem(cartItem.id);
      speak('Item removed.');
      toast.success(`Removed ${cartItem.name}`);
      return;
    }

    speak('Item not found in cart.');
    toast.error(`Not in cart: ${itemName}`);
  }, [items, removeItem, speak]);

  const executeAction = useCallback(async (action: VoiceAction, sourceText: string) => {
    switch (action.action) {
      case 'set_customer_name': {
        const value = action.customer_name || action.item_name || '';
        if (value.trim()) {
          emitCheckoutPatch({ customer_name: value.trim() });
          toast.success('Name filled');
        }
        break;
      }

      case 'set_phone_number': {
        const raw = action.phone_number || action.item_name || '';
        const digits = raw.replace(/\D/g, '').slice(-10);
        if (digits.length === 10) {
          emitCheckoutPatch({ phone_number: digits });
          toast.success('Phone number filled');
        }
        break;
      }

      case 'set_order_type': {
        const value = (action.dining_type || '').toLowerCase();
        if (value === 'dine-in' || value === 'parcel') {
          emitCheckoutPatch({ order_type: value });
          toast.success(`Order type set to ${value}`);
        }
        break;
      }

      case 'add_item': {
        const item = await checkItemAvailability(action.item_name);
        if (!item) {
          speak('Sorry, this item is currently not available.');
          toast.error(`Not available: ${action.item_name}`);
          return;
        }

        const cartItem = {
          id: item.id,
          name: item.name,
          nameKn: item.name_kn,
          price: Number(item.price),
          category: item.category as any,
          timeSlot: 'all' as const,
        };

        for (let i = 0; i < (action.quantity || 1); i++) addItem(cartItem);

        speak(action.response_text || `Your order has been added.`);
        toast.success(`Added ${action.quantity || 1}x ${item.name}`);

        if (action.dining_type === 'dine-in' || action.dining_type === 'parcel') {
          emitCheckoutPatch({ order_type: action.dining_type });
        }
        break;
      }

      case 'remove_item': {
        removeItemByVoice(action.item_name);
        break;
      }

      case 'select_table': {
        const table = action.table_number?.trim();
        if (!table) return;

        const isLocked = await checkTableLocked(table);
        if (isLocked) {
          speak('This table is currently fixed. Please contact the manager.');
          toast.error(`Table ${table} is locked`);
          return;
        }

        emitCheckoutPatch({ table_number: table, order_type: 'dine-in' });
        toast.success(`Table ${table} selected`);
        break;
      }

      case 'select_seat':
      case 'select_block': {
        const seats = (action.seat_blocks || []).map((s) => s.toUpperCase()).filter(Boolean);
        if (seats.length) {
          emitCheckoutPatch({ seat_blocks: seats, order_type: 'dine-in' });
          toast.success(`Seat ${seats.join(', ')} selected`);
        }
        break;
      }

      case 'navigate_menu':
        navigate('/menu');
        break;

      case 'navigate_cart':
        navigate('/cart');
        break;

      case 'proceed_order':
        navigate('/checkout');
        break;

      case 'pay_cash':
      case 'pay_online':
        navigate('/order-status');
        speak(action.response_text || 'Please proceed with payment.');
        break;

      case 'finish_order':
        navigate('/order-status');
        speak(action.response_text || 'Order completed.');
        break;

      case 'unknown': {
        if (sourceText.trim().split(/\s+/).length >= 3) {
          speak(action.response_text || "Sorry, I didn't understand. Please try again.");
        }
        break;
      }

      default:
        break;
    }
  }, [addItem, checkItemAvailability, checkTableLocked, emitCheckoutPatch, navigate, removeItemByVoice, speak]);

  const processTranscript = useCallback(async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const now = Date.now();
    if (
      lastHandledRef.current.text.toLowerCase() === cleanText.toLowerCase()
      && now - lastHandledRef.current.at < 1800
    ) {
      return;
    }

    if (processingRef.current) {
      queuedTranscriptRef.current = cleanText;
      return;
    }

    lastHandledRef.current = { text: cleanText, at: now };
    processingRef.current = true;
    setIsProcessing(true);
    setTranscript(cleanText);
    lastCommandAtRef.current = now;
    idlePromptedRef.current = false;

    try {
      const { data, error } = await supabase.functions.invoke('voice-intent', {
        body: { text: cleanText },
      });

      if (error) {
        console.error('Voice intent error:', error);
        speak('Sorry, there was an error. Please try again.');
        return;
      }

      const actions: VoiceAction[] = data?.actions || [];
      for (const action of actions) {
        await executeAction(action, cleanText);
        if (actions.length > 1) await new Promise((r) => setTimeout(r, 250));
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      speak('Sorry, something went wrong.');
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      setTimeout(() => setTranscript(''), 2000);

      const queued = queuedTranscriptRef.current;
      queuedTranscriptRef.current = null;
      if (queued) {
        void processTranscript(queued);
      }
    }
  }, [executeAction, speak]);

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isListeningRef.current) return;
    try {
      recognition.start();
    } catch {
      // ignore start races
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result?.isFinal) continue;

          const confidence = result[0]?.confidence ?? 1;
          const text = result[0]?.transcript?.trim() || '';
          if (!text) continue;

          if (confidence < 0.4 && text.split(/\s+/).length < 2) {
            continue;
          }

          void processTranscript(text);
        }
      };

      recognition.onerror = (event: any) => {
        if (!isListeningRef.current) return;
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied');
          return;
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error(`Mic error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (!isListeningRef.current) return;
        setTimeout(() => {
          startRecognition();
        }, 200);
      };

      recognitionRef.current = recognition;
    }

    isListeningRef.current = true;
    setIsListening(true);
    lastCommandAtRef.current = Date.now();
    idlePromptedRef.current = false;
    startRecognition();
    toast.success('🎤 Voice AI active');
  }, [processTranscript, startRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;

    const ref = recognitionRef.current;
    if (ref) {
      ref.onend = null;
      ref.onerror = null;
      try {
        ref.stop();
      } catch {
        // ignore
      }
    }

    setIsListening(false);
    setIsProcessing(false);
    processingRef.current = false;
    queuedTranscriptRef.current = null;
    setTranscript('');
    window.speechSynthesis?.cancel();
  }, []);

  const toggleListening = useCallback(() => {
    isListening ? stopListening() : startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isListeningRef.current || isProcessing) return;

      const silentFor = Date.now() - lastCommandAtRef.current;
      if (!idlePromptedRef.current && silentFor >= 60000) {
        speak('Would you like to proceed?');
        idlePromptedRef.current = true;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isProcessing, speak]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      if (ref) {
        ref.onend = null;
        ref.onerror = null;
        try {
          ref.stop();
        } catch {
          // ignore
        }
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { isListening, isProcessing, transcript, toggleListening, startListening, stopListening };
}
