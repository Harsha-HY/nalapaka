import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Banknote, Smartphone } from 'lucide-react';

interface PaymentOptionsModalProps {
  open: boolean;
  onSelect: (method: 'Cash' | 'UPI') => void;
  onClose: () => void;
  totalAmount: number;
}

export function PaymentOptionsModal({ open, onSelect, onClose, totalAmount }: PaymentOptionsModalProps) {
  const { language } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {language === 'kn' ? 'ಪಾವತಿ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ' : 'Select Payment Method'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'kn' ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'Total Amount'}: ₹{totalAmount}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="outline"
            className="h-20 text-lg flex flex-col items-center justify-center gap-2"
            onClick={() => onSelect('Cash')}
          >
            <Banknote className="h-8 w-8" />
            {language === 'kn' ? 'ನಗದು ಮೂಲಕ ಪಾವತಿಸಿ' : 'Pay through CASH'}
          </Button>
          <Button
            variant="outline"
            className="h-20 text-lg flex flex-col items-center justify-center gap-2"
            onClick={() => onSelect('UPI')}
          >
            <Smartphone className="h-8 w-8" />
            {language === 'kn' ? 'UPI ಮೂಲಕ ಪಾವತಿಸಿ' : 'Pay through UPI'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
