import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, ExternalLink } from 'lucide-react';

interface UPIPaymentModalProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentInitiated: () => void;
}

// UPI receiver number (private - not displayed to users)
const UPI_RECEIVER = '8951525788';

export function UPIPaymentModal({ open, onClose, totalAmount, onPaymentInitiated }: UPIPaymentModalProps) {
  const { language } = useLanguage();

  const handleUPIPayment = () => {
    // Create UPI deep link
    const upiUrl = `upi://pay?pa=${UPI_RECEIVER}@paytm&pn=Nalapaka&am=${totalAmount}&cu=INR&tn=Food Order Payment`;
    
    // Try to open UPI app
    window.location.href = upiUrl;
    
    // Mark payment as initiated
    onPaymentInitiated();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Smartphone className="h-6 w-6" />
            {language === 'kn' ? 'UPI ಪಾವತಿ' : 'UPI Payment'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'kn' ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'Total Amount'}: ₹{totalAmount}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-center text-muted-foreground">
            {language === 'kn' 
              ? 'ನಿಮ್ಮ UPI ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯಲು ಕ್ಲಿಕ್ ಮಾಡಿ' 
              : 'Click to open your UPI app'}
          </p>
          
          <Button
            className="h-14 text-lg"
            onClick={handleUPIPayment}
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            {language === 'kn' ? 'UPI ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯಿರಿ' : 'Open UPI App'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            {language === 'kn' 
              ? 'Google Pay, PhonePe, Paytm ಅಥವಾ ಯಾವುದೇ UPI ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಿ' 
              : 'Use Google Pay, PhonePe, Paytm or any UPI app'}
          </p>
          
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-center text-yellow-700 dark:text-yellow-300">
              {language === 'kn' 
                ? 'ಪಾವತಿ ಮಾಡಿದ ನಂತರ, ಮ್ಯಾನೇಜರ್ ದೃಢೀಕರಿಸುತ್ತಾರೆ' 
                : 'After payment, the manager will confirm'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
