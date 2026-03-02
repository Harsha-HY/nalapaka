import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { menuItems } from '@/data/menuData';
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
  const navigate = useNavigate();
  const { addItem, removeItem, items } = useCart();

  // Find menu item by fuzzy name match
  const findMenuItem = useCallback((name: string) => {
    const lower = name.toLowerCase().trim();
    let match = menuItems.find(m => m.name.toLowerCase() === lower);
    if (match) return match;
    match = menuItems.find(m => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()));
    if (match) return match;
    const words = lower.split(' ');
    match = menuItems.find(m => {
      const mWords = m.name.toLowerCase().split(' ');
      return words.some(w => mWords.some(mw => mw.includes(w) && w.length > 2));
    });
    return match || null;
  }, []);

  // Speak response using SpeechSynthesis
  const speak = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Execute a single action
  const executeAction = useCallback(async (action: VoiceAction) => {
    switch (action.action) {
      case 'add_item': {
        const item = findMenuItem(action.item_name);
        if (item) {
          for (let i = 0; i < (action.quantity || 1); i++) {
            addItem(item);
          }
          speak(action.response_text || `Added ${action.quantity || 1} ${item.name}`);
          toast.success(`Added ${action.quantity || 1}x ${item.name}`);
        } else {
          speak(`Sorry, ${action.item_name} is not available on the menu.`);
          toast.error(`Item not found: ${action.item_name}`);
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
        speak(action.response_text || 'Opening cart');
        break;
      case 'proceed_order':
        navigate('/checkout');
        speak(action.response_text || 'Opening checkout');
        break;
      case 'pay_cash':
      case 'pay_online':
        speak(action.response_text || 'Please proceed with payment on the order status page.');
        navigate('/order-status');
        break;
      case 'finish_order':
        navigate('/order-status');
        speak(action.response_text || 'Navigating to order status');
        break;
      case 'select_table':
      case 'select_seat':
        speak(action.response_text || 'Noted. Please confirm during checkout.');
        toast.info(action.response_text || `Table/seat selection noted`);
        break;
      case 'unknown':
        speak(action.response_text || "Sorry, I didn't understand. Please try again.");
        toast.error(action.response_text || "Didn't understand command");
        break;
      default:
        break;
    }
  }, [findMenuItem, addItem, removeItem, items, navigate, speak]);

  // Process transcript through AI
  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setTranscript(text);

    try {
      const { data, error } = await supabase.functions.invoke('voice-intent', {
        body: { text },
      });

      if (error) {
        console.error('Voice intent error:', error);
        speak('Sorry, there was an error processing your request.');
        toast.error('Voice processing failed');
        return;
      }

      const actions: VoiceAction[] = data?.actions || [];
      
      for (const action of actions) {
        await executeAction(action);
        if (actions.length > 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      speak('Sorry, something went wrong.');
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  }, [executeAction, speak]);

  // Start listening - single shot mode (no continuous, no duplication)
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Single utterance only
    recognition.interimResults = false; // Only final results - no duplicates
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      const result = event.results[0]?.[0]?.transcript || '';
      if (result.trim()) {
        setTranscript(result);
        processTranscript(result);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Microphone error: ' + event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart for next command if still in listening mode
      if (recognitionRef.current) {
        try {
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 300);
        } catch { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.success('🎤 Voice AI active');
  }, [processTranscript]);

  // Stop listening
  const stopListening = useCallback(() => {
    const ref = recognitionRef.current;
    recognitionRef.current = null; // Clear ref first to prevent auto-restart
    if (ref) {
      ref.onend = null;
      ref.stop();
    }
    setIsListening(false);
    setTranscript('');
    window.speechSynthesis?.cancel();
  }, []);

  // Toggle
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      if (ref) {
        ref.onend = null;
        ref.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    toggleListening,
    startListening,
    stopListening,
  };
}
